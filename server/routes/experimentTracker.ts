import { Request, Response, Router } from 'express';
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

const router: Router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all experiments for a user
export const getExperiments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status, category, priority, search } = req.query;

    let query = `
      SELECT 
        e.*,
        u.username as researcher_name,
        l.name as lab_name,
        calculate_experiment_progress(e.id) as progress_percentage,
        COUNT(em.id) as total_milestones,
        COUNT(CASE WHEN em.status = 'completed' THEN 1 END) as completed_milestones,
        COUNT(CASE WHEN em.status = 'overdue' THEN 1 END) as overdue_milestones
      FROM experiments e
      LEFT JOIN users u ON e.researcher_id = u.id
      LEFT JOIN labs l ON e.lab_id = l.id
      LEFT JOIN experiment_milestones em ON e.id = em.experiment_id
      WHERE e.researcher_id = $1 OR $2 = ANY(e.collaborators)
    `;

    const params: any[] = [userId, userId];
    let paramCount = 2;

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
    }

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND e.category = $${paramCount}`;
      params.push(category);
    }

    if (priority && priority !== 'all') {
      paramCount++;
      query += ` AND e.priority = $${paramCount}`;
      params.push(priority);
    }

    if (search) {
      paramCount++;
      query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount} OR $${paramCount} = ANY(e.tags))`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY e.id, u.username, l.name ORDER BY e.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single experiment by ID
export const getExperiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const experimentQuery = `
      SELECT 
        e.*,
        u.username as researcher_name,
        l.name as lab_name,
        calculate_experiment_progress(e.id) as progress_percentage
      FROM experiments e
      LEFT JOIN users u ON e.researcher_id = u.id
      LEFT JOIN labs l ON e.lab_id = l.id
      WHERE e.id = $1 AND (e.researcher_id = $2 OR $2 = ANY(e.collaborators))
    `;

    const experimentResult = await pool.query(experimentQuery, [id, userId]);
    
    if (experimentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const experiment = experimentResult.rows[0];

    // Get milestones
    const milestonesQuery = `
      SELECT * FROM experiment_milestones 
      WHERE experiment_id = $1 
      ORDER BY due_date ASC
    `;
    const milestonesResult = await pool.query(milestonesQuery, [id]);

    // Get risks
    const risksQuery = `
      SELECT * FROM experiment_risks 
      WHERE experiment_id = $1 
      ORDER BY created_at ASC
    `;
    const risksResult = await pool.query(risksQuery, [id]);

    // Get progress log
    const progressQuery = `
      SELECT 
        pl.*,
        u.username as user_name
      FROM experiment_progress_log pl
      LEFT JOIN users u ON pl.user_id = u.id
      WHERE pl.experiment_id = $1 
      ORDER BY pl.created_at DESC
    `;
    const progressResult = await pool.query(progressQuery, [id]);

    // Get comments
    const commentsQuery = `
      SELECT 
        c.*,
        u.username as user_name
      FROM experiment_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.experiment_id = $1 
      ORDER BY c.created_at ASC
    `;
    const commentsResult = await pool.query(commentsQuery, [id]);

    res.json({
      ...experiment,
      milestones: milestonesResult.rows,
      risks: risksResult.rows,
      progress_log: progressResult.rows,
      comments: commentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching experiment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new experiment
export const createExperiment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      title,
      description,
      hypothesis,
      objectives,
      methodology,
      expectedOutcomes,
      priority,
      category,
      estimatedDuration,
      dueDate,
      labId,
      collaborators,
      equipment,
      materials,
      reagents,
      safetyRequirements,
      budget,
      tags,
      notes,
      templateId,
      milestones,
      risks
    } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert experiment
      const experimentQuery = `
        INSERT INTO experiments (
          title, description, hypothesis, objectives, methodology, expected_outcomes,
          priority, category, estimated_duration, due_date, lab_id, researcher_id,
          collaborators, equipment, materials, reagents, safety_requirements,
          budget, tags, notes, template_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `;

      const experimentValues = [
        title, description, hypothesis, objectives || [], methodology, expectedOutcomes || [],
        priority || 'medium', category, estimatedDuration, dueDate, labId, userId,
        collaborators || [], equipment || [], materials || [], reagents || [], safetyRequirements || [],
        budget || 0, tags || [], notes, templateId
      ];

      const experimentResult = await client.query(experimentQuery, experimentValues);
      const experiment = experimentResult.rows[0];

      // Insert milestones if provided
      if (milestones && milestones.length > 0) {
        for (const milestone of milestones) {
          const milestoneQuery = `
            INSERT INTO experiment_milestones (
              experiment_id, title, description, due_date
            ) VALUES ($1, $2, $3, $4)
          `;
          await client.query(milestoneQuery, [
            experiment.id, milestone.title, milestone.description, milestone.dueDate
          ]);
        }
      }

      // Insert risks if provided
      if (risks && risks.length > 0) {
        for (const risk of risks) {
          const riskQuery = `
            INSERT INTO experiment_risks (
              experiment_id, title, description, probability, impact, mitigation
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `;
          await client.query(riskQuery, [
            experiment.id, risk.title, risk.description, risk.probability, risk.impact, risk.mitigation
          ]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json(experiment);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating experiment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an experiment
export const updateExperiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const updateData = req.body;

    // Check if user has permission to update this experiment
    const checkQuery = `
      SELECT researcher_id, collaborators FROM experiments 
      WHERE id = $1 AND (researcher_id = $2 OR $2 = ANY(collaborators))
    `;
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found or no permission' });
    }

    const experiment = checkResult.rows[0];
    const isOwner = experiment.researcher_id === userId;

    // Build dynamic update query
    const allowedFields = [
      'title', 'description', 'hypothesis', 'objectives', 'methodology', 'expected_outcomes',
      'status', 'priority', 'category', 'estimated_duration', 'actual_duration',
      'start_date', 'end_date', 'due_date', 'collaborators', 'equipment', 'materials',
      'reagents', 'safety_requirements', 'budget', 'actual_cost', 'tags', 'notes',
      'results', 'conclusions', 'next_steps', 'attachments'
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `
      UPDATE experiments 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating experiment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an experiment
export const deleteExperiment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user is the owner of the experiment
    const checkQuery = 'SELECT researcher_id FROM experiments WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    if (checkResult.rows[0].researcher_id !== userId) {
      return res.status(403).json({ error: 'Only the experiment owner can delete it' });
    }

    const deleteQuery = 'DELETE FROM experiments WHERE id = $1';
    await pool.query(deleteQuery, [id]);
    
    res.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get experiment templates
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let query = `
      SELECT * FROM experiment_templates 
      WHERE is_public = true
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY usage_count DESC, created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create experiment template
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      name,
      category,
      description,
      methodology,
      estimatedDuration,
      equipment,
      materials,
      reagents,
      safetyRequirements,
      isPublic
    } = req.body;

    const query = `
      INSERT INTO experiment_templates (
        name, category, description, methodology, estimated_duration,
        equipment, materials, reagents, safety_requirements, created_by, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      name, category, description, methodology, estimatedDuration,
      equipment || [], materials || [], reagents || [], safetyRequirements || [],
      userId, isPublic || false
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add milestone to experiment
export const addMilestone = async (req: Request, res: Response) => {
  try {
    const { experimentId } = req.params;
    const userId = (req as any).user.id;
    const { title, description, dueDate } = req.body;

    // Check if user has permission
    const checkQuery = `
      SELECT researcher_id, collaborators FROM experiments 
      WHERE id = $1 AND (researcher_id = $2 OR $2 = ANY(collaborators))
    `;
    const checkResult = await pool.query(checkQuery, [experimentId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found or no permission' });
    }

    const query = `
      INSERT INTO experiment_milestones (experiment_id, title, description, due_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [experimentId, title, description, dueDate]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update milestone status
export const updateMilestoneStatus = async (req: Request, res: Response) => {
  try {
    const { milestoneId } = req.params;
    const userId = (req as any).user.id;
    const { status, notes } = req.body;

    // Check if user has permission
    const checkQuery = `
      SELECT e.researcher_id, e.collaborators 
      FROM experiment_milestones em
      JOIN experiments e ON em.experiment_id = e.id
      WHERE em.id = $1 AND (e.researcher_id = $2 OR $2 = ANY(e.collaborators))
    `;
    const checkResult = await pool.query(checkQuery, [milestoneId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found or no permission' });
    }

    const updateFields = ['status'];
    const values = [status];
    let paramCount = 1;

    if (notes !== undefined) {
      updateFields.push('notes');
      values.push(notes);
      paramCount++;
    }

    if (status === 'completed') {
      updateFields.push('completed_at');
      values.push(new Date());
      paramCount++;
    }

    values.push(milestoneId);
    const query = `
      UPDATE experiment_milestones 
      SET ${updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add progress log entry
export const addProgressLog = async (req: Request, res: Response) => {
  try {
    const { experimentId } = req.params;
    const userId = (req as any).user.id;
    const { status, notes, durationLogged, costLogged, attachments } = req.body;

    // Check if user has permission
    const checkQuery = `
      SELECT researcher_id, collaborators FROM experiments 
      WHERE id = $1 AND (researcher_id = $2 OR $2 = ANY(collaborators))
    `;
    const checkResult = await pool.query(checkQuery, [experimentId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Experiment not found or no permission' });
    }

    const query = `
      INSERT INTO experiment_progress_log (
        experiment_id, user_id, status, notes, duration_logged, cost_logged, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      experimentId, userId, status, notes, durationLogged || 0, costLogged || 0, attachments || []
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding progress log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get experiment analytics
export const getExperimentAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { timeframe = '30' } = req.query;

    const query = `
      SELECT 
        COUNT(*) as total_experiments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_experiments,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running_experiments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_experiments,
        AVG(actual_duration) as avg_duration,
        AVG(actual_cost) as avg_cost,
        COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'completed' THEN 1 END) as overdue_experiments
      FROM experiments 
      WHERE researcher_id = $1 
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${timeframe} days'
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Define routes
router.get('/', getExperiments);
router.get('/analytics', getExperimentAnalytics);
router.get('/templates', getTemplates);
router.get('/:id', getExperiment);
router.post('/', createExperiment);
router.post('/templates', createTemplate);
router.post('/:experimentId/milestones', addMilestone);
router.post('/:experimentId/progress', addProgressLog);
router.put('/:id', updateExperiment);
router.put('/milestones/:milestoneId', updateMilestoneStatus);
router.delete('/:id', deleteExperiment);

export default router;
