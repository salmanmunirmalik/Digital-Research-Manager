/**
 * Protocol Collaboration API Routes
 * Handles real-time collaboration, comments, version control, and forking
 */

import { Router } from 'express';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

/**
 * Add collaborator to protocol
 * POST /api/protocol-collaboration/:protocolId/collaborators
 */
router.post('/:protocolId/collaborators', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;
    const { userId, role = 'viewer' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user has permission to add collaborators
    const protocol = await pool.query(
      `SELECT created_by, privacy_level FROM protocols WHERE id = $1`,
      [protocolId]
    );

    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const protocolData = protocol.rows[0];
    if (protocolData.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Add collaborator
    const result = await pool.query(
      `INSERT INTO protocol_collaborators (protocol_id, user_id, role, last_active_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (protocol_id, user_id) 
       DO UPDATE SET role = $3, last_active_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [protocolId, userId, role]
    );

    res.json({
      success: true,
      collaborator: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator', details: error.message });
  }
});

/**
 * Get protocol collaborators
 * GET /api/protocol-collaboration/:protocolId/collaborators
 */
router.get('/:protocolId/collaborators', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;

    const result = await pool.query(
      `SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.email,
        u.avatar_url
       FROM protocol_collaborators c
       JOIN users u ON c.user_id = u.id
       WHERE c.protocol_id = $1
       ORDER BY c.joined_at DESC`,
      [protocolId]
    );

    res.json({
      collaborators: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators', details: error.message });
  }
});

/**
 * Add comment to protocol
 * POST /api/protocol-collaboration/:protocolId/comments
 */
router.post('/:protocolId/comments', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;
    const { content, stepId, parentCommentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const result = await pool.query(
      `INSERT INTO protocol_comments (protocol_id, user_id, parent_comment_id, step_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [protocolId, req.user.id, parentCommentId || null, stepId || null, content]
    );

    // Get comment with user info
    const commentWithUser = await pool.query(
      `SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url
       FROM protocol_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.json({
      success: true,
      comment: commentWithUser.rows[0]
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

/**
 * Get protocol comments
 * GET /api/protocol-collaboration/:protocolId/comments
 */
router.get('/:protocolId/comments', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;
    const { stepId } = req.query;

    let query = `
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url
       FROM protocol_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.protocol_id = $1
    `;
    const params: any[] = [protocolId];

    if (stepId) {
      query += ` AND c.step_id = $2`;
      params.push(stepId);
    }

    query += ` ORDER BY c.created_at ASC`;

    const result = await pool.query(query, params);

    // Organize comments into threads
    const comments = result.rows;
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach((comment: any) => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    comments.forEach((comment: any) => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.json({
      comments: rootComments
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

/**
 * Fork protocol (create a copy)
 * POST /api/protocol-collaboration/:protocolId/fork
 */
router.post('/:protocolId/fork', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;
    const { title, description, modifications } = req.body;

    // Get original protocol
    const original = await pool.query(
      `SELECT * FROM protocols WHERE id = $1`,
      [protocolId]
    );

    if (original.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const originalProtocol = original.rows[0];

    // Create forked protocol
    const forkedResult = await pool.query(
      `INSERT INTO protocols (
        title, description, category, version, author_id, lab_id,
        content, materials, equipment, safety_notes, tags, privacy_level,
        is_approved, difficulty_level, estimated_duration
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        title || `${originalProtocol.title} (Forked)`,
        description || originalProtocol.description,
        originalProtocol.category,
        '1.0',
        req.user.id,
        req.user.lab_id || originalProtocol.lab_id,
        originalProtocol.content,
        originalProtocol.materials,
        originalProtocol.equipment,
        originalProtocol.safety_notes,
        originalProtocol.tags,
        'personal',
        true,
        originalProtocol.difficulty_level,
        originalProtocol.estimated_duration
      ]
    );

    const forkedProtocol = forkedResult.rows[0];

    // Record fork relationship
    await pool.query(
      `INSERT INTO protocol_forks (original_protocol_id, forked_protocol_id, forked_by, fork_reason)
       VALUES ($1, $2, $3, $4)`,
      [protocolId, forkedProtocol.id, req.user.id, modifications || 'User fork']
    );

    res.json({
      success: true,
      protocol: forkedProtocol,
      message: 'Protocol forked successfully'
    });
  } catch (error: any) {
    console.error('Error forking protocol:', error);
    res.status(500).json({ error: 'Failed to fork protocol', details: error.message });
  }
});

/**
 * Create protocol version
 * POST /api/protocol-collaboration/:protocolId/versions
 */
router.post('/:protocolId/versions', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;
    const { versionNumber, changelog, parentVersionId } = req.body;

    if (!versionNumber) {
      return res.status(400).json({ error: 'Version number is required' });
    }

    // Check if version already exists
    const existing = await pool.query(
      `SELECT id FROM protocol_versions 
       WHERE protocol_id = $1 AND version_number = $2`,
      [protocolId, versionNumber]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Version number already exists' });
    }

    // Create version record
    const result = await pool.query(
      `INSERT INTO protocol_versions (protocol_id, version_number, parent_version_id, changelog, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [protocolId, versionNumber, parentVersionId || null, changelog || '', req.user.id]
    );

    // Update protocol version
    await pool.query(
      `UPDATE protocols SET version = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [versionNumber, protocolId]
    );

    res.json({
      success: true,
      version: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: 'Failed to create version', details: error.message });
  }
});

/**
 * Get protocol versions
 * GET /api/protocol-collaboration/:protocolId/versions
 */
router.get('/:protocolId/versions', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;

    const result = await pool.query(
      `SELECT 
        v.*,
        u.first_name,
        u.last_name,
        u.username
       FROM protocol_versions v
       JOIN users u ON v.created_by = u.id
       WHERE v.protocol_id = $1
       ORDER BY v.created_at DESC`,
      [protocolId]
    );

    res.json({
      versions: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions', details: error.message });
  }
});

/**
 * Get protocol forks
 * GET /api/protocol-collaboration/:protocolId/forks
 */
router.get('/:protocolId/forks', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;

    const result = await pool.query(
      `SELECT 
        f.*,
        p.title as forked_protocol_title,
        u.first_name,
        u.last_name,
        u.username
       FROM protocol_forks f
       JOIN protocols p ON f.forked_protocol_id = p.id
       JOIN users u ON f.forked_by = u.id
       WHERE f.original_protocol_id = $1
       ORDER BY f.created_at DESC`,
      [protocolId]
    );

    res.json({
      forks: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching forks:', error);
    res.status(500).json({ error: 'Failed to fetch forks', details: error.message });
  }
});

export default router;

