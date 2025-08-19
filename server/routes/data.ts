import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/digital_research_manager',
});

// Get all results for a lab
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const { lab_id, data_type, search, tags, date_from, date_to } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT r.*, u.username, u.first_name, u.last_name, l.name as lab_name
      FROM results r
      JOIN users u ON r.author_id = u.id
      JOIN labs l ON r.lab_id = l.id
      WHERE r.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (data_type) {
      paramCount++;
      query += ` AND r.data_type = $${paramCount}`;
      queryParams.push(data_type);
    }

    if (search) {
      paramCount++;
      query += ` AND (r.title ILIKE $${paramCount} OR r.summary ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (tags && Array.isArray(tags)) {
      paramCount++;
      query += ` AND r.tags && $${paramCount}`;
      queryParams.push(tags);
    }

    if (date_from) {
      paramCount++;
      query += ` AND r.created_at >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND r.created_at <= $${paramCount}`;
      queryParams.push(date_to);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ results: result.rows });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific result
router.get('/results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT r.*, u.username, u.first_name, u.last_name, l.name as lab_name
      FROM results r
      JOIN users u ON r.author_id = u.id
      JOIN labs l ON r.lab_id = l.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ result: result.rows[0] });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new result
router.post('/results', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      summary,
      data_type,
      data_format,
      data_content,
      tags,
      privacy_level,
      lab_id,
      project_id,
      source,
      notebook_entry_id
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!title || !summary || !data_type || !data_format || !data_content || !lab_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO results (
        title, summary, author_id, lab_id, project_id, data_type, 
        data_format, data_content, tags, privacy_level, source, notebook_entry_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, summary, userId, lab_id, project_id, data_type,
      data_format, data_content, tags || [], privacy_level || 'lab', source || 'manual', notebook_entry_id
    ]);

    res.status(201).json({ result: result.rows[0] });
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a result
router.put('/results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      data_type,
      data_format,
      data_content,
      tags,
      privacy_level
    } = req.body;

    const userId = req.user.id;

    // Check if user owns the result or has permission
    const ownershipCheck = await pool.query(`
      SELECT author_id, lab_id FROM results WHERE id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = ownershipCheck.rows[0];
    if (result.author_id !== userId) {
      // Check if user is lab member with edit permissions
      const labMemberCheck = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [result.lab_id, userId]);

      if (labMemberCheck.rows.length === 0 || !['principal_researcher', 'co_supervisor'].includes(labMemberCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const updateResult = await pool.query(`
      UPDATE results SET
        title = COALESCE($1, title),
        summary = COALESCE($2, summary),
        data_type = COALESCE($3, data_type),
        data_format = COALESCE($4, data_format),
        data_content = COALESCE($5, data_content),
        tags = COALESCE($6, tags),
        privacy_level = COALESCE($7, privacy_level),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [title, summary, data_type, data_format, data_content, tags, privacy_level, id]);

    res.json({ result: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a result
router.delete('/results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const ownershipCheck = await pool.query(`
      SELECT author_id, lab_id FROM results WHERE id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = ownershipCheck.rows[0];
    if (result.author_id !== userId) {
      // Check if user is lab member with delete permissions
      const labMemberCheck = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [result.lab_id, userId]);

      if (labMemberCheck.rows.length === 0 || !['principal_researcher'].includes(labMemberCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    await pool.query('DELETE FROM results WHERE id = $1', [id]);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get data templates
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const { lab_id, category, is_public } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT dt.*, u.username, u.first_name, u.last_name
      FROM data_templates dt
      JOIN users u ON dt.created_by = u.id
      WHERE (dt.lab_id = $1 OR dt.is_public = true)
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND dt.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (is_public !== undefined) {
      paramCount++;
      query += ` AND dt.is_public = $${paramCount}`;
      queryParams.push(is_public === 'true');
    }

    query += ` ORDER BY dt.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a data template
router.post('/templates', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      fields,
      lab_id,
      is_public
    } = req.body;

    const userId = req.user.id;

    if (!name || !category || !fields || !lab_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO data_templates (
        name, description, category, fields, created_by, lab_id, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, category, fields, userId, lab_id, is_public || false]);

    res.status(201).json({ template: result.rows[0] });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get results statistics
router.get('/results/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { lab_id } = req.query;
    const userId = req.user.id;

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_results,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month,
        COUNT(CASE WHEN data_type = 'experiment' THEN 1 END) as experiments,
        COUNT(CASE WHEN data_type = 'observation' THEN 1 END) as observations,
        COUNT(CASE WHEN data_type = 'measurement' THEN 1 END) as measurements,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_entries,
        COUNT(CASE WHEN source = 'import' THEN 1 END) as imports
      FROM results 
      WHERE lab_id = $1
    `, [lab_id]);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
