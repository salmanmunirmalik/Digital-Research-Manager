/**
 * Write Together API — collaborators, invitations, presence, section locks, SSE.
 */

import { Router, Request, Response } from 'express';
import {
  WritingCollabService,
  CollabRole,
  AccessScope,
} from '../services/writing/WritingCollabService.js';
import pool from '../../database/config.js';

const router = Router({ mergeParams: true });

function displayName(req: Request): string {
  const u = req.user as any;
  if (!u) return 'Collaborator';
  const full = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim();
  return full || u.username || u.email || 'Collaborator';
}

async function requireAccess(req: Request, res: Response, need: 'read' | 'edit' | 'manage') {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  const documentId = String(req.params.id || req.params.documentId);
  const access = await WritingCollabService.resolveAccess(documentId, req.user.id);
  if (!access) {
    res.status(404).json({ error: 'Document not found or access denied' });
    return null;
  }
  if (need === 'edit' && !access.canEdit) {
    res.status(403).json({ error: 'Edit access required' });
    return null;
  }
  if (need === 'manage' && !access.canManage) {
    res.status(403).json({ error: 'Only the main author can manage collaborators' });
    return null;
  }
  return access;
}

/** GET /documents/:id/collaborators */
router.get('/collaborators', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'read');
    if (!access) return;
    await WritingCollabService.ensureOwnerCollaborator(
      access.documentId,
      (await WritingCollabService.getDocumentRow(access.documentId))!.user_id
    );
    const collaborators = await WritingCollabService.listCollaborators(access.documentId);
    res.json({ success: true, collaborators, access });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to list collaborators' });
  }
});

/** PATCH /documents/:id/collaborators/:collabId */
router.patch('/collaborators/:collabId', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'manage');
    if (!access) return;
    await WritingCollabService.updateCollaborator(access.documentId, req.params.collabId, {
      role: req.body.role as CollabRole | undefined,
      accessScope: req.body.accessScope as AccessScope | undefined,
      sectionIds: req.body.sectionIds,
      status: req.body.status,
    });
    WritingCollabService.emit(access.documentId, { type: 'acl_updated' });
    const collaborators = await WritingCollabService.listCollaborators(access.documentId);
    res.json({ success: true, collaborators });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Update failed' });
  }
});

/** DELETE /documents/:id/collaborators/:collabId */
router.delete('/collaborators/:collabId', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'manage');
    if (!access) return;
    await WritingCollabService.updateCollaborator(access.documentId, req.params.collabId, {
      status: 'revoked',
    });
    WritingCollabService.emit(access.documentId, { type: 'acl_updated' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Remove failed' });
  }
});

/** POST /documents/:id/invitations */
router.post('/invitations', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'manage');
    if (!access) return;
    const role = (req.body.role || 'editor') as CollabRole;
    const accessScope = (req.body.accessScope || 'entire') as AccessScope;
    const sectionIds: string[] = Array.isArray(req.body.sectionIds) ? req.body.sectionIds : [];
    if (accessScope === 'sections' && sectionIds.length === 0) {
      return res.status(400).json({ error: 'Select at least one section for section-scoped access' });
    }

    let invitedUserId = req.body.userId || null;
    let email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;

    if (invitedUserId && !email) {
      const u = await pool.query(`SELECT email FROM users WHERE id = $1`, [invitedUserId]);
      email = u.rows?.[0]?.email || null;
    }
    if (email && !invitedUserId) {
      const u = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (u.rows?.[0]) invitedUserId = u.rows[0].id;
    }

    if (!email && !invitedUserId && !req.body.linkOnly) {
      return res.status(400).json({
        error: 'Provide email, userId, or linkOnly:true for a shareable invite link',
      });
    }

    const invite = await WritingCollabService.createInvitation({
      documentId: access.documentId,
      invitedBy: req.user!.id,
      email: email || null,
      invitedUserId: invitedUserId || null,
      role: role === 'owner' ? 'editor' : role,
      accessScope,
      sectionIds,
      message: req.body.message || null,
    });

    res.status(201).json({ success: true, invitation: invite });
  } catch (e: any) {
    console.error('create invitation error:', e);
    res.status(500).json({ error: e.message || 'Invite failed' });
  }
});

/** GET /documents/:id/invitations */
router.get('/invitations', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'manage');
    if (!access) return;
    const r = await pool.query(
      `SELECT id, token, email, invited_user_id, role, access_scope, section_ids, status,
              expires_at, created_at, message
       FROM writing_invitations WHERE document_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [access.documentId]
    );
    res.json({
      success: true,
      invitations: (r.rows || []).map((row: any) => ({
        id: row.id,
        token: row.token,
        email: row.email,
        invitedUserId: row.invited_user_id,
        role: row.role,
        accessScope: row.access_scope,
        sectionIds: Array.isArray(row.section_ids)
          ? row.section_ids
          : typeof row.section_ids === 'string'
            ? JSON.parse(row.section_ids || '[]')
            : [],
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        message: row.message,
        url: `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/writing-studio?invite=${row.token}`,
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to list invitations' });
  }
});

/** DELETE /documents/:id/invitations/:inviteId — revoke a pending invite */
router.delete('/invitations/:inviteId', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'manage');
    if (!access) return;
    const inviteId = String(req.params.inviteId || '').trim();
    if (!inviteId) return res.status(400).json({ error: 'inviteId required' });
    const r = await pool.query(
      `UPDATE writing_invitations
       SET status = 'revoked'
       WHERE id = $1 AND document_id = $2 AND status = 'pending'`,
      [inviteId, access.documentId]
    );
    if (!r.affectedRows) {
      return res.status(404).json({ error: 'Pending invitation not found' });
    }
    WritingCollabService.emit(access.documentId, { type: 'acl_updated' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Revoke failed' });
  }
});

/** POST /documents/:id/presence */
router.post('/presence', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'read');
    if (!access) return;
    await WritingCollabService.touchPresence({
      documentId: access.documentId,
      userId: req.user!.id,
      displayName: displayName(req),
      sectionId: req.body.sectionId || null,
    });
    if (req.body.sectionId && access.canEdit) {
      await WritingCollabService.heartbeatLock(
        access.documentId,
        String(req.body.sectionId),
        req.user!.id
      );
    }
    WritingCollabService.emit(access.documentId, {
      type: 'presence',
      userId: req.user!.id,
      sectionId: req.body.sectionId || null,
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Presence failed' });
  }
});

/** GET /documents/:id/collab-state */
router.get('/collab-state', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'read');
    if (!access) return;
    const doc = await WritingCollabService.getDocumentRow(access.documentId);
    const [presence, locks, collaborators] = await Promise.all([
      WritingCollabService.listPresence(access.documentId),
      WritingCollabService.listLocks(access.documentId),
      WritingCollabService.listCollaborators(access.documentId),
    ]);
    res.json({
      success: true,
      access,
      revision: Number(doc?.content_revision || 1),
      updatedAt: doc?.updated_at,
      presence,
      locks,
      collaborators,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to load collab state' });
  }
});

/** POST /documents/:id/locks/:sectionId */
router.post('/locks/:sectionId', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'edit');
    if (!access) return;
    if (!WritingCollabService.canEditSection(access, req.params.sectionId)) {
      return res.status(403).json({ error: 'You do not have edit access to this section' });
    }
    const result = await WritingCollabService.acquireLock({
      documentId: access.documentId,
      sectionId: req.params.sectionId,
      userId: req.user!.id,
      displayName: displayName(req),
    });
    if (!result.ok) {
      return res.status(409).json({
        error: `${result.lock.displayName || 'Someone'} is editing this section`,
        lock: result.lock,
      });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lock failed' });
  }
});

/** DELETE /documents/:id/locks/:sectionId */
router.delete('/locks/:sectionId', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'edit');
    if (!access) return;
    await WritingCollabService.releaseLock(
      access.documentId,
      req.params.sectionId,
      req.user!.id
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Unlock failed' });
  }
});

/** GET /documents/:id/events — Server-Sent Events for live sync */
router.get('/events', async (req, res) => {
  try {
    const access = await requireAccess(req, res, 'read');
    if (!access) return;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`data: ${JSON.stringify({ type: 'connected', documentId: access.documentId })}\n\n`);

    const unsub = WritingCollabService.subscribe(access.documentId, (ev) => {
      try {
        res.write(`data: ${JSON.stringify(ev)}\n\n`);
      } catch {
        /* closed */
      }
    });

    const ping = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        /* closed */
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(ping);
      unsub();
    });
  } catch (e: any) {
    if (!res.headersSent) res.status(500).json({ error: e.message || 'SSE failed' });
  }
});

export default router;
