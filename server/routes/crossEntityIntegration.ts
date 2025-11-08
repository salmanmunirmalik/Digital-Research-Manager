import express, { type Router } from 'express';
import { Pool } from 'pg';

const router: Router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/digital_research_manager',
});

// ==============================================
// CROSS-ENTITY INTEGRATION API ROUTES
// ==============================================

// Get integrated research workflow for a notebook entry
router.get('/workflow/:notebookId', async (req, res) => {
  try {
    const { notebookId } = req.params;
    
    const query = `
      SELECT * FROM research_workflow_integration 
      WHERE notebook_entry_id = $1
    `;
    
    const result = await pool.query(query, [notebookId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notebook entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching workflow integration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create bidirectional relationship between entities
router.post('/relationships', async (req, res) => {
  try {
    const { 
      sourceType, 
      sourceId, 
      targetType, 
      targetId, 
      relationshipType,
      userId 
    } = req.body;
    
    const query = `
      SELECT create_bidirectional_relationship($1, $2, $3, $4, $5, $6) as relationship_id
    `;
    
    const result = await pool.query(query, [
      sourceType, sourceId, targetType, targetId, relationshipType, userId
    ]);
    
    res.json({ 
      success: true, 
      relationshipId: result.rows[0].relationship_id 
    });
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync notebook entry to related entities
router.post('/sync/notebook/:notebookId', async (req, res) => {
  try {
    const { notebookId } = req.params;
    const { entityType, entityIds, userId } = req.body;
    
    const query = `
      SELECT sync_notebook_entry_to_entities($1, $2, $3, $4)
    `;
    
    await pool.query(query, [notebookId, entityType, entityIds, userId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// ENHANCED PROTOCOLS API
// ==============================================

// Get all enhanced protocols
router.get('/protocols', async (req, res) => {
  try {
    const { labId, category, status } = req.query;
    
    let query = `
      SELECT p.*, 
             u.username as creator_name,
             l.name as lab_name,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'id', n.id,
                   'title', n.title,
                   'entry_type', n.entry_type,
                   'status', n.status
                 )
               ) FROM lab_notebook_entries n 
                WHERE n.id = ANY(p.related_notebook_entries)), 
               '[]'::json
             ) as related_notebook_entries_data
      FROM enhanced_protocols p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN labs l ON p.lab_id = l.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (labId) {
      paramCount++;
      query += ` AND p.lab_id = $${paramCount}`;
      params.push(labId);
    }
    
    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }
    
    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create enhanced protocol
router.post('/protocols', async (req, res) => {
  try {
    const {
      title,
      description,
      protocol_type,
      category,
      objective,
      materials_needed,
      equipment_required,
      safety_precautions,
      procedure_steps,
      expected_results,
      troubleshooting,
      references,
      related_notebook_entries,
      lab_id,
      created_by,
      tags,
      keywords,
      difficulty_level,
      estimated_duration,
      cost_estimate
    } = req.body;
    
    const query = `
      INSERT INTO enhanced_protocols (
        title, description, protocol_type, category, objective,
        materials_needed, equipment_required, safety_precautions,
        procedure_steps, expected_results, troubleshooting, references,
        related_notebook_entries, lab_id, created_by, tags, keywords,
        difficulty_level, estimated_duration, cost_estimate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      title, description, protocol_type, category, objective,
      materials_needed, equipment_required, safety_precautions,
      procedure_steps, expected_results, troubleshooting, references,
      related_notebook_entries, lab_id, created_by, tags, keywords,
      difficulty_level, estimated_duration, cost_estimate
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// ENHANCED RESULTS API
// ==============================================

// Get all enhanced results
router.get('/results', async (req, res) => {
  try {
    const { labId, resultType, dataType } = req.query;
    
    let query = `
      SELECT r.*, 
             u.username as creator_name,
             l.name as lab_name,
             p.title as project_title,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'id', n.id,
                   'title', n.title,
                   'entry_type', n.entry_type,
                   'status', n.status
                 )
               ) FROM lab_notebook_entries n 
                WHERE n.id = ANY(r.related_notebook_entries)), 
               '[]'::json
             ) as related_notebook_entries_data
      FROM enhanced_results r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN labs l ON r.lab_id = l.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (labId) {
      paramCount++;
      query += ` AND r.lab_id = $${paramCount}`;
      params.push(labId);
    }
    
    if (resultType) {
      paramCount++;
      query += ` AND r.result_type = $${paramCount}`;
      params.push(resultType);
    }
    
    if (dataType) {
      paramCount++;
      query += ` AND r.data_type = $${paramCount}`;
      params.push(dataType);
    }
    
    query += ` ORDER BY r.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create enhanced result
router.post('/results', async (req, res) => {
  try {
    const {
      title,
      description,
      result_type,
      data_type,
      raw_data,
      processed_data,
      analysis_method,
      statistical_methods,
      confidence_level,
      sample_size,
      related_notebook_entries,
      related_protocols,
      lab_id,
      project_id,
      created_by,
      tags,
      keywords,
      file_attachments,
      visualization_data
    } = req.body;
    
    const query = `
      INSERT INTO enhanced_results (
        title, description, result_type, data_type, raw_data, processed_data,
        analysis_method, statistical_methods, confidence_level, sample_size,
        related_notebook_entries, related_protocols, lab_id, project_id,
        created_by, tags, keywords, file_attachments, visualization_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      title, description, result_type, data_type, raw_data, processed_data,
      analysis_method, statistical_methods, confidence_level, sample_size,
      related_notebook_entries, related_protocols, lab_id, project_id,
      created_by, tags, keywords, file_attachments, visualization_data
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// ENHANCED INSTRUMENT BOOKING API
// ==============================================

// Get all enhanced instrument bookings
router.get('/bookings', async (req, res) => {
  try {
    const { labId, userId, status, instrumentName } = req.query;
    
    let query = `
      SELECT b.*, 
             u.username as user_name,
             s.username as supervisor_name,
             a.username as approved_by_name,
             l.name as lab_name,
             COALESCE(
               (SELECT json_agg(
                 json_build_object(
                   'id', n.id,
                   'title', n.title,
                   'entry_type', n.entry_type,
                   'status', n.status
                 )
               ) FROM lab_notebook_entries n 
                WHERE n.id = ANY(b.related_notebook_entries)), 
               '[]'::json
             ) as related_notebook_entries_data
      FROM enhanced_instrument_bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users s ON b.supervisor_id = s.id
      LEFT JOIN users a ON b.approved_by = a.id
      LEFT JOIN labs l ON b.lab_id = l.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (labId) {
      paramCount++;
      query += ` AND b.lab_id = $${paramCount}`;
      params.push(labId);
    }
    
    if (userId) {
      paramCount++;
      query += ` AND b.user_id = $${paramCount}`;
      params.push(userId);
    }
    
    if (status) {
      paramCount++;
      query += ` AND b.status = $${paramCount}`;
      params.push(status);
    }
    
    if (instrumentName) {
      paramCount++;
      query += ` AND b.instrument_name ILIKE $${paramCount}`;
      params.push(`%${instrumentName}%`);
    }
    
    query += ` ORDER BY b.start_time ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create enhanced instrument booking
router.post('/bookings', async (req, res) => {
  try {
    const {
      instrument_name,
      instrument_id,
      booking_type,
      start_time,
      end_time,
      purpose,
      description,
      related_notebook_entries,
      related_protocols,
      related_results,
      related_projects,
      user_id,
      lab_id,
      supervisor_id,
      cost,
      notes,
      attachments
    } = req.body;
    
    const query = `
      INSERT INTO enhanced_instrument_bookings (
        instrument_name, instrument_id, booking_type, start_time, end_time,
        purpose, description, related_notebook_entries, related_protocols,
        related_results, related_projects, user_id, lab_id, supervisor_id,
        cost, notes, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      instrument_name, instrument_id, booking_type, start_time, end_time,
      purpose, description, related_notebook_entries, related_protocols,
      related_results, related_projects, user_id, lab_id, supervisor_id,
      cost, notes, attachments
    ]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// SMART INTEGRATION HELPERS
// ==============================================

// Get all relationships for an entity
router.get('/relationships/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const query = `
      SELECT 
        target_entity_type,
        target_entity_id,
        relationship_type,
        created_at
      FROM entity_relationships 
      WHERE source_entity_type = $1 AND source_entity_id = $2
      UNION ALL
      SELECT 
        source_entity_type as target_entity_type,
        source_entity_id as target_entity_id,
        relationship_type,
        created_at
      FROM entity_relationships 
      WHERE target_entity_type = $1 AND target_entity_id = $2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [entityType, entityId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sync log for debugging
router.get('/sync-log', async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    
    let query = `
      SELECT * FROM data_sync_log
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND sync_status = $${paramCount}`;
      params.push(status);
    }
    
    query += ` ORDER BY sync_timestamp DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit as string));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sync log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// RESEARCH WORKFLOW ANALYTICS
// ==============================================

// Get workflow analytics
router.get('/analytics/workflow', async (req, res) => {
  try {
    const { labId, timeRange = '30' } = req.query;
    
    const query = `
      WITH workflow_stats AS (
        SELECT 
          COUNT(DISTINCT n.id) as total_notebook_entries,
          COUNT(DISTINCT p.id) as total_protocols,
          COUNT(DISTINCT r.id) as total_results,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT er.id) as total_relationships
        FROM lab_notebook_entries n
        LEFT JOIN enhanced_protocols p ON p.id = ANY(n.related_protocols)
        LEFT JOIN enhanced_results r ON r.id = ANY(n.related_results)
        LEFT JOIN enhanced_instrument_bookings b ON b.id = ANY(n.related_instrument_bookings)
        LEFT JOIN entity_relationships er ON er.source_entity_id = n.id OR er.target_entity_id = n.id
        WHERE n.created_at >= CURRENT_DATE - INTERVAL '${timeRange} days'
        ${labId ? `AND n.lab_id = '${labId}'` : ''}
      ),
      sync_stats AS (
        SELECT 
          sync_status,
          COUNT(*) as count
        FROM data_sync_log
        WHERE sync_timestamp >= CURRENT_DATE - INTERVAL '${timeRange} days'
        GROUP BY sync_status
      )
      SELECT 
        ws.*,
        COALESCE(
          json_object_agg(ss.sync_status, ss.count) FILTER (WHERE ss.sync_status IS NOT NULL),
          '{}'::json
        ) as sync_status_counts
      FROM workflow_stats ws
      LEFT JOIN sync_stats ss ON true
      GROUP BY ws.total_notebook_entries, ws.total_protocols, ws.total_results, ws.total_bookings, ws.total_relationships
    `;
    
    const result = await pool.query(query);
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching workflow analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
