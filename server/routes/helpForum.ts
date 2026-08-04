/**
 * Help Forum - Q&A with owner CRUD for requests and responses.
 */
import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import { POSTED_BY_SQL, userDisplayName, nameFromAuthUser } from '../utils/postedBy.js';
import { canManageResource } from '../utils/ownership.js';

const router: Router = Router();

const parseTags = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const toTagsJson = (value: unknown) => JSON.stringify(parseTags(value));

const mapResponse = (row: any) => ({
  id: row.id,
  requestId: row.request_id,
  authorId: row.author_id,
  authorName: userDisplayName({
    posted_by_name: row.posted_by_name,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  }),
  content: row.content || '',
  isSolution: Boolean(Number(row.is_solution)),
  upvotes: Number(row.upvotes) || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapRequest = (row: any, responses: any[] = []) => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  category: row.category || 'General',
  urgency: row.urgency || 'Medium',
  visibility: row.visibility || 'public',
  status: row.status || 'Open',
  tags: parseTags(row.tags),
  authorId: row.author_id,
  authorName: userDisplayName({
    posted_by_name: row.posted_by_name,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  }),
  protocolId: row.protocol_id || null,
  upvotes: Number(row.upvotes) || 0,
  views: Number(row.views) || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  resolvedAt: row.resolved_at,
  responses,
});

router.get('/requests', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
        COALESCE(NULLIF(r.posted_by_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM help_requests r
       LEFT JOIN users u ON u.id = r.author_id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );

    const ids = result.rows.map((r: any) => r.id);
    let responsesByRequest: Record<string, any[]> = {};
    if (ids.length > 0) {
      const placeholders = ids.map((_: string, i: number) => `$${i + 1}`).join(', ');
      const resp = await pool.query(
        `SELECT hr.*,
          COALESCE(NULLIF(hr.posted_by_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS posted_by_name,
          u.first_name, u.last_name, u.username
         FROM help_responses hr
         LEFT JOIN users u ON u.id = hr.author_id
         WHERE hr.request_id IN (${placeholders})
         ORDER BY hr.created_at ASC`,
        ids
      );
      responsesByRequest = resp.rows.reduce((acc: Record<string, any[]>, row: any) => {
        const key = row.request_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(mapResponse(row));
        return acc;
      }, {});
    }

    res.json({
      requests: result.rows.map((row: any) => mapRequest(row, responsesByRequest[row.id] || [])),
    });
  } catch (error: any) {
    console.error('Error listing help requests:', error);
    res.status(500).json({ error: error.message || 'Failed to list help requests' });
  }
});

router.get('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*,
        COALESCE(NULLIF(r.posted_by_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM help_requests r
       LEFT JOIN users u ON u.id = r.author_id
       WHERE r.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Help request not found' });
    }

    await pool.query(`UPDATE help_requests SET views = COALESCE(views, 0) + 1 WHERE id = $1`, [id]);

    const resp = await pool.query(
      `SELECT hr.*,
        COALESCE(NULLIF(hr.posted_by_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM help_responses hr
       LEFT JOIN users u ON u.id = hr.author_id
       WHERE hr.request_id = $1
       ORDER BY hr.created_at ASC`,
      [id]
    );

    const row = result.rows[0];
    row.views = Number(row.views || 0) + 1;
    res.json({
      request: mapRequest(row, resp.rows.map(mapResponse)),
    });
  } catch (error: any) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch help request' });
  }
});

router.post('/requests', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { title, description, category, urgency, visibility, tags, protocolId } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const id = crypto.randomUUID();
    const posterName = nameFromAuthUser(req.user);
    await pool.query(
      `INSERT INTO help_requests (
        id, title, description, author_id, posted_by_name, protocol_id,
        category, urgency, visibility, status, tags, upvotes, views, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Open',$10,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      [
        id,
        String(title).trim(),
        String(description).trim(),
        userId,
        posterName,
        protocolId || null,
        category || 'General',
        urgency || 'Medium',
        visibility || 'public',
        toTagsJson(tags),
      ]
    );

    const created = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.username
       FROM help_requests r LEFT JOIN users u ON u.id = r.author_id WHERE r.id = $1`,
      [id]
    );
    res.status(201).json({ request: mapRequest(created.rows[0], []) });
  } catch (error: any) {
    console.error('Error creating help request:', error);
    res.status(500).json({ error: error.message || 'Failed to create help request' });
  }
});

router.put('/requests/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM help_requests WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    if (!canManageResource(existing.rows[0].author_id, req.user)) {
      return res.status(403).json({ error: 'Only the author can update this request' });
    }

    const cur = existing.rows[0];
    const { title, description, category, urgency, visibility, tags, status } = req.body;
    await pool.query(
      `UPDATE help_requests SET
        title = $1,
        description = $2,
        category = $3,
        urgency = $4,
        visibility = $5,
        tags = $6,
        status = $7,
        updated_at = CURRENT_TIMESTAMP,
        resolved_at = CASE WHEN $7 IN ('Resolved','Closed') THEN COALESCE(resolved_at, CURRENT_TIMESTAMP) ELSE NULL END
       WHERE id = $8`,
      [
        title != null ? String(title).trim() : cur.title,
        description != null ? String(description).trim() : cur.description,
        category ?? cur.category,
        urgency ?? cur.urgency,
        visibility ?? cur.visibility,
        tags != null ? toTagsJson(tags) : cur.tags,
        status ?? cur.status,
        id,
      ]
    );

    const updated = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.username
       FROM help_requests r LEFT JOIN users u ON u.id = r.author_id WHERE r.id = $1`,
      [id]
    );
    res.json({ request: mapRequest(updated.rows[0]) });
  } catch (error: any) {
    console.error('Error updating help request:', error);
    res.status(500).json({ error: error.message || 'Failed to update help request' });
  }
});

router.delete('/requests/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM help_requests WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    if (!canManageResource(existing.rows[0].author_id, req.user)) {
      return res.status(403).json({ error: 'Only the author can delete this request' });
    }

    await pool.query(`DELETE FROM help_responses WHERE request_id = $1`, [id]);
    await pool.query(`DELETE FROM help_requests WHERE id = $1`, [id]);
    res.json({ message: 'Help request deleted' });
  } catch (error: any) {
    console.error('Error deleting help request:', error);
    res.status(500).json({ error: error.message || 'Failed to delete help request' });
  }
});

router.post('/requests/:id/responses', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { id: requestId } = req.params;
    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Response content is required' });
    }

    const existing = await pool.query(`SELECT id FROM help_requests WHERE id = $1`, [requestId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Help request not found' });
    }

    const id = crypto.randomUUID();
    const posterName = nameFromAuthUser(req.user);
    await pool.query(
      `INSERT INTO help_responses (
        id, request_id, author_id, posted_by_name, content, is_solution, upvotes, created_at
      ) VALUES ($1,$2,$3,$4,$5,0,0,CURRENT_TIMESTAMP)`,
      [id, requestId, userId, posterName, String(content).trim()]
    );
    await pool.query(
      `UPDATE help_requests SET status = CASE WHEN status = 'Open' THEN 'In Progress' ELSE status END,
        updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [requestId]
    );

    const created = await pool.query(
      `SELECT hr.*, u.first_name, u.last_name, u.username
       FROM help_responses hr LEFT JOIN users u ON u.id = hr.author_id WHERE hr.id = $1`,
      [id]
    );
    res.status(201).json({ response: mapResponse(created.rows[0]) });
  } catch (error: any) {
    console.error('Error creating help response:', error);
    res.status(500).json({ error: error.message || 'Failed to create response' });
  }
});

router.put('/responses/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM help_responses WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }
    if (!canManageResource(existing.rows[0].author_id, req.user)) {
      return res.status(403).json({ error: 'Only the author can update this response' });
    }
    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Response content is required' });
    }
    await pool.query(
      `UPDATE help_responses SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [String(content).trim(), id]
    );
    const updated = await pool.query(
      `SELECT hr.*, u.first_name, u.last_name, u.username
       FROM help_responses hr LEFT JOIN users u ON u.id = hr.author_id WHERE hr.id = $1`,
      [id]
    );
    res.json({ response: mapResponse(updated.rows[0]) });
  } catch (error: any) {
    console.error('Error updating help response:', error);
    res.status(500).json({ error: error.message || 'Failed to update response' });
  }
});

router.delete('/responses/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM help_responses WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }
    if (!canManageResource(existing.rows[0].author_id, req.user)) {
      return res.status(403).json({ error: 'Only the author can delete this response' });
    }
    await pool.query(`DELETE FROM help_responses WHERE id = $1`, [id]);
    res.json({ message: 'Response deleted' });
  } catch (error: any) {
    console.error('Error deleting help response:', error);
    res.status(500).json({ error: error.message || 'Failed to delete response' });
  }
});

/** Request author marks a response as the accepted solution. */
router.post('/responses/:id/accept', async (req: any, res) => {
  try {
    const { id } = req.params;
    const resp = await pool.query(`SELECT * FROM help_responses WHERE id = $1`, [id]);
    if (resp.rows.length === 0) {
      return res.status(404).json({ error: 'Response not found' });
    }
    const requestId = resp.rows[0].request_id;
    const request = await pool.query(`SELECT * FROM help_requests WHERE id = $1`, [requestId]);
    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Help request not found' });
    }
    if (!canManageResource(request.rows[0].author_id, req.user)) {
      return res.status(403).json({ error: 'Only the request author can accept a solution' });
    }

    await pool.query(`UPDATE help_responses SET is_solution = 0 WHERE request_id = $1`, [requestId]);
    await pool.query(`UPDATE help_responses SET is_solution = 1 WHERE id = $1`, [id]);
    await pool.query(
      `UPDATE help_requests SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [requestId]
    );
    res.json({ message: 'Solution accepted' });
  } catch (error: any) {
    console.error('Error accepting solution:', error);
    res.status(500).json({ error: error.message || 'Failed to accept solution' });
  }
});

export default router;
