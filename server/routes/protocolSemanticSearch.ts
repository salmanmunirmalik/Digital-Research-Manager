/**
 * Protocol Semantic Search API Routes
 * Advanced semantic search using embeddings and vector similarity
 */

import { Router } from 'express';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

/**
 * Semantic search for protocols
 * POST /api/protocol-search/semantic
 */
router.post('/semantic', authenticateToken, async (req: any, res) => {
  try {
    const { query, limit = 20, filters } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // For now, use PostgreSQL full-text search with semantic hints
    // In production, integrate with vector database (Pinecone, Weaviate, etc.)
    
    // Enhanced search using multiple strategies
    let searchQuery = `
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username as creator_name,
        l.name as lab_name,
        (
          -- Title match (highest weight)
          CASE WHEN p.title ILIKE $1 THEN 10 ELSE 0 END +
          -- Description match
          CASE WHEN p.description ILIKE $1 THEN 5 ELSE 0 END +
          -- Tags match
          CASE WHEN EXISTS (
            SELECT 1 FROM unnest(p.tags) tag 
            WHERE tag ILIKE $1
          ) THEN 3 ELSE 0 END +
          -- Full-text search vector
          ts_rank(p.search_vector, plainto_tsquery('english', $2)) * 2
        ) as relevance_score
      FROM protocols p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN labs l ON p.lab_id = l.id
      WHERE p.is_approved = true
        AND (
          p.title ILIKE $1
          OR p.description ILIKE $1
          OR EXISTS (SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE $1)
          OR p.search_vector @@ plainto_tsquery('english', $2)
        )
    `;

    const params: any[] = [`%${query}%`, query];
    let paramCount = 2;

    // Apply filters
    if (filters?.category) {
      paramCount++;
      searchQuery += ` AND p.category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters?.difficulty) {
      paramCount++;
      searchQuery += ` AND p.difficulty_level = $${paramCount}`;
      params.push(filters.difficulty);
    }

    if (filters?.minSuccessRate) {
      paramCount++;
      searchQuery += ` AND p.success_rate >= $${paramCount}`;
      params.push(filters.minSuccessRate);
    }

    // Privacy filter
    if (req.user.role !== 'admin') {
      paramCount++;
      searchQuery += ` AND (p.privacy_level = 'public' OR p.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${paramCount}
      ))`;
      params.push(req.user.id);
    }

    searchQuery += ` ORDER BY relevance_score DESC, p.usage_count DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(searchQuery, params);

    // Get similar protocols (recommendations)
    const recommendations = await getSimilarProtocols(result.rows[0]?.id, limit);

    res.json({
      results: result.rows,
      recommendations: recommendations,
      query: query,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

/**
 * Get similar protocols
 */
async function getSimilarProtocols(protocolId: string | undefined, limit: number = 5) {
  if (!protocolId) return [];

  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username as creator_name,
        -- Similarity based on category, tags, and success rate
        (
          CASE WHEN p2.category = p.category THEN 3 ELSE 0 END +
          CASE WHEN p2.difficulty_level = p.difficulty_level THEN 2 ELSE 0 END +
          (SELECT COUNT(*) FROM unnest(p.tags) tag 
           WHERE tag = ANY(p2.tags)) * 1
        ) as similarity_score
       FROM protocols p
       JOIN protocols p2 ON p2.id = $1
       JOIN users u ON p.author_id = u.id
       WHERE p.id != $1
         AND p.is_approved = true
       ORDER BY similarity_score DESC
       LIMIT $2`,
      [protocolId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting similar protocols:', error);
    return [];
  }
}

/**
 * Get protocol recommendations based on user history
 * GET /api/protocol-search/recommendations
 */
router.get('/recommendations', authenticateToken, async (req: any, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get user's most used protocol categories
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

    const categories = userCategories.rows.map((r: any) => r.category);

    if (categories.length === 0) {
      // If no history, recommend popular protocols
      const popular = await pool.query(
        `SELECT p.*, u.first_name, u.last_name, u.username as creator_name
         FROM protocols p
         JOIN users u ON p.author_id = u.id
         WHERE p.is_approved = true
           AND p.privacy_level = 'public'
         ORDER BY p.usage_count DESC, p.success_rate DESC
         LIMIT $1`,
        [limit]
      );
      return res.json({ recommendations: popular.rows });
    }

    // Recommend protocols in user's preferred categories
    const recommendations = await pool.query(
      `SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username as creator_name,
        p.success_rate,
        p.usage_count
       FROM protocols p
       JOIN users u ON p.author_id = u.id
       WHERE p.is_approved = true
         AND p.category = ANY($1)
         AND p.id NOT IN (
           SELECT DISTINCT protocol_id 
           FROM protocol_executions 
           WHERE user_id = $2
         )
       ORDER BY p.success_rate DESC, p.usage_count DESC
       LIMIT $3`,
      [categories, req.user.id, limit]
    );

    res.json({
      recommendations: recommendations.rows,
      basedOn: 'Your usage history'
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations', details: error.message });
  }
});

/**
 * Search by intent (what the user wants to achieve)
 * POST /api/protocol-search/intent
 */
router.post('/intent', authenticateToken, async (req: any, res) => {
  try {
    const { intent, context } = req.body;

    if (!intent) {
      return res.status(400).json({ error: 'Intent description is required' });
    }

    // Map common intents to protocol characteristics
    const intentKeywords: { [key: string]: string[] } = {
      'detect': ['detection', 'detect', 'identify', 'measure'],
      'amplify': ['amplification', 'amplify', 'pcr', 'polymerase'],
      'separate': ['separation', 'electrophoresis', 'chromatography', 'purify'],
      'culture': ['culture', 'grow', 'incubate', 'cell'],
      'extract': ['extraction', 'extract', 'isolate', 'purify'],
      'quantify': ['quantification', 'quantify', 'measure', 'count']
    };

    // Find matching keywords
    const matchingKeywords: string[] = [];
    Object.entries(intentKeywords).forEach(([intentKey, keywords]) => {
      if (intent.toLowerCase().includes(intentKey)) {
        matchingKeywords.push(...keywords);
      }
    });

    // Search using intent keywords
    let query = `
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username as creator_name,
        (
          ts_rank(p.search_vector, plainto_tsquery('english', $1)) * 3 +
          CASE WHEN p.title ILIKE ANY($2::text[]) THEN 5 ELSE 0 END +
          CASE WHEN p.description ILIKE ANY($2::text[]) THEN 3 ELSE 0 END
        ) as relevance_score
      FROM protocols p
      JOIN users u ON p.author_id = u.id
      WHERE p.is_approved = true
        AND (
          p.search_vector @@ plainto_tsquery('english', $1)
          OR p.title ILIKE ANY($2::text[])
          OR p.description ILIKE ANY($2::text[])
        )
      ORDER BY relevance_score DESC
      LIMIT 20
    `;

    const keywordPatterns = matchingKeywords.length > 0
      ? matchingKeywords.map(k => `%${k}%`)
      : [`%${intent}%`];

    const result = await pool.query(query, [intent, keywordPatterns]);

    res.json({
      results: result.rows,
      intent: intent,
      matchedKeywords: matchingKeywords,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error in intent search:', error);
    res.status(500).json({ error: 'Intent search failed', details: error.message });
  }
});

export default router;

