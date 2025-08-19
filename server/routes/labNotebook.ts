import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all lab notebook entries with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      lab_id,
      entry_type,
      status,
      priority,
      search,
      privacy_level,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        e.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        l.name as lab_name,
        i.name as institution
      FROM lab_notebook_entries e
      INNER JOIN users u ON e.author_id = u.id
      INNER JOIN labs l ON e.lab_id = l.id
      INNER JOIN institutions i ON l.institution_id = i.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (lab_id) {
      paramCount++;
      query += ` AND e.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    if (entry_type) {
      paramCount++;
      query += ` AND e.entry_type = $${paramCount}`;
      params.push(entry_type);
    }

    if (status) {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND e.priority = $${paramCount}`;
      params.push(priority);
    }

    if (privacy_level) {
      paramCount++;
      query += ` AND e.privacy_level = $${paramCount}`;
      params.push(privacy_level);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        e.title ILIKE $${paramCount} OR 
        e.content ILIKE $${paramCount} OR 
        e.objectives ILIKE $${paramCount} OR 
        e.methodology ILIKE $${paramCount} OR 
        e.results ILIKE $${paramCount} OR 
        e.conclusions ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab notebook entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific lab notebook entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        e.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        l.name as lab_name,
        i.name as institution
      FROM lab_notebook_entries e
      INNER JOIN users u ON e.author_id = u.id
      INNER JOIN labs l ON e.lab_id = l.id
      INNER JOIN institutions i ON l.institution_id = i.id
      WHERE e.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Get comments
    const commentsQuery = `
      SELECT 
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as first_name,
        u.username
      FROM lab_notebook_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.entry_id = $1
      ORDER BY c.created_at ASC
    `;
    const commentsResult = await pool.query(commentsQuery, [id]);

    // Get milestones
    const milestonesQuery = `
      SELECT * FROM lab_notebook_milestones
      WHERE entry_id = $1
      ORDER BY due_date ASC
    `;
    const milestonesResult = await pool.query(milestonesQuery, [id]);

    // Get attachments
    const attachmentsQuery = `
      SELECT 
        a.*,
        CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
      FROM lab_notebook_attachments a
      INNER JOIN users u ON a.uploaded_by = u.id
      WHERE a.entry_id = $1
      ORDER BY a.created_at DESC
    `;
    const attachmentsResult = await pool.query(attachmentsQuery, [id]);

    const entry = result.rows[0];
    entry.comments = commentsResult.rows;
    entry.milestones = milestonesResult.rows;
    entry.attachments = attachmentsResult.rows;

    res.json(entry);
  } catch (error) {
    console.error('Error fetching lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new lab notebook entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags,
      privacy_level,
      estimated_duration,
      cost,
      equipment_used,
      materials_used,
      safety_notes,
      references,
      collaborators
    } = req.body;

    const userId = (req as any).user.id;

    const query = `
      INSERT INTO lab_notebook_entries (
        title, content, entry_type, status, priority, objectives, methodology,
        results, conclusions, next_steps, lab_id, project_id, tags, privacy_level,
        author_id, estimated_duration, cost, equipment_used, materials_used,
        safety_notes, references, collaborators
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags || [],
      privacy_level,
      userId,
      estimated_duration || 0,
      cost || 0,
      equipment_used || [],
      materials_used || [],
      safety_notes,
      references || [],
      collaborators || []
    ];

    const result = await pool.query(query, values);
    
    // Log activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [result.rows[0].id, userId, 'created', { title, entry_type }]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a lab notebook entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user can edit this entry
    const checkQuery = `
      SELECT author_id, privacy_level, lab_id FROM lab_notebook_entries WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    
    // Only author or lab admin can edit
    if (entry.author_id !== userId) {
      // Check if user is lab admin (you might need to implement this check)
      return res.status(403).json({ error: 'Not authorized to edit this entry' });
    }

    const {
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags,
      privacy_level,
      estimated_duration,
      cost,
      equipment_used,
      materials_used,
      safety_notes,
      references,
      collaborators
    } = req.body;

    const query = `
      UPDATE lab_notebook_entries SET
        title = $1, content = $2, entry_type = $3, status = $4, priority = $5,
        objectives = $6, methodology = $7, results = $8, conclusions = $9,
        next_steps = $10, lab_id = $11, project_id = $12, tags = $13,
        privacy_level = $14, estimated_duration = $15, cost = $16,
        equipment_used = $17, materials_used = $18, safety_notes = $19,
        references = $20, collaborators = $21, updated_at = CURRENT_TIMESTAMP
      WHERE id = $22
      RETURNING *
    `;

    const values = [
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags || [],
      privacy_level,
      estimated_duration || 0,
      cost || 0,
      equipment_used || [],
      materials_used || [],
      safety_notes,
      references || [],
      collaborators || [],
      id
    ];

    const result = await pool.query(query, values);
    
    // Log activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [id, userId, 'updated', { title, entry_type, status }]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a lab notebook entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user can delete this entry
    const checkQuery = `
      SELECT author_id, privacy_level, lab_id FROM lab_notebook_entries WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    
    // Only author or lab admin can delete
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }

    // Log activity before deletion
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [id, userId, 'deleted', { title: entry.title, entry_type: entry.entry_type }]
    );

    // Delete the entry (cascade will handle related data)
    await pool.query('DELETE FROM lab_notebook_entries WHERE id = $1', [id]);

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a comment to an entry
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text, parent_comment_id } = req.body;
    const userId = (req as any).user.id;

    const query = `
      INSERT INTO lab_notebook_comments (entry_id, user_id, comment_text, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId, comment_text, parent_comment_id || null]);
    
    // Get comment with user info
    const commentQuery = `
      SELECT 
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as first_name,
        u.username
      FROM lab_notebook_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    const commentResult = await pool.query(commentQuery, [result.rows[0].id]);

    // Log activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [id, userId, 'commented', { comment_length: comment_text.length }]
    );

    res.status(201).json(commentResult.rows[0]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a comment
router.put('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment_text } = req.body;
    const userId = (req as any).user.id;

    // Check if user owns this comment
    const checkQuery = 'SELECT user_id, entry_id FROM lab_notebook_comments WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [commentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = checkResult.rows[0];
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    const query = `
      UPDATE lab_notebook_comments 
      SET comment_text = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [comment_text, commentId]);
    
    // Log activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [comment.entry_id, userId, 'comment_updated', { comment_id: commentId }]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user.id;

    // Check if user owns this comment
    const checkQuery = 'SELECT user_id, entry_id FROM lab_notebook_comments WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [commentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = checkResult.rows[0];
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Log activity before deletion
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [comment.entry_id, userId, 'comment_deleted', { comment_id: commentId }]
    );

    await pool.query('DELETE FROM lab_notebook_comments WHERE id = $1', [commentId]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a milestone to an entry
router.post('/:id/milestones', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;
    const userId = (req as any).user.id;

    // Check if user can add milestones to this entry
    const checkQuery = 'SELECT author_id FROM lab_notebook_entries WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to add milestones to this entry' });
    }

    const query = `
      INSERT INTO lab_notebook_milestones (entry_id, title, description, due_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [id, title, description, due_date]);
    
    // Log activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [id, userId, 'milestone_added', { milestone_title: title }]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a milestone
router.put('/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { title, description, due_date, completed } = req.body;
    const userId = (req as any).user.id;

    // Check if user can edit this milestone
    const checkQuery = `
      SELECT m.entry_id, e.author_id 
      FROM lab_notebook_milestones m
      INNER JOIN lab_notebook_entries e ON m.entry_id = e.id
      WHERE m.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [milestoneId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestone = checkResult.rows[0];
    if (milestone.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this milestone' });
    }

    const completedAt = completed ? new Date() : null;

    const query = `
      UPDATE lab_notebook_milestones 
      SET title = $1, description = $2, due_date = $3, completed = $4, completed_at = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [title, description, due_date, completed, completedAt, milestoneId]);
    
    // Log activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [milestone.entry_id, userId, 'milestone_updated', { milestone_id: milestoneId, completed }]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a milestone
router.delete('/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const userId = (req as any).user.id;

    // Check if user can delete this milestone
    const checkQuery = `
      SELECT m.entry_id, e.author_id 
      FROM lab_notebook_milestones m
      INNER JOIN lab_notebook_entries e ON m.entry_id = e.id
      WHERE m.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [milestoneId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestone = checkResult.rows[0];
    if (milestone.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this milestone' });
    }

    // Log activity before deletion
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [milestone.entry_id, userId, 'milestone_deleted', { milestone_id: milestoneId }]
    );

    await pool.query('DELETE FROM lab_notebook_milestones WHERE id = $1', [milestoneId]);

    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search entries using full-text search
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      q,
      lab_id,
      entry_type,
      status,
      priority,
      privacy_level,
      limit = 50,
      offset = 0
    } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Use the search function from the database
    const query = `
      SELECT * FROM search_lab_notebook_entries($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const result = await pool.query(query, [
      q,
      lab_id || null,
      entry_type || null,
      status || null,
      priority || null,
      privacy_level || null,
      limit,
      offset
    ]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching lab notebook entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get entry statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { lab_id } = req.query;

    let whereClause = '';
    const params: any[] = [];
    let paramCount = 0;

    if (lab_id) {
      paramCount++;
      whereClause = `WHERE lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN entry_type = 'experiment' THEN 1 END) as experiment_count,
        COUNT(CASE WHEN entry_type = 'idea' THEN 1 END) as idea_count,
        AVG(estimated_duration) as avg_estimated_duration,
        AVG(actual_duration) as avg_actual_duration,
        SUM(cost) as total_cost
      FROM lab_notebook_entries
      ${whereClause}
    `;

    const statsResult = await pool.query(statsQuery, params);
    
    // Get recent activity
    const activityQuery = `
      SELECT 
        al.action,
        al.created_at,
        e.title as entry_title,
        e.id as entry_id
      FROM lab_notebook_activity_log al
      INNER JOIN lab_notebook_entries e ON al.entry_id = e.id
      ${whereClause ? whereClause.replace('lab_id', 'e.lab_id') : ''}
      ORDER BY al.created_at DESC
      LIMIT 10
    `;

    const activityResult = await pool.query(activityQuery, params);

    const stats = statsResult.rows[0];
    stats.recent_activity = activityResult.rows;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching lab notebook stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available tags
router.get('/tags/available', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT name, description, color, COUNT(et.entry_id) as usage_count
      FROM lab_notebook_tags t
      LEFT JOIN lab_notebook_entry_tags et ON t.id = et.tag_id
      GROUP BY t.id, t.name, t.description, t.color
      ORDER BY usage_count DESC, t.name ASC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching available tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export entries (for backup or sharing)
router.get('/export/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user can access this entry
    const checkQuery = `
      SELECT * FROM lab_notebook_entries WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    
    // Check privacy and permissions
    if (entry.privacy_level === 'private' && entry.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this entry' });
    }

    // Get full entry with all related data
    const fullEntry = await pool.query(
      'SELECT * FROM get_lab_notebook_entry_with_details($1)',
      [id]
    );

    // Log export activity
    await pool.query(
      'SELECT log_lab_notebook_activity($1, $2, $3, $4)',
      [id, userId, 'exported', { format: 'json' }]
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lab_notebook_entry_${id}.json"`);
    res.json(fullEntry.rows[0]);
  } catch (error) {
    console.error('Error exporting lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
