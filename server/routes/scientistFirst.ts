/**
 * The Scientist First Journal API Routes
 * Handles article submissions, reviews, and interactions
 */

import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get all articles
router.get('/articles', async (req, res) => {
  try {
    const { search, domain, type, status } = req.query;
    
    let query = 'SELECT * FROM sfaj_articles WHERE status = $1';
    const params: any[] = ['active'];
    
    if (search) {
      query += ' AND (title ILIKE $' + (params.length + 1) + ' OR abstract ILIKE $' + (params.length + 1) + ')';
      params.push(`%${search}%`);
    }
    
    if (domain) {
      query += ' AND research_domain = $' + (params.length + 1);
      params.push(domain);
    }
    
    if (type) {
      query += ' AND article_type = $' + (params.length + 1);
      params.push(type);
    }
    
    if (status) {
      query += ' AND review_status = $' + (params.length + 1);
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get single article
router.get('/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM sfaj_articles WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Submit new article
router.post('/articles', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      abstract,
      authors,
      keywords,
      research_domain,
      article_type,
      full_text,
      manuscript_url
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sfaj_articles (
        user_id, title, abstract, authors, keywords, research_domain,
        article_type, full_text, manuscript_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [userId, title, abstract, authors, keywords, research_domain, article_type, full_text, manuscript_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting article:', error);
    res.status(500).json({ error: 'Failed to submit article' });
  }
});

// Update article
router.put('/articles/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      title,
      abstract,
      authors,
      keywords,
      research_domain,
      article_type,
      full_text,
      manuscript_url
    } = req.body;
    
    // Check if user owns the article
    const checkResult = await pool.query(
      'SELECT user_id FROM sfaj_articles WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const result = await pool.query(
      `UPDATE sfaj_articles SET
        title = $1, abstract = $2, authors = $3, keywords = $4,
        research_domain = $5, article_type = $6, full_text = $7,
        manuscript_url = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [title, abstract, authors, keywords, research_domain, article_type, full_text, manuscript_url, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete article
router.delete('/articles/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if user owns the article
    const checkResult = await pool.query(
      'SELECT user_id FROM sfaj_articles WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await pool.query(
      'UPDATE sfaj_articles SET status = $1 WHERE id = $2',
      ['archived', id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// Get user's liked articles
router.get('/likes', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json([]);
    }
    
    const token = authHeader.split(' ')[1];
    // Note: In production, you'd verify the token properly
    // For now, return empty array if not authenticated
    res.json([]);
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.json([]);
  }
});

// Like article
router.post('/likes', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { article_id } = req.body;
    
    await pool.query(
      'INSERT INTO sfaj_likes (article_id, user_id) VALUES ($1, $2)',
      [article_id, userId]
    );
    
    // Update likes count
    await pool.query(
      'UPDATE sfaj_articles SET likes_count = likes_count + 1 WHERE id = $1',
      [article_id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({ error: 'Failed to like article' });
  }
});

// Unlike article
router.delete('/likes/:articleId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { articleId } = req.params;
    
    await pool.query(
      'DELETE FROM sfaj_likes WHERE article_id = $1 AND user_id = $2',
      [articleId, userId]
    );
    
    // Update likes count
    await pool.query(
      'UPDATE sfaj_articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
      [articleId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error unliking article:', error);
    res.status(500).json({ error: 'Failed to unlike article' });
  }
});

// Get reviews for an article
router.get('/articles/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT sr.*, u.username, u.email
       FROM sfaj_reviews sr
       LEFT JOIN users u ON sr.reviewer_id = u.id
       WHERE sr.article_id = $1 AND sr.status = 'active'
       ORDER BY sr.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit review
router.post('/articles/:id/reviews', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      review_text,
      decision,
      novelty_rating,
      methodology_rating,
      clarity_rating,
      significance_rating,
      overall_rating
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sfaj_reviews (
        article_id, reviewer_id, review_text, decision,
        novelty_rating, methodology_rating, clarity_rating,
        significance_rating, overall_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [id, userId, review_text, decision, novelty_rating, methodology_rating, clarity_rating, significance_rating, overall_rating]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Volunteer Management
// Register as volunteer
router.post('/volunteers/register', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      role,
      specialization,
      educational_background,
      research_experience_years,
      previous_journal_experience
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sfaj_volunteers (
        user_id, role, specialization, educational_background,
        research_experience_years, previous_journal_experience
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, role) DO UPDATE SET
        specialization = EXCLUDED.specialization,
        educational_background = EXCLUDED.educational_background,
        research_experience_years = EXCLUDED.research_experience_years,
        previous_journal_experience = EXCLUDED.previous_journal_experience,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [userId, role, specialization, educational_background, research_experience_years, previous_journal_experience]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({ error: 'Failed to register volunteer' });
  }
});

// Get volunteer status
router.get('/volunteers/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM sfaj_volunteers WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching volunteer status:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer status' });
  }
});

// Get impact points
router.get('/impact-points', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 
        SUM(points) as total_points,
        COUNT(*) as total_contributions
       FROM sfaj_impact_points 
       WHERE user_id = $1`,
      [userId]
    );
    
    const contributions = await pool.query(
      'SELECT * FROM sfaj_impact_points WHERE user_id = $1 ORDER BY earned_at DESC LIMIT 10',
      [userId]
    );
    
    res.json({
      total_points: result.rows[0].total_points || 0,
      total_contributions: result.rows[0].total_contributions || 0,
      recent_contributions: contributions.rows
    });
  } catch (error) {
    console.error('Error fetching impact points:', error);
    res.status(500).json({ error: 'Failed to fetch impact points' });
  }
});

// Get badges
router.get('/badges', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM sfaj_badges WHERE user_id = $1 ORDER BY earned_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

export default router;

