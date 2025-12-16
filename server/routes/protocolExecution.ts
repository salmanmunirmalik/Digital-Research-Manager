/**
 * Protocol Execution API Routes
 * Handles protocol execution tracking, data storage, and analytics
 */

import { Router } from 'express';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

/**
 * Save protocol execution data
 * POST /api/protocol-execution
 */
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const {
      protocolId,
      protocolTitle,
      startTime,
      endTime,
      completedSteps,
      notes,
      photos,
      deviations,
      totalDuration,
      success,
      issues
    } = req.body;

    if (!protocolId || !protocolTitle) {
      return res.status(400).json({ error: 'Protocol ID and title are required' });
    }

    // Insert execution record
    const result = await pool.query(
      `INSERT INTO protocol_executions (
        protocol_id,
        protocol_title,
        user_id,
        start_time,
        end_time,
        total_duration_ms,
        completed_steps,
        notes,
        photos,
        deviations,
        success,
        issues,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        protocolId,
        protocolTitle,
        req.user.id,
        startTime,
        endTime,
        totalDuration,
        JSON.stringify(completedSteps),
        JSON.stringify(notes),
        JSON.stringify(photos),
        JSON.stringify(deviations),
        success !== false,
        JSON.stringify(issues || [])
      ]
    );

    // Update protocol usage statistics
    await pool.query(
      `UPDATE protocols 
       SET usage_count = usage_count + 1,
           last_used_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [protocolId]
    );

    // If execution was successful, update success count
    if (success !== false) {
      await pool.query(
        `UPDATE protocols 
         SET success_count = COALESCE(success_count, 0) + 1
         WHERE id = $1`,
        [protocolId]
      );
    } else {
      await pool.query(
        `UPDATE protocols 
         SET failure_count = COALESCE(failure_count, 0) + 1
         WHERE id = $1`,
        [protocolId]
      );
    }

    // Recalculate success rate
    await pool.query(
      `UPDATE protocols 
       SET success_rate = CASE 
         WHEN (COALESCE(success_count, 0) + COALESCE(failure_count, 0)) > 0 
         THEN (COALESCE(success_count, 0)::DECIMAL / (COALESCE(success_count, 0) + COALESCE(failure_count, 0))) * 100
         ELSE 0
       END
       WHERE id = $1`,
      [protocolId]
    );

    res.json({
      success: true,
      execution: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error saving protocol execution:', error);
    res.status(500).json({ error: 'Failed to save protocol execution', details: error.message });
  }
});

/**
 * Get execution history for a protocol
 * GET /api/protocol-execution/:protocolId
 */
router.get('/:protocolId', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        e.*,
        u.first_name,
        u.last_name,
        u.username
       FROM protocol_executions e
       JOIN users u ON e.user_id = u.id
       WHERE e.protocol_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [protocolId, limit, offset]
    );

    res.json({
      executions: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching execution history:', error);
    res.status(500).json({ error: 'Failed to fetch execution history', details: error.message });
  }
});

/**
 * Get user's execution history
 * GET /api/protocol-execution/user/history
 */
router.get('/user/history', authenticateToken, async (req: any, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        e.*,
        p.title as protocol_title,
        p.category
       FROM protocol_executions e
       LEFT JOIN protocols p ON e.protocol_id = p.id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      executions: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching user execution history:', error);
    res.status(500).json({ error: 'Failed to fetch execution history', details: error.message });
  }
});

/**
 * Get execution analytics
 * GET /api/protocol-execution/analytics/:protocolId
 */
router.get('/analytics/:protocolId', authenticateToken, async (req: any, res) => {
  try {
    const { protocolId } = req.params;

    const analytics = await pool.query(
      `SELECT 
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE success = true) as successful_executions,
        COUNT(*) FILTER (WHERE success = false) as failed_executions,
        AVG(total_duration_ms) as avg_duration_ms,
        MIN(total_duration_ms) as min_duration_ms,
        MAX(total_duration_ms) as max_duration_ms,
        AVG(jsonb_array_length(completed_steps::jsonb)) as avg_steps_completed
       FROM protocol_executions
       WHERE protocol_id = $1`,
      [protocolId]
    );

    // Get step-by-step analytics
    const stepAnalytics = await pool.query(
      `SELECT 
        step_id,
        COUNT(*) as completion_count,
        AVG(step_duration_ms) as avg_duration_ms
       FROM protocol_execution_steps
       WHERE execution_id IN (
         SELECT id FROM protocol_executions WHERE protocol_id = $1
       )
       GROUP BY step_id
       ORDER BY step_id`,
      [protocolId]
    );

    res.json({
      analytics: analytics.rows[0],
      stepAnalytics: stepAnalytics.rows
    });
  } catch (error: any) {
    console.error('Error fetching execution analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

export default router;

