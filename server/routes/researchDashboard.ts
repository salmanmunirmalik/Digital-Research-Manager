// Research Dashboard API Routes
// Additional routes for research-focused dashboard functionality

// Research Projects Management
app.get('/api/research/projects', authenticateToken, async (req, res) => {
  try {
    const { lab_id, status, priority } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT p.*, 
             u.first_name || ' ' || u.last_name as lead_researcher_name,
             COUNT(pm.id) as milestone_count,
             COUNT(CASE WHEN pm.completed = true THEN 1 END) as completed_milestones
      FROM projects p
      JOIN users u ON p.lead_researcher_id = u.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      WHERE p.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND p.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    query += ` GROUP BY p.id, u.first_name, u.last_name ORDER BY p.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Error fetching research projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/research/projects', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      lab_id,
      priority = 'medium',
      start_date,
      end_date,
      budget,
      funding_source,
      funding_amount,
      funding_end_date,
      objectives
    } = req.body;

    const userId = (req as any).user.id;

    if (!title || !lab_id) {
      return res.status(400).json({ error: 'Title and lab_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO projects (
        title, description, lab_id, lead_researcher_id, priority,
        start_date, end_date, budget, funding_source, funding_amount,
        funding_end_date, objectives
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, description, lab_id, userId, priority,
      start_date, end_date, budget, funding_source, funding_amount,
      funding_end_date, objectives || []
    ]);

    res.status(201).json({ project: result.rows[0] });
  } catch (error) {
    console.error('Error creating research project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Project Milestones Management
app.get('/api/research/projects/:projectId/milestones', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.id;

    const result = await pool.query(`
      SELECT pm.*, u.first_name || ' ' || u.last_name as completed_by_name
      FROM project_milestones pm
      LEFT JOIN users u ON pm.completed_by = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.due_date ASC
    `, [projectId]);

    res.json({ milestones: result.rows });
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/research/projects/:projectId/milestones', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, due_date, priority = 'medium' } = req.body;
    const userId = (req as any).user.id;

    if (!title || !due_date) {
      return res.status(400).json({ error: 'Title and due_date are required' });
    }

    const result = await pool.query(`
      INSERT INTO project_milestones (project_id, title, description, due_date, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [projectId, title, description, due_date, priority]);

    res.status(201).json({ milestone: result.rows[0] });
  } catch (error) {
    console.error('Error creating project milestone:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Deadlines Management
app.get('/api/research/deadlines', authenticateToken, async (req, res) => {
  try {
    const { lab_id, priority, status, type } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT rd.*, 
             u.first_name || ' ' || u.last_name as assigned_to_name,
             p.title as project_title
      FROM research_deadlines rd
      LEFT JOIN users u ON rd.assigned_to = u.id
      LEFT JOIN projects p ON rd.related_project_id = p.id
      WHERE rd.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (priority) {
      paramCount++;
      query += ` AND rd.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    if (status) {
      paramCount++;
      query += ` AND rd.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND rd.deadline_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY rd.deadline_date ASC`;

    const result = await pool.query(query, queryParams);
    res.json({ deadlines: result.rows });
  } catch (error) {
    console.error('Error fetching research deadlines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/research/deadlines', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      deadline_type,
      deadline_date,
      priority = 'medium',
      related_project_id,
      lab_id,
      assigned_to,
      reminder_days = 7,
      notes
    } = req.body;

    const userId = (req as any).user.id;

    if (!title || !deadline_type || !deadline_date || !lab_id) {
      return res.status(400).json({ error: 'Title, deadline_type, deadline_date, and lab_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO research_deadlines (
        title, description, deadline_type, deadline_date, priority,
        related_project_id, lab_id, assigned_to, created_by, reminder_days, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      title, description, deadline_type, deadline_date, priority,
      related_project_id, lab_id, assigned_to, userId, reminder_days, notes
    ]);

    res.status(201).json({ deadline: result.rows[0] });
  } catch (error) {
    console.error('Error creating research deadline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Activity Feed
app.get('/api/research/activities', authenticateToken, async (req, res) => {
  try {
    const { lab_id, type, limit = 50 } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT ra.*, 
             u.first_name || ' ' || u.last_name as user_name,
             p.title as project_title
      FROM research_activities ra
      JOIN users u ON ra.user_id = u.id
      LEFT JOIN projects p ON ra.project_id = p.id
      WHERE ra.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND ra.activity_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY ra.created_at DESC LIMIT $${paramCount + 1}`;
    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);
    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Error fetching research activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/research/activities', authenticateToken, async (req, res) => {
  try {
    const {
      activity_type,
      title,
      description,
      lab_id,
      project_id,
      related_entity_type,
      related_entity_id,
      impact_level = 'medium',
      metadata = {}
    } = req.body;

    const userId = (req as any).user.id;

    if (!activity_type || !title || !lab_id) {
      return res.status(400).json({ error: 'activity_type, title, and lab_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO research_activities (
        activity_type, title, description, user_id, lab_id, project_id,
        related_entity_type, related_entity_id, impact_level, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      activity_type, title, description, userId, lab_id, project_id,
      related_entity_type, related_entity_id, impact_level, JSON.stringify(metadata)
    ]);

    res.status(201).json({ activity: result.rows[0] });
  } catch (error) {
    console.error('Error creating research activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Insights Management
app.get('/api/research/insights', authenticateToken, async (req, res) => {
  try {
    const { lab_id, priority, category, user_id } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT ri.*, 
             u.first_name || ' ' || u.last_name as user_name,
             p.title as project_title
      FROM research_insights ri
      LEFT JOIN users u ON ri.user_id = u.id
      LEFT JOIN projects p ON ri.project_id = p.id
      WHERE ri.lab_id = $1 AND (ri.user_id IS NULL OR ri.user_id = $2)
    `;
    
    const queryParams = [lab_id, userId];
    let paramCount = 2;

    if (priority) {
      paramCount++;
      query += ` AND ri.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    if (category) {
      paramCount++;
      query += ` AND ri.category = $${paramCount}`;
      queryParams.push(category);
    }

    query += ` ORDER BY ri.priority DESC, ri.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ insights: result.rows });
  } catch (error) {
    console.error('Error fetching research insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/research/insights', authenticateToken, async (req, res) => {
  try {
    const {
      insight_type,
      title,
      description,
      category,
      priority = 'medium',
      confidence_score = 50,
      action_label,
      action_route,
      action_type = 'navigate',
      lab_id,
      user_id,
      project_id,
      expires_at,
      metadata = {}
    } = req.body;

    const createdBy = (req as any).user.id;

    if (!insight_type || !title || !description || !category || !lab_id) {
      return res.status(400).json({ error: 'insight_type, title, description, category, and lab_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO research_insights (
        insight_type, title, description, category, priority, confidence_score,
        action_label, action_route, action_type, lab_id, user_id, project_id,
        expires_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      insight_type, title, description, category, priority, confidence_score,
      action_label, action_route, action_type, lab_id, user_id, project_id,
      expires_at, JSON.stringify(metadata)
    ]);

    res.status(201).json({ insight: result.rows[0] });
  } catch (error) {
    console.error('Error creating research insight:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Metrics Calculation
app.get('/api/research/metrics', authenticateToken, async (req, res) => {
  try {
    const { lab_id } = req.query;
    const userId = (req as any).user.id;

    // Calculate real-time metrics
    const metrics = await Promise.all([
      // Total Projects
      pool.query('SELECT COUNT(*) as count FROM projects WHERE lab_id = $1', [lab_id]),
      
      // Active Experiments (from lab notebook entries)
      pool.query(`
        SELECT COUNT(*) as count 
        FROM lab_notebook_entries 
        WHERE lab_id = $1 AND entry_type = 'experiment' AND status = 'in_progress'
      `, [lab_id]),
      
      // Publications this year (mock - would need actual publication tracking)
      pool.query(`
        SELECT COUNT(*) as count 
        FROM results 
        WHERE lab_id = $1 AND data_type = 'publication' 
        AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
      `, [lab_id]),
      
      // Citations total (mock - would need actual citation tracking)
      pool.query(`
        SELECT COALESCE(SUM(CAST(metadata->>'citations' AS INTEGER)), 0) as count
        FROM results 
        WHERE lab_id = $1 AND data_type = 'publication'
      `, [lab_id]),
      
      // Collaboration score (based on active collaborations)
      pool.query(`
        SELECT COUNT(*) as count 
        FROM research_collaborations 
        WHERE lab_id = $1 AND status = 'active'
      `, [lab_id])
    ]);

    const researchMetrics = {
      totalProjects: parseInt(metrics[0].rows[0].count),
      activeExperiments: parseInt(metrics[1].rows[0].count),
      publicationsThisYear: parseInt(metrics[2].rows[0].count),
      citationsTotal: parseInt(metrics[3].rows[0].count),
      collaborationScore: Math.min(100, parseInt(metrics[4].rows[0].count) * 20), // Simple scoring
      productivityTrend: 'up', // Would need historical data to calculate
      fundingSecured: 0, // Would need funding tracking
      grantApplications: 0, // Would need grant tracking
      conferencePresentations: 0 // Would need conference tracking
    };

    res.json({ metrics: researchMetrics });
  } catch (error) {
    console.error('Error calculating research metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Collaborations Management
app.get('/api/research/collaborations', authenticateToken, async (req, res) => {
  try {
    const { lab_id, status, type } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT rc.*, 
             u.first_name || ' ' || u.last_name as lead_researcher_name,
             COUNT(cp.id) as partner_count
      FROM research_collaborations rc
      JOIN users u ON rc.lead_researcher_id = u.id
      LEFT JOIN collaboration_partners cp ON rc.id = cp.collaboration_id
      WHERE rc.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND rc.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND rc.collaboration_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` GROUP BY rc.id, u.first_name, u.last_name ORDER BY rc.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ collaborations: result.rows });
  } catch (error) {
    console.error('Error fetching research collaborations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/research/collaborations', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      collaboration_type,
      status = 'proposed',
      start_date,
      end_date,
      lab_id,
      funding_amount = 0,
      publications_count = 0,
      outcomes = []
    } = req.body;

    const userId = (req as any).user.id;

    if (!title || !collaboration_type || !start_date || !lab_id) {
      return res.status(400).json({ error: 'Title, collaboration_type, start_date, and lab_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO research_collaborations (
        title, description, collaboration_type, status, start_date, end_date,
        lab_id, lead_researcher_id, funding_amount, publications_count, outcomes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      title, description, collaboration_type, status, start_date, end_date,
      lab_id, userId, funding_amount, publications_count, outcomes
    ]);

    res.status(201).json({ collaboration: result.rows[0] });
  } catch (error) {
    console.error('Error creating research collaboration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Trends Management
app.get('/api/research/trends', authenticateToken, async (req, res) => {
  try {
    const { category, impact_level, lab_id } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT rt.*
      FROM research_trends rt
      WHERE (rt.lab_id = $1 OR rt.lab_id IS NULL)
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND rt.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (impact_level) {
      paramCount++;
      query += ` AND rt.impact_level = $${paramCount}`;
      queryParams.push(impact_level);
    }

    query += ` ORDER BY rt.relevance_score DESC, rt.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Error fetching research trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default {
  // Export the routes for use in main server file
};
