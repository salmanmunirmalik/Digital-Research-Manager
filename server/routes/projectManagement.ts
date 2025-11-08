/**
 * Project Management & PI Review API Routes
 * Team hierarchy, work packages, progress reports, PI reviews
 */

import { Router } from 'express';
import pool from '../../database/config.js';

const router: Router = Router();

// ==============================================
// RESEARCH PROJECTS
// ==============================================

// Get lab's research projects
router.get('/projects', async (req: any, res) => {
  try {
    const { lab_id, status } = req.query;
    
    let query = `
      SELECT 
        rp.*,
        u.first_name || ' ' || u.last_name as pi_name
      FROM research_projects rp
      LEFT JOIN users u ON rp.principal_investigator_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (lab_id) {
      query += ` AND rp.lab_id = $${paramCount}`;
      params.push(lab_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND rp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY rp.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a research project
router.post('/projects', async (req: any, res) => {
  try {
    const {
      lab_id, project_code, project_title, project_description,
      principal_investigator_id, project_type, research_field,
      total_budget, planned_start_date, planned_end_date
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO research_projects (
        lab_id, project_code, project_title, project_description,
        principal_investigator_id, project_type, research_field,
        total_budget, planned_start_date, planned_end_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'planning')
      RETURNING *
    `, [lab_id, project_code, project_title, project_description,
        principal_investigator_id, project_type, research_field,
        total_budget, planned_start_date, planned_end_date]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project details with work packages
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const [project, workPackages] = await Promise.all([
      pool.query(`
        SELECT 
          rp.*,
          u.first_name || ' ' || u.last_name as pi_name
        FROM research_projects rp
        LEFT JOIN users u ON rp.principal_investigator_id = u.id
        WHERE rp.id = $1
      `, [projectId]),
      
      pool.query(`
        SELECT 
          wp.*,
          u.first_name || ' ' || u.last_name as lead_name
        FROM project_work_packages wp
        LEFT JOIN users u ON wp.lead_researcher_id = u.id
        WHERE wp.project_id = $1
        ORDER BY wp.package_code
      `, [projectId])
    ]);
    
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({
      project: project.rows[0],
      workPackages: workPackages.rows
    });
  } catch (error: any) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// ==============================================
// WORK PACKAGES
// ==============================================

// Create work package
router.post('/work-packages', async (req: any, res) => {
  try {
    const {
      project_id, package_code, package_title, package_description,
      lead_researcher_id, objectives, deliverables,
      planned_end_date, estimated_person_hours
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO project_work_packages (
        project_id, package_code, package_title, package_description,
        lead_researcher_id, objectives, deliverables,
        planned_end_date, estimated_person_hours,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'not_started')
      RETURNING *
    `, [project_id, package_code, package_title, package_description,
        lead_researcher_id, objectives, deliverables,
        planned_end_date, estimated_person_hours]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating work package:', error);
    res.status(500).json({ error: 'Failed to create work package' });
  }
});

// Update work package status
router.put('/work-packages/:packageId', async (req: any, res) => {
  try {
    const { packageId } = req.params;
    const { status, progress_percentage, actual_person_hours } = req.body;
    
    const result = await pool.query(`
      UPDATE project_work_packages SET
        status = COALESCE($1, status),
        progress_percentage = COALESCE($2, progress_percentage),
        actual_person_hours = COALESCE($3, actual_person_hours),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, progress_percentage, actual_person_hours, packageId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work package not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating work package:', error);
    res.status(500).json({ error: 'Failed to update work package' });
  }
});

// ==============================================
// TEAM HIERARCHY
// ==============================================

// Get lab team hierarchy
router.get('/team-hierarchy/:labId', async (req, res) => {
  try {
    const { labId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        lth.*,
        u.first_name || ' ' || u.last_name as member_name,
        u.email as member_email,
        supervisor.first_name || ' ' || supervisor.last_name as supervisor_name
      FROM lab_team_hierarchy lth
      JOIN users u ON lth.member_id = u.id
      LEFT JOIN users supervisor ON lth.reports_to = supervisor.id
      WHERE lth.lab_id = $1 AND lth.is_active = true
      ORDER BY lth.position_level, lth.member_id
    `, [labId]);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching team hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch team hierarchy' });
  }
});

// Add team member to hierarchy
router.post('/team-hierarchy', async (req: any, res) => {
  try {
    const {
      lab_id, member_id, reports_to, position_level, role,
      position_title, start_date, primary_responsibilities
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO lab_team_hierarchy (
        lab_id, member_id, reports_to, position_level, role,
        position_title, start_date, primary_responsibilities
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [lab_id, member_id, reports_to, position_level, role,
        position_title, start_date, primary_responsibilities]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// ==============================================
// PROGRESS REPORTS
// ==============================================

// Get member's progress reports
router.get('/progress-reports', async (req: any, res) => {
  try {
    const { member_id, project_id, status } = req.query;
    
    let query = `
      SELECT 
        mpr.*,
        u.first_name || ' ' || u.last_name as member_name,
        p.project_title
      FROM member_progress_reports mpr
      LEFT JOIN users u ON mpr.member_id = u.id
      LEFT JOIN research_projects p ON mpr.project_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (member_id) {
      query += ` AND mpr.member_id = $${paramCount}`;
      params.push(member_id);
      paramCount++;
    }
    
    if (project_id) {
      query += ` AND mpr.project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND mpr.submission_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY mpr.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching progress reports:', error);
    res.status(500).json({ error: 'Failed to fetch progress reports' });
  }
});

// Submit progress report
router.post('/progress-reports', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      lab_id, project_id, work_package_id, report_title,
      report_period_start, report_period_end, report_type,
      summary, accomplishments, challenges_encountered,
      planned_next_steps, hours_worked
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO member_progress_reports (
        lab_id, member_id, project_id, work_package_id, report_title,
        report_period_start, report_period_end, report_type,
        summary, accomplishments, challenges_encountered,
        planned_next_steps, hours_worked, submission_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'submitted')
      RETURNING *
    `, [lab_id, userId, project_id, work_package_id, report_title,
        report_period_start, report_period_end, report_type,
        summary, accomplishments, challenges_encountered,
        planned_next_steps, hours_worked]);
    
    // Create notification for PI
    await pool.query(`
      INSERT INTO progress_notifications (
        notification_type, recipient_id, sender_id, report_id,
        title, message, priority
      )
      SELECT 
        'report_submitted',
        rp.principal_investigator_id,
        $1,
        $2,
        'New Progress Report Submitted',
        $3 || ' submitted a progress report for ' || rp.project_title,
        'normal'
      FROM research_projects rp
      WHERE rp.id = $4
    `, [userId, result.rows[0].id, req.user.first_name + ' ' + req.user.last_name, project_id]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error submitting progress report:', error);
    res.status(500).json({ error: 'Failed to submit progress report' });
  }
});

// ==============================================
// PI REVIEWS
// ==============================================

// Get reviews for a report
router.get('/progress-reports/:reportId/reviews', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        pr.*,
        u.first_name || ' ' || u.last_name as reviewer_name
      FROM pi_reviews pr
      LEFT JOIN users u ON pr.reviewer_id = u.id
      WHERE pr.progress_report_id = $1
      ORDER BY pr.created_at DESC
    `, [reportId]);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit PI review
router.post('/pi-reviews', async (req: any, res) => {
  try {
    const reviewerId = req.user.id;
    const {
      progress_report_id, reviewee_id, overall_assessment,
      strengths, areas_for_improvement, approval_status,
      requires_resubmission, recommended_actions,
      progress_rating, quality_rating
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO pi_reviews (
        progress_report_id, reviewer_id, reviewee_id,
        overall_assessment, strengths, areas_for_improvement,
        approval_status, requires_resubmission, recommended_actions,
        progress_rating, quality_rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [progress_report_id, reviewerId, reviewee_id, overall_assessment,
        strengths, areas_for_improvement, approval_status,
        requires_resubmission, recommended_actions, progress_rating, quality_rating]);
    
    // Update report status
    await pool.query(`
      UPDATE member_progress_reports SET
        submission_status = CASE 
          WHEN $1 = 'approved' THEN 'approved'
          WHEN $1 = 'revision_requested' THEN 'revision_requested'
          ELSE submission_status
        END
      WHERE id = $2
    `, [approval_status, progress_report_id]);
    
    // Create notification for member
    await pool.query(`
      INSERT INTO progress_notifications (
        notification_type, recipient_id, sender_id, report_id, review_id,
        title, message, priority
      )
      VALUES (
        'review_completed',
        $1,
        $2,
        $3,
        $4,
        'Your Progress Report Has Been Reviewed',
        'Your PI has reviewed your progress report. Status: ' || $5,
        CASE WHEN $6 THEN 'high' ELSE 'normal' END
      )
    `, [reviewee_id, reviewerId, progress_report_id, result.rows[0].id,
        approval_status, requires_resubmission]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ==============================================
// NOTIFICATIONS
// ==============================================

// Get user's notifications
router.get('/notifications', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { is_read, limit = 50 } = req.query;
    
    let query = `
      SELECT * FROM progress_notifications
      WHERE recipient_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (is_read !== undefined) {
      query += ` AND is_read = $2`;
      params.push(is_read === 'true');
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    
    const result = await pool.query(`
      UPDATE progress_notifications SET
        is_read = true,
        read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND recipient_id = $2
      RETURNING *
    `, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ==============================================
// TEAM MEETINGS
// ==============================================

// Get team meetings
router.get('/meetings', async (req: any, res) => {
  try {
    const { lab_id, project_id, upcoming = 'false' } = req.query;
    
    let query = `
      SELECT 
        tm.*,
        u.first_name || ' ' || u.last_name as organizer_name
      FROM team_meetings tm
      LEFT JOIN users u ON tm.organizer_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (lab_id) {
      query += ` AND tm.lab_id = $${paramCount}`;
      params.push(lab_id);
      paramCount++;
    }
    
    if (project_id) {
      query += ` AND tm.project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }
    
    if (upcoming === 'true') {
      query += ` AND tm.scheduled_date > CURRENT_TIMESTAMP AND tm.status = 'scheduled'`;
    }
    
    query += ` ORDER BY tm.scheduled_date DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Create team meeting
router.post('/meetings', async (req: any, res) => {
  try {
    const organizerId = req.user.id;
    const {
      lab_id, project_id, meeting_title, meeting_type,
      scheduled_date, duration_minutes, agenda_items,
      required_attendees
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO team_meetings (
        lab_id, project_id, organizer_id, meeting_title, meeting_type,
        scheduled_date, duration_minutes, agenda_items, required_attendees,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
      RETURNING *
    `, [lab_id, project_id, organizerId, meeting_title, meeting_type,
        scheduled_date, duration_minutes, agenda_items, required_attendees]);
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

export default router;

