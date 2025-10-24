/**
 * Unified Communications API Routes
 * Centralized communication system for all user interactions
 */

import express from 'express';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get unified inbox (all communications)
router.get('/inbox', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type, status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        c.*,
        fu.first_name as from_first_name,
        fu.last_name as from_last_name,
        tu.first_name as to_first_name,
        tu.last_name as to_last_name
      FROM unified_communications c
      LEFT JOIN users fu ON c.from_user_id = fu.id
      LEFT JOIN users tu ON c.to_user_id = tu.id
      WHERE (c.to_user_id = $1 OR c.from_user_id = $1 OR c.to_lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $1
      ))
    `;
    
    const params: any[] = [userId];
    
    if (type) {
      query += ` AND c.communication_type = $${params.length + 1}`;
      params.push(type);
    }
    
    if (status) {
      query += ` AND c.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get counts
    const countResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread
      FROM unified_communications
      WHERE to_user_id = $1 OR from_user_id = $1`,
      [userId]
    );
    
    res.json({
      communications: result.rows,
      counts: countResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// Get communications by type
router.get('/type/:type', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        fu.first_name as from_first_name,
        fu.last_name as from_last_name,
        tu.first_name as to_first_name,
        tu.last_name as to_last_name
      FROM unified_communications c
      LEFT JOIN users fu ON c.from_user_id = fu.id
      LEFT JOIN users tu ON c.to_user_id = tu.id
      WHERE c.communication_type = $1 
        AND (c.to_user_id = $2 OR c.from_user_id = $2 OR c.to_lab_id IN (
          SELECT lab_id FROM lab_members WHERE user_id = $2
        ))
      ORDER BY c.created_at DESC
      LIMIT $3 OFFSET $4`,
      [type, userId, limit, offset]
    );
    
    res.json({ communications: result.rows });
  } catch (error) {
    console.error('Error fetching communications by type:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Get communication details
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        fu.first_name as from_first_name,
        fu.last_name as from_last_name,
        fu.email as from_email,
        tu.first_name as to_first_name,
        tu.last_name as to_last_name,
        tu.email as to_email
      FROM unified_communications c
      LEFT JOIN users fu ON c.from_user_id = fu.id
      LEFT JOIN users tu ON c.to_user_id = tu.id
      WHERE c.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    const communication = result.rows[0];
    
    // Check if user has access
    if (communication.to_user_id !== userId && 
        communication.from_user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get threads
    const threadsResult = await pool.query(
      `SELECT 
        t.*,
        u.first_name,
        u.last_name
      FROM communication_threads t
      LEFT JOIN users u ON t.from_user_id = u.id
      WHERE t.parent_communication_id = $1
      ORDER BY t.created_at ASC`,
      [id]
    );
    
    res.json({
      ...communication,
      threads: threadsResult.rows
    });
  } catch (error) {
    console.error('Error fetching communication:', error);
    res.status(500).json({ error: 'Failed to fetch communication' });
  }
});

// Mark as read
router.put('/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE unified_communications 
      SET status = 'read', read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND to_user_id = $2
      RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    res.json({ 
      success: true,
      communication: result.rows[0]
    });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Archive communication
router.put('/:id/archive', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE unified_communications 
      SET status = 'archived', archived_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND (to_user_id = $2 OR from_user_id = $2)
      RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    res.json({ 
      success: true,
      communication: result.rows[0]
    });
  } catch (error) {
    console.error('Error archiving communication:', error);
    res.status(500).json({ error: 'Failed to archive communication' });
  }
});

// Delete communication
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      `UPDATE unified_communications 
      SET status = 'deleted'
      WHERE id = $1 AND (to_user_id = $2 OR from_user_id = $2)
      RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Communication deleted'
    });
  } catch (error) {
    console.error('Error deleting communication:', error);
    res.status(500).json({ error: 'Failed to delete communication' });
  }
});

// Add reply/thread
router.post('/:id/thread', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, attachments = [] } = req.body;
    
    // Verify communication exists and user has access
    const commCheck = await pool.query(
      `SELECT id FROM unified_communications 
      WHERE id = $1 AND (to_user_id = $2 OR from_user_id = $2)`,
      [id, userId]
    );
    
    if (commCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await pool.query(
      `INSERT INTO communication_threads (
        parent_communication_id, from_user_id, content, attachments
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [id, userId, content, JSON.stringify(attachments)]
    );
    
    res.json({ 
      success: true,
      thread: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding thread:', error);
    res.status(500).json({ error: 'Failed to add thread' });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM communication_preferences WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default preferences
      const insertResult = await pool.query(
        `INSERT INTO communication_preferences (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      
      return res.json({ preferences: insertResult.rows[0] });
    }
    
    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    
    const result = await pool.query(
      `UPDATE communication_preferences 
      SET 
        ${Object.keys(updates).map((key, idx) => `${key} = $${idx + 2}`).join(', ')},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *`,
      [userId, ...Object.values(updates)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    
    res.json({ 
      success: true,
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get communication counts by type
router.get('/stats/counts', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        communication_type,
        status,
        COUNT(*) as count
      FROM unified_communications
      WHERE to_user_id = $1 OR from_user_id = $1 OR to_lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $1
      )
      GROUP BY communication_type, status`,
      [userId]
    );
    
    res.json({ counts: result.rows });
  } catch (error) {
    console.error('Error fetching counts:', error);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
});

export default router;

