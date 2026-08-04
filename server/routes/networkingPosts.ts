/**
 * Public networking posts - collaboration calls attributed to a named user.
 */
import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import { POSTED_BY_SQL, userDisplayName, nameFromAuthUser } from '../utils/postedBy.js';

const router: Router = Router();

const parseJson = (value: unknown, fallback: unknown = []) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapPost = (row: any) => ({
  id: row.id,
  createdBy: row.created_by,
  postedByName: userDisplayName({
    posted_by_name: row.posted_by_name,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  }),
  title: row.title,
  body: row.body || '',
  postType: row.post_type,
  tags: parseJson(row.tags, []),
  institution: row.institution || '',
  location: row.location || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*,
        COALESCE(NULLIF(p.posted_by_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM networking_posts p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.is_published = 1
       ORDER BY p.created_at DESC
       LIMIT 100`
    );
    res.json({ posts: result.rows.map(mapPost) });
  } catch (error: any) {
    console.error('Error listing networking posts:', error);
    res.status(500).json({ error: error.message || 'Failed to list posts' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { title, body, postType, tags, institution, location } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = crypto.randomUUID();
    const posterName = nameFromAuthUser(req.user);
    await pool.query(
      `INSERT INTO networking_posts (
        id, created_by, posted_by_name, title, body, post_type, tags, institution, location, is_published
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1)`,
      [
        id,
        userId,
        posterName,
        String(title).trim(),
        body || '',
        postType || 'looking_for_collaborator',
        JSON.stringify(Array.isArray(tags) ? tags : []),
        institution || '',
        location || '',
      ]
    );

    const created = await pool.query(
      `SELECT p.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM networking_posts p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
      [id]
    );
    res.status(201).json({ post: mapPost(created.rows[0]) });
  } catch (error: any) {
    console.error('Error creating networking post:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM networking_posts WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (existing.rows[0].created_by !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only the poster can update this post' });
    }

    const b = req.body;
    await pool.query(
      `UPDATE networking_posts SET
        title = COALESCE($1, title),
        body = COALESCE($2, body),
        post_type = COALESCE($3, post_type),
        tags = COALESCE($4, tags),
        institution = COALESCE($5, institution),
        location = COALESCE($6, location),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        b.title ?? null,
        b.body ?? null,
        b.postType ?? null,
        b.tags != null ? JSON.stringify(b.tags) : null,
        b.institution ?? null,
        b.location ?? null,
        id,
      ]
    );

    const updated = await pool.query(
      `SELECT p.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM networking_posts p
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.id = $1`,
      [id]
    );
    res.json({ post: mapPost(updated.rows[0]) });
  } catch (error: any) {
    console.error('Error updating networking post:', error);
    res.status(500).json({ error: error.message || 'Failed to update post' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM networking_posts WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (existing.rows[0].created_by !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only the poster can delete this post' });
    }
    await pool.query(`DELETE FROM networking_posts WHERE id = $1`, [id]);
    res.json({ message: 'Post deleted' });
  } catch (error: any) {
    console.error('Error deleting networking post:', error);
    res.status(500).json({ error: error.message || 'Failed to delete post' });
  }
});

export default router;
