/**
 * Protocol Semantic Search — vector hybrid + MySQL-safe fallbacks
 */

import { Router } from 'express';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';
import { ProtocolVectorSearch } from '../services/ProtocolVectorSearch.js';

const router: Router = Router();

/**
 * Semantic / hybrid search for protocols
 * POST /api/protocol-search/semantic
 */
router.post('/semantic', authenticateToken, async (req: any, res) => {
  try {
    const { query, limit = 20, filters } = req.body;

    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const search = await ProtocolVectorSearch.search({
      query: String(query).trim(),
      userId: req.user.id,
      role: req.user.role,
      limit: Number(limit) || 20,
      filters: filters || {},
    });

    const topId = search.results[0]?.id;
    const recommendations = topId
      ? await ProtocolVectorSearch.similar(topId, req.user.id, 5)
      : [];

    res.json({
      results: search.results,
      recommendations,
      query: search.query,
      total: search.total,
      mode: search.mode,
    });
  } catch (error: any) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

/**
 * Search by intent (what the user wants to achieve)
 * POST /api/protocol-search/intent
 */
router.post('/intent', authenticateToken, async (req: any, res) => {
  try {
    const { intent } = req.body;

    if (!intent) {
      return res.status(400).json({ error: 'Intent description is required' });
    }

    const search = await ProtocolVectorSearch.search({
      query: String(intent),
      userId: req.user.id,
      role: req.user.role,
      limit: 20,
    });

    res.json({
      results: search.results,
      intent,
      mode: search.mode,
    });
  } catch (error: any) {
    console.error('Error in intent search:', error);
    res.status(500).json({ error: 'Intent search failed', details: error.message });
  }
});

/**
 * Get protocol recommendations based on user history
 * GET /api/protocol-search/recommendations
 */
router.get('/recommendations', authenticateToken, async (req: any, res) => {
  try {
    const { limit = 10 } = req.query;

    const userCategories = await pool.query(
      `SELECT p.category, COUNT(*) as usage_count
       FROM protocol_executions e
       JOIN protocols p ON e.protocol_id = p.id
       WHERE e.user_id = $1
       GROUP BY p.category
       ORDER BY usage_count DESC
       LIMIT 5`,
      [req.user.id]
    );

    const categories = userCategories.rows.map((r: any) => r.category).filter(Boolean);

    if (categories.length === 0) {
      const popular = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.username as creator_name
         FROM protocols p
         JOIN users u ON p.author_id = u.id
         WHERE COALESCE(p.is_approved, 1) = 1
           AND (p.privacy_level = 'public' OR p.author_id = $1)
         ORDER BY COALESCE(p.usage_count, 0) DESC, COALESCE(p.success_rate, 0) DESC
         LIMIT $2`,
        [req.user.id, Number(limit) || 10]
      );
      return res.json({ recommendations: popular.rows });
    }

    const placeholders = categories.map((_: string, i: number) => `$${i + 2}`).join(', ');
    const recommendations = await pool.query(
      `SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username as creator_name
       FROM protocols p
       JOIN users u ON p.author_id = u.id
       WHERE COALESCE(p.is_approved, 1) = 1
         AND p.category IN (${placeholders})
         AND p.id NOT IN (
           SELECT DISTINCT protocol_id 
           FROM protocol_executions 
           WHERE user_id = $1 AND protocol_id IS NOT NULL
         )
       ORDER BY COALESCE(p.success_rate, 0) DESC, COALESCE(p.usage_count, 0) DESC
       LIMIT $${categories.length + 2}`,
      [req.user.id, ...categories, Number(limit) || 10]
    );

    res.json({
      recommendations: recommendations.rows,
      basedOn: 'Your usage history',
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations', details: error.message });
  }
});

/**
 * Similar protocols by vector similarity
 * GET /api/protocol-search/:id/similar
 */
router.get('/:id/similar', authenticateToken, async (req: any, res) => {
  try {
    const similar = await ProtocolVectorSearch.similar(
      req.params.id,
      req.user.id,
      Number(req.query.limit) || 5
    );
    res.json({ similarProtocols: similar });
  } catch (error: any) {
    console.error('Error getting similar protocols:', error);
    res.status(500).json({ error: 'Failed to get similar protocols' });
  }
});

/**
 * Re-index a protocol embedding
 * POST /api/protocol-search/:id/index
 */
router.post('/:id/index', authenticateToken, async (req: any, res) => {
  try {
    const ok = await ProtocolVectorSearch.indexProtocol(req.params.id, req.user.id);
    res.json({ success: ok });
  } catch (error: any) {
    console.error('Error indexing protocol:', error);
    res.status(500).json({ error: 'Failed to index protocol' });
  }
});

export default router;
