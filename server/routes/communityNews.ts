/**
 * Community news & updates - feed with likes, comments, saves, and work opportunities.
 */
import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import { POSTED_BY_SQL, nameFromAuthUser, userDisplayName } from '../utils/postedBy.js';
import { canManageResource } from '../utils/ownership.js';

const router: Router = Router();

const POST_TYPES = new Set(['news', 'update', 'idea', 'blog', 'opinion', 'opportunity']);

const parseJson = (value: unknown, fallback: unknown = []) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapPost = (row: any, engagement: {
  likeCount?: number;
  likedByMe?: boolean;
  commentCount?: number;
  savedByMe?: boolean;
} = {}) => ({
  id: row.id,
  userId: row.user_id,
  authorName: userDisplayName({
    posted_by_name: row.author_name,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  }),
  title: row.title,
  body: row.body || '',
  postType: row.post_type,
  tags: parseJson(row.tags, []),
  linkUrl: row.link_url || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  likeCount: Number(engagement.likeCount ?? row.like_count ?? 0),
  likedByMe: Boolean(engagement.likedByMe ?? row.liked_by_me),
  commentCount: Number(engagement.commentCount ?? row.comment_count ?? 0),
  savedByMe: Boolean(engagement.savedByMe ?? row.saved_by_me),
});

const mapComment = (row: any) => ({
  id: row.id,
  postId: row.post_id,
  userId: row.user_id,
  authorName: userDisplayName({
    posted_by_name: row.author_name,
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  }),
  body: row.body || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function loadEngagementMaps(postIds: string[], userId?: string) {
  const likeCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  const savedByMe = new Set<string>();

  if (postIds.length === 0) {
    return { likeCounts, commentCounts, likedByMe, savedByMe };
  }

  const placeholders = postIds.map((_, i) => `$${i + 1}`).join(', ');

  const [likesRes, commentsRes] = await Promise.all([
    pool.query(
      `SELECT post_id, COUNT(*) AS cnt FROM community_post_likes
       WHERE post_id IN (${placeholders}) GROUP BY post_id`,
      postIds
    ),
    pool.query(
      `SELECT post_id, COUNT(*) AS cnt FROM community_post_comments
       WHERE post_id IN (${placeholders}) GROUP BY post_id`,
      postIds
    ),
  ]);

  likesRes.rows.forEach((r: any) => likeCounts.set(r.post_id, Number(r.cnt) || 0));
  commentsRes.rows.forEach((r: any) => commentCounts.set(r.post_id, Number(r.cnt) || 0));

  if (userId) {
    const userParams = [...postIds, userId];
    const userPh = postIds.map((_, i) => `$${i + 1}`).join(', ');
    const userIdx = postIds.length + 1;
    const [myLikes, mySaves] = await Promise.all([
      pool.query(
        `SELECT post_id FROM community_post_likes
         WHERE post_id IN (${userPh}) AND user_id = $${userIdx}`,
        userParams
      ),
      pool.query(
        `SELECT post_id FROM community_post_saves
         WHERE post_id IN (${userPh}) AND user_id = $${userIdx}`,
        userParams
      ),
    ]);
    myLikes.rows.forEach((r: any) => likedByMe.add(r.post_id));
    mySaves.rows.forEach((r: any) => savedByMe.add(r.post_id));
  }

  return { likeCounts, commentCounts, likedByMe, savedByMe };
}

router.get('/', async (req: any, res) => {
  try {
    const { type, search, limit: rawLimit } = req.query;
    const limit = Math.min(Math.max(Number(rawLimit) || 50, 1), 100);
    const params: unknown[] = [];
    let param = 0;
    let query = `
      SELECT p.*,
        COALESCE(NULLIF(p.author_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS author_name,
        u.first_name, u.last_name, u.username
      FROM community_posts p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.is_published = 1
    `;

    if (type && type !== 'all' && POST_TYPES.has(String(type))) {
      param += 1;
      query += ` AND p.post_type = $${param}`;
      params.push(String(type));
    }

    if (search && String(search).trim()) {
      param += 1;
      const term = `%${String(search).trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(p.title) LIKE $${param}
        OR LOWER(p.body) LIKE $${param}
        OR LOWER(COALESCE(p.author_name, '')) LIKE $${param}
      )`;
      params.push(term);
    }

    param += 1;
    query += ` ORDER BY p.created_at DESC LIMIT $${param}`;
    params.push(limit);

    const result = await pool.query(query, params);
    const ids = result.rows.map((r: any) => r.id);
    const engagement = await loadEngagementMaps(ids, req.user?.id);

    res.json({
      posts: result.rows.map((row: any) =>
        mapPost(row, {
          likeCount: engagement.likeCounts.get(row.id) || 0,
          commentCount: engagement.commentCounts.get(row.id) || 0,
          likedByMe: engagement.likedByMe.has(row.id),
          savedByMe: engagement.savedByMe.has(row.id),
        })
      ),
    });
  } catch (error: any) {
    console.error('Error listing community posts:', error);
    res.status(500).json({ error: error.message || 'Failed to list posts' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, body, postType, tags, linkUrl } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!body || !String(body).trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const type = POST_TYPES.has(String(postType || ''))
      ? String(postType)
      : 'update';

    const id = crypto.randomUUID();
    const authorName = nameFromAuthUser(req.user);
    const tagList = Array.isArray(tags)
      ? tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [];

    await pool.query(
      `INSERT INTO community_posts (
        id, user_id, author_name, title, body, post_type, tags, link_url, is_published
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1)`,
      [
        id,
        userId,
        authorName,
        String(title).trim().slice(0, 500),
        String(body).trim(),
        type,
        JSON.stringify(tagList),
        linkUrl ? String(linkUrl).trim().slice(0, 1000) : null,
      ]
    );

    const created = await pool.query(
      `SELECT p.*,
        COALESCE(NULLIF(p.author_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS author_name,
        u.first_name, u.last_name, u.username
       FROM community_posts p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );

    res.status(201).json({
      post: mapPost(created.rows[0], {
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
        savedByMe: false,
      }),
    });
  } catch (error: any) {
    console.error('Error creating community post:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

router.delete('/comments/:commentId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const existing = await pool.query(
      `SELECT * FROM community_post_comments WHERE id = $1`,
      [req.params.commentId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (!canManageResource(existing.rows[0].user_id, req.user)) {
      return res.status(403).json({ error: 'Not allowed to delete this comment' });
    }
    await pool.query(`DELETE FROM community_post_comments WHERE id = $1`, [req.params.commentId]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: error.message || 'Failed to delete comment' });
  }
});

router.post('/:id/like', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const postId = req.params.id;
    const post = await pool.query(`SELECT id FROM community_posts WHERE id = $1`, [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await pool.query(
      `SELECT id FROM community_post_likes WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    let liked: boolean;
    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      liked = false;
    } else {
      await pool.query(
        `INSERT INTO community_post_likes (id, post_id, user_id) VALUES ($1, $2, $3)`,
        [crypto.randomUUID(), postId, userId]
      );
      liked = true;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM community_post_likes WHERE post_id = $1`,
      [postId]
    );
    res.json({ liked, likeCount: Number(countRes.rows[0]?.cnt) || 0 });
  } catch (error: any) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle like' });
  }
});

router.post('/:id/save', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const postId = req.params.id;
    const post = await pool.query(`SELECT id FROM community_posts WHERE id = $1`, [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await pool.query(
      `SELECT id FROM community_post_saves WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );

    let saved: boolean;
    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM community_post_saves WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );
      saved = false;
    } else {
      await pool.query(
        `INSERT INTO community_post_saves (id, post_id, user_id) VALUES ($1, $2, $3)`,
        [crypto.randomUUID(), postId, userId]
      );
      saved = true;
    }

    res.json({ saved });
  } catch (error: any) {
    console.error('Error toggling save:', error);
    res.status(500).json({ error: error.message || 'Failed to toggle save' });
  }
});

router.get('/:id/comments', async (req: any, res) => {
  try {
    const postId = req.params.id;
    const post = await pool.query(`SELECT id FROM community_posts WHERE id = $1`, [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await pool.query(
      `SELECT c.*,
        COALESCE(NULLIF(c.author_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS author_name,
        u.first_name, u.last_name, u.username
       FROM community_post_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC
       LIMIT 200`,
      [postId]
    );
    res.json({ comments: result.rows.map(mapComment) });
  } catch (error: any) {
    console.error('Error listing comments:', error);
    res.status(500).json({ error: error.message || 'Failed to list comments' });
  }
});

router.post('/:id/comments', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const postId = req.params.id;
    const { body } = req.body;
    if (!body || !String(body).trim()) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const post = await pool.query(`SELECT id FROM community_posts WHERE id = $1`, [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const id = crypto.randomUUID();
    const authorName = nameFromAuthUser(req.user);
    await pool.query(
      `INSERT INTO community_post_comments (id, post_id, user_id, author_name, body)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, postId, userId, authorName, String(body).trim().slice(0, 4000)]
    );

    const created = await pool.query(
      `SELECT c.*,
        COALESCE(NULLIF(c.author_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS author_name,
        u.first_name, u.last_name, u.username
       FROM community_post_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [id]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) AS cnt FROM community_post_comments WHERE post_id = $1`,
      [postId]
    );

    res.status(201).json({
      comment: mapComment(created.rows[0]),
      commentCount: Number(countRes.rows[0]?.cnt) || 0,
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: error.message || 'Failed to create comment' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const existing = await pool.query(
      `SELECT * FROM community_posts WHERE id = $1`,
      [req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!canManageResource(existing.rows[0].user_id, req.user)) {
      return res.status(403).json({ error: 'Not allowed to edit this post' });
    }

    const { title, body, postType, tags, linkUrl } = req.body;
    const type =
      postType && POST_TYPES.has(String(postType))
        ? String(postType)
        : existing.rows[0].post_type;
    const tagList = Array.isArray(tags)
      ? tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 12)
      : parseJson(existing.rows[0].tags, []);

    await pool.query(
      `UPDATE community_posts SET
        title = COALESCE($1, title),
        body = COALESCE($2, body),
        post_type = $3,
        tags = $4,
        link_url = $5,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        title != null ? String(title).trim().slice(0, 500) : null,
        body != null ? String(body).trim() : null,
        type,
        JSON.stringify(tagList),
        linkUrl !== undefined
          ? linkUrl
            ? String(linkUrl).trim().slice(0, 1000)
            : null
          : existing.rows[0].link_url,
        req.params.id,
      ]
    );

    const updated = await pool.query(
      `SELECT p.*,
        COALESCE(NULLIF(p.author_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS author_name,
        u.first_name, u.last_name, u.username
       FROM community_posts p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    const engagement = await loadEngagementMaps([req.params.id], userId);
    res.json({
      post: mapPost(updated.rows[0], {
        likeCount: engagement.likeCounts.get(req.params.id) || 0,
        commentCount: engagement.commentCounts.get(req.params.id) || 0,
        likedByMe: engagement.likedByMe.has(req.params.id),
        savedByMe: engagement.savedByMe.has(req.params.id),
      }),
    });
  } catch (error: any) {
    console.error('Error updating community post:', error);
    res.status(500).json({ error: error.message || 'Failed to update post' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const existing = await pool.query(
      `SELECT user_id FROM community_posts WHERE id = $1`,
      [req.params.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!canManageResource(existing.rows[0].user_id, req.user)) {
      return res.status(403).json({ error: 'Not allowed to delete this post' });
    }

    const postId = req.params.id;
    await pool.query(`DELETE FROM community_post_likes WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM community_post_comments WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM community_post_saves WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM community_posts WHERE id = $1`, [postId]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting community post:', error);
    res.status(500).json({ error: error.message || 'Failed to delete post' });
  }
});

export default router;
