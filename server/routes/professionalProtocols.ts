import { Router } from 'express';
import pool from '../../database/config.js';
import jwt from 'jsonwebtoken';

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any;
    
    // Get user details from database
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const router = Router();

// Professional Protocol Types
interface ProfessionalProtocol {
  id?: string;
  title: string;
  description: string;
  protocol_type: string;
  category: string;
  subcategory?: string;
  version: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skill_requirements: string[];
  estimated_duration_minutes: number;
  estimated_cost_usd: number;
  cost_per_sample: number;
  safety_level: 'low' | 'medium' | 'high' | 'biosafety_level_2' | 'biosafety_level_3';
  biosafety_requirements: string[];
  chemical_hazards: string[];
  biological_hazards: string[];
  ppe_required: string[];
  objective: string;
  background?: string;
  hypothesis?: string;
  reagents: any[];
  equipment: any[];
  consumables: any[];
  preparation_steps: any[];
  procedure_steps: any[];
  post_processing_steps: any[];
  positive_controls: string[];
  negative_controls: string[];
  quality_checkpoints: any[];
  troubleshooting_guide: any[];
  expected_results: string;
  data_analysis_methods: string[];
  interpretation_guidelines?: string;
  common_pitfalls: string[];
  literature_references: string[];
  protocol_references: string[];
  supplier_information: any[];
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  sharing_permissions: Record<string, string>;
  access_level: 'read' | 'comment' | 'edit' | 'admin';
  status: 'draft' | 'review' | 'validated' | 'approved' | 'archived' | 'deprecated';
  validation_level: 'none' | 'peer_reviewed' | 'lab_validated' | 'institution_approved' | 'published';
  tags: string[];
  keywords: string[];
  lab_id: string;
}

// Create Professional Protocol
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      protocol_type,
      category,
      subcategory,
      version = '1.0',
      difficulty_level,
      skill_requirements = [],
      estimated_duration_minutes,
      estimated_cost_usd = 0,
      cost_per_sample = 0,
      safety_level = 'low',
      biosafety_requirements = [],
      chemical_hazards = [],
      biological_hazards = [],
      ppe_required = [],
      objective,
      background,
      hypothesis,
      reagents = [],
      equipment = [],
      consumables = [],
      preparation_steps = [],
      procedure_steps = [],
      post_processing_steps = [],
      positive_controls = [],
      negative_controls = [],
      quality_checkpoints = [],
      troubleshooting_guide = [],
      expected_results,
      data_analysis_methods = [],
      interpretation_guidelines,
      common_pitfalls = [],
      literature_references = [],
      protocol_references = [],
      supplier_information = [],
      privacy_level = 'personal',
      sharing_permissions = {},
      access_level = 'read',
      status = 'draft',
      validation_level = 'none',
      tags = [],
      keywords = [],
      lab_id
    } = req.body;

    // Validation
    if (!title || !protocol_type || !category || !difficulty_level || !estimated_duration_minutes || !objective || !expected_results) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check lab access if lab_id is provided
    if (lab_id) {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [lab_id, req.user.id]);

      if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied to this lab' });
      }
    }

    // Create protocol
    const result = await pool.query(`
      INSERT INTO professional_protocols (
        title, description, protocol_type, category, subcategory, version,
        difficulty_level, skill_requirements, estimated_duration_minutes,
        estimated_cost_usd, cost_per_sample, safety_level, biosafety_requirements,
        chemical_hazards, biological_hazards, ppe_required, objective, background,
        hypothesis, reagents, equipment, consumables, preparation_steps,
        procedure_steps, post_processing_steps, positive_controls, negative_controls,
        quality_checkpoints, troubleshooting_guide, expected_results,
        data_analysis_methods, interpretation_guidelines, common_pitfalls,
        literature_references, protocol_references, supplier_information,
        privacy_level, sharing_permissions, access_level, status,
        validation_level, tags, keywords, lab_id, created_by, last_modified_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49)
      RETURNING *
    `, [
      title, description, protocol_type, category, subcategory, version,
      difficulty_level, skill_requirements, estimated_duration_minutes,
      estimated_cost_usd, cost_per_sample, safety_level, biosafety_requirements,
      chemical_hazards, biological_hazards, ppe_required, objective, background,
      hypothesis, JSON.stringify(reagents), JSON.stringify(equipment), JSON.stringify(consumables),
      JSON.stringify(preparation_steps), JSON.stringify(procedure_steps), JSON.stringify(post_processing_steps),
      positive_controls, negative_controls, JSON.stringify(quality_checkpoints),
      JSON.stringify(troubleshooting_guide), expected_results, data_analysis_methods,
      interpretation_guidelines, common_pitfalls, literature_references,
      protocol_references, JSON.stringify(supplier_information), privacy_level,
      JSON.stringify(sharing_permissions), access_level, status, validation_level,
      tags, keywords, lab_id, req.user.id, req.user.id
    ]);

    const protocol = result.rows[0];

    res.status(201).json({
      message: 'Protocol created successfully',
      protocol: {
        ...protocol,
        reagents: JSON.parse(protocol.reagents || '[]'),
        equipment: JSON.parse(protocol.equipment || '[]'),
        consumables: JSON.parse(protocol.consumables || '[]'),
        preparation_steps: JSON.parse(protocol.preparation_steps || '[]'),
        procedure_steps: JSON.parse(protocol.procedure_steps || '[]'),
        post_processing_steps: JSON.parse(protocol.post_processing_steps || '[]'),
        quality_checkpoints: JSON.parse(protocol.quality_checkpoints || '[]'),
        troubleshooting_guide: JSON.parse(protocol.troubleshooting_guide || '[]'),
        supplier_information: JSON.parse(protocol.supplier_information || '[]'),
        sharing_permissions: JSON.parse(protocol.sharing_permissions || '{}')
      }
    });
  } catch (error) {
    console.error('Error creating professional protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Professional Protocols with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      protocol_type,
      category,
      difficulty_level,
      privacy_level,
      status,
      validation_level,
      lab_id,
      created_by,
      limit = 20,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email,
        l.name as lab_name
      FROM professional_protocols p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN labs l ON p.lab_id = l.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramCount = 0;

    // Privacy filter - only show protocols user has access to
    query += ` AND (
      p.privacy_level = 'global' OR
      p.privacy_level = 'institution' OR
      p.privacy_level = 'lab' AND (p.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${++paramCount}
      ) OR p.created_by = $${paramCount}) OR
      p.privacy_level = 'team' AND (p.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${paramCount}
      ) OR p.created_by = $${paramCount}) OR
      p.privacy_level = 'personal' AND p.created_by = $${paramCount}
    )`;
    queryParams.push(req.user.id);

    // Search filter
    if (search) {
      query += ` AND (
        p.title ILIKE $${++paramCount} OR
        p.description ILIKE $${++paramCount} OR
        p.tags && $${++paramCount} OR
        p.search_vector @@ plainto_tsquery('english', $${++paramCount})
      )`;
      queryParams.push(`%${search}%`, `%${search}%`, [search], search);
    }

    // Other filters
    if (protocol_type) {
      query += ` AND p.protocol_type = $${++paramCount}`;
      queryParams.push(protocol_type);
    }

    if (category) {
      query += ` AND p.category = $${++paramCount}`;
      queryParams.push(category);
    }

    if (difficulty_level) {
      query += ` AND p.difficulty_level = $${++paramCount}`;
      queryParams.push(difficulty_level);
    }

    if (privacy_level) {
      query += ` AND p.privacy_level = $${++paramCount}`;
      queryParams.push(privacy_level);
    }

    if (status) {
      query += ` AND p.status = $${++paramCount}`;
      queryParams.push(status);
    }

    if (validation_level) {
      query += ` AND p.validation_level = $${++paramCount}`;
      queryParams.push(validation_level);
    }

    if (lab_id) {
      query += ` AND p.lab_id = $${++paramCount}`;
      queryParams.push(lab_id);
    }

    if (created_by) {
      query += ` AND p.created_by = $${++paramCount}`;
      queryParams.push(created_by);
    }

    // Sorting
    const validSortFields = ['created_at', 'updated_at', 'title', 'usage_count', 'average_rating', 'success_rate'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY p.${sortField} ${sortDirection}`;
    
    // Pagination
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, queryParams);

    // Parse JSON fields
    const protocols = result.rows.map(protocol => ({
      ...protocol,
      reagents: JSON.parse(protocol.reagents || '[]'),
      equipment: JSON.parse(protocol.equipment || '[]'),
      consumables: JSON.parse(protocol.consumables || '[]'),
      preparation_steps: JSON.parse(protocol.preparation_steps || '[]'),
      procedure_steps: JSON.parse(protocol.procedure_steps || '[]'),
      post_processing_steps: JSON.parse(protocol.post_processing_steps || '[]'),
      quality_checkpoints: JSON.parse(protocol.quality_checkpoints || '[]'),
      troubleshooting_guide: JSON.parse(protocol.troubleshooting_guide || '[]'),
      supplier_information: JSON.parse(protocol.supplier_information || '[]'),
      sharing_permissions: JSON.parse(protocol.sharing_permissions || '{}')
    }));

    res.json({ protocols });
  } catch (error) {
    console.error('Error fetching professional protocols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Professional Protocol
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email,
        l.name as lab_name
      FROM professional_protocols p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN labs l ON p.lab_id = l.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const protocol = result.rows[0];

    // Check access permissions
    const hasAccess = 
      protocol.privacy_level === 'global' ||
      protocol.privacy_level === 'institution' ||
      (protocol.privacy_level === 'lab' && (
        await pool.query('SELECT 1 FROM lab_members WHERE lab_id = $1 AND user_id = $2', [protocol.lab_id, req.user.id])
      ).rows.length > 0) ||
      (protocol.privacy_level === 'team' && (
        await pool.query('SELECT 1 FROM lab_members WHERE lab_id = $1 AND user_id = $2', [protocol.lab_id, req.user.id])
      ).rows.length > 0) ||
      (protocol.privacy_level === 'personal' && protocol.created_by === req.user.id) ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Parse JSON fields
    const protocolData = {
      ...protocol,
      reagents: JSON.parse(protocol.reagents || '[]'),
      equipment: JSON.parse(protocol.equipment || '[]'),
      consumables: JSON.parse(protocol.consumables || '[]'),
      preparation_steps: JSON.parse(protocol.preparation_steps || '[]'),
      procedure_steps: JSON.parse(protocol.procedure_steps || '[]'),
      post_processing_steps: JSON.parse(protocol.post_processing_steps || '[]'),
      quality_checkpoints: JSON.parse(protocol.quality_checkpoints || '[]'),
      troubleshooting_guide: JSON.parse(protocol.troubleshooting_guide || '[]'),
      supplier_information: JSON.parse(protocol.supplier_information || '[]'),
      sharing_permissions: JSON.parse(protocol.sharing_permissions || '{}')
    };

    res.json({ protocol: protocolData });
  } catch (error) {
    console.error('Error fetching professional protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Professional Protocol
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if protocol exists and user has edit access
    const existingProtocol = await pool.query(`
      SELECT created_by, lab_id, privacy_level FROM professional_protocols WHERE id = $1
    `, [id]);

    if (existingProtocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const protocol = existingProtocol.rows[0];

    // Check edit permissions
    const canEdit = 
      protocol.created_by === req.user.id ||
      (protocol.lab_id && (
        await pool.query('SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2', [protocol.lab_id, req.user.id])
      ).rows[0]?.role === 'admin') ||
      req.user.role === 'admin';

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    const allowedFields = [
      'title', 'description', 'protocol_type', 'category', 'subcategory', 'version',
      'difficulty_level', 'skill_requirements', 'estimated_duration_minutes',
      'estimated_cost_usd', 'cost_per_sample', 'safety_level', 'biosafety_requirements',
      'chemical_hazards', 'biological_hazards', 'ppe_required', 'objective', 'background',
      'hypothesis', 'reagents', 'equipment', 'consumables', 'preparation_steps',
      'procedure_steps', 'post_processing_steps', 'positive_controls', 'negative_controls',
      'quality_checkpoints', 'troubleshooting_guide', 'expected_results',
      'data_analysis_methods', 'interpretation_guidelines', 'common_pitfalls',
      'literature_references', 'protocol_references', 'supplier_information',
      'privacy_level', 'sharing_permissions', 'access_level', 'status',
      'validation_level', 'tags', 'keywords'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = $${++paramCount}`);
        
        // Handle JSON fields
        if (['reagents', 'equipment', 'consumables', 'preparation_steps', 'procedure_steps', 
             'post_processing_steps', 'quality_checkpoints', 'troubleshooting_guide', 
             'supplier_information', 'sharing_permissions'].includes(field)) {
          updateValues.push(JSON.stringify(updateData[field]));
        } else {
          updateValues.push(updateData[field]);
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_at and last_modified_by
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateFields.push(`last_modified_by = $${++paramCount}`);
    updateValues.push(req.user.id);

    const query = `
      UPDATE professional_protocols 
      SET ${updateFields.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING *
    `;
    updateValues.push(id);

    const result = await pool.query(query, updateValues);

    const updatedProtocol = result.rows[0];

    res.json({
      message: 'Protocol updated successfully',
      protocol: {
        ...updatedProtocol,
        reagents: JSON.parse(updatedProtocol.reagents || '[]'),
        equipment: JSON.parse(updatedProtocol.equipment || '[]'),
        consumables: JSON.parse(updatedProtocol.consumables || '[]'),
        preparation_steps: JSON.parse(updatedProtocol.preparation_steps || '[]'),
        procedure_steps: JSON.parse(updatedProtocol.procedure_steps || '[]'),
        post_processing_steps: JSON.parse(updatedProtocol.post_processing_steps || '[]'),
        quality_checkpoints: JSON.parse(updatedProtocol.quality_checkpoints || '[]'),
        troubleshooting_guide: JSON.parse(updatedProtocol.troubleshooting_guide || '[]'),
        supplier_information: JSON.parse(updatedProtocol.supplier_information || '[]'),
        sharing_permissions: JSON.parse(updatedProtocol.sharing_permissions || '{}')
      }
    });
  } catch (error) {
    console.error('Error updating professional protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Professional Protocol
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if protocol exists and user has delete access
    const existingProtocol = await pool.query(`
      SELECT created_by, lab_id FROM professional_protocols WHERE id = $1
    `, [id]);

    if (existingProtocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const protocol = existingProtocol.rows[0];

    // Check delete permissions
    const canDelete = 
      protocol.created_by === req.user.id ||
      (protocol.lab_id && (
        await pool.query('SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2', [protocol.lab_id, req.user.id])
      ).rows[0]?.role === 'admin') ||
      req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM professional_protocols WHERE id = $1', [id]);

    res.json({ message: 'Protocol deleted successfully' });
  } catch (error) {
    console.error('Error deleting professional protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track Protocol Usage
router.post('/:id/usage', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { usage_type = 'execution', execution_status = 'completed', actual_duration_minutes, success_rating, notes, modifications_made = [], issues_encountered = [] } = req.body;

    // Check if protocol exists and user has access
    const protocol = await pool.query('SELECT id FROM professional_protocols WHERE id = $1', [id]);
    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Log usage
    const result = await pool.query(`
      INSERT INTO protocol_usage_logs (
        protocol_id, user_id, lab_id, usage_type, execution_status,
        actual_duration_minutes, success_rating, notes, modifications_made, issues_encountered
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      id, req.user.id, req.user.lab_id, usage_type, execution_status,
      actual_duration_minutes, success_rating, notes, modifications_made, issues_encountered
    ]);

    // Update protocol usage count and last used
    await pool.query(`
      UPDATE professional_protocols 
      SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    res.status(201).json({
      message: 'Usage logged successfully',
      usage_log: result.rows[0]
    });
  } catch (error) {
    console.error('Error logging protocol usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add Protocol Review
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text, pros = [], cons = [], suggestions = [] } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if protocol exists
    const protocol = await pool.query('SELECT id FROM professional_protocols WHERE id = $1', [id]);
    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Check if user already reviewed this protocol
    const existingReview = await pool.query(`
      SELECT id FROM protocol_reviews WHERE protocol_id = $1 AND reviewer_id = $2
    `, [id, req.user.id]);

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this protocol' });
    }

    // Add review
    const result = await pool.query(`
      INSERT INTO protocol_reviews (
        protocol_id, reviewer_id, rating, review_text, pros, cons, suggestions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, req.user.id, rating, review_text, pros, cons, suggestions]);

    res.status(201).json({
      message: 'Review added successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding protocol review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Protocol Templates
router.get('/templates/list', authenticateToken, async (req, res) => {
  try {
    const { protocol_type, category, is_public } = req.query;

    let query = `
      SELECT 
        pt.*,
        u.first_name,
        u.last_name,
        l.name as lab_name
      FROM protocol_templates pt
      LEFT JOIN users u ON pt.created_by = u.id
      LEFT JOIN labs l ON u.lab_id = l.id
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramCount = 0;

    if (protocol_type) {
      query += ` AND pt.protocol_type = $${++paramCount}`;
      queryParams.push(protocol_type);
    }

    if (category) {
      query += ` AND pt.category = $${++paramCount}`;
      queryParams.push(category);
    }

    if (is_public !== undefined) {
      query += ` AND pt.is_public = $${++paramCount}`;
      queryParams.push(is_public === 'true');
    }

    query += ` ORDER BY pt.usage_count DESC, pt.created_at DESC`;

    const result = await pool.query(query, queryParams);

    const templates = result.rows.map(template => ({
      ...template,
      template_data: JSON.parse(template.template_data || '{}')
    }));

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching protocol templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Protocol Analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if protocol exists and user has access
    const protocol = await pool.query('SELECT id FROM professional_protocols WHERE id = $1', [id]);
    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Get usage statistics
    const usageStats = await pool.query(`
      SELECT 
        COUNT(*) as total_usage,
        COUNT(*) FILTER (WHERE execution_status = 'completed') as successful_executions,
        COUNT(*) FILTER (WHERE execution_status = 'failed') as failed_executions,
        AVG(actual_duration_minutes) as avg_duration,
        AVG(success_rating) as avg_rating
      FROM protocol_usage_logs 
      WHERE protocol_id = $1
    `, [id]);

    // Get review statistics
    const reviewStats = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        COUNT(*) FILTER (WHERE rating >= 4) as positive_reviews,
        COUNT(*) FILTER (WHERE rating <= 2) as negative_reviews
      FROM protocol_reviews 
      WHERE protocol_id = $1
    `, [id]);

    // Get usage over time (last 30 days)
    const usageOverTime = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as usage_count
      FROM protocol_usage_logs 
      WHERE protocol_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [id]);

    res.json({
      usage_stats: usageStats.rows[0],
      review_stats: reviewStats.rows[0],
      usage_over_time: usageOverTime.rows
    });
  } catch (error) {
    console.error('Error fetching protocol analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
