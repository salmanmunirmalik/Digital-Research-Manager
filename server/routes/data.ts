import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all results
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { search, tags, protocolId } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT r.*, u.username as author_name, p.title as protocol_title
      FROM results r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN protocols p ON r.protocol_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (r.title LIKE ? OR r.summary LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tags) {
      query += ` AND r.tags LIKE ?`;
      params.push(`%${tags}%`);
    }

    if (protocolId) {
      query += ` AND r.protocol_id = ?`;
      params.push(protocolId);
    }

    query += ' ORDER BY r.created_at DESC';

    const results = await db.all(query, params);
    
    // Parse JSON fields
    const resultsWithParsedData = results.map(result => ({
      ...result,
      tags: result.tags ? JSON.parse(result.tags) : [],
      dataPreview: result.data_preview ? JSON.parse(result.data_preview) : null
    }));

    res.json({ results: resultsWithParsedData });
  } catch (error) {
    console.error('Fetch results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Create new result
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      protocolId,
      summary,
      tags,
      dataPreview,
      source,
      notebookEntryId,
      insights,
      nextSteps,
      pitfalls
    } = req.body;

    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }

    const db = getDatabase();
    const resultId = uuidv4();
    
    await db.run(`
      INSERT INTO results (
        id, title, author_id, protocol_id, summary, tags, data_preview,
        source, notebook_entry_id, insights, next_steps, pitfalls
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resultId, title, req.user.id, protocolId, summary, JSON.stringify(tags || []),
      JSON.stringify(dataPreview), source || 'Manual', notebookEntryId, insights, nextSteps, pitfalls
    ]);

    res.status(201).json({
      message: 'Result created successfully',
      resultId
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({ error: 'Failed to create result' });
  }
});

export default router;
