/**
 * Project Management & PI Review API Routes
 * MySQL-compatible (no RETURNING / || concat)
 */

import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';

const router: Router = Router();

const newId = () => crypto.randomUUID();

const userDisplayName = (alias: string) =>
  `TRIM(CONCAT(COALESCE(${alias}.first_name, ''), ' ', COALESCE(${alias}.last_name, '')))`;

async function getById(table: string, id: string) {
  const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function userBelongsToLab(userId: string, labId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 AS ok FROM lab_members
     WHERE user_id = $1 AND lab_id = $2 AND COALESCE(is_active, 1) = 1 LIMIT 1`,
    [userId, labId]
  );
  return result.rows.length > 0;
}

// ==============================================
// RESEARCH PROJECTS
// ==============================================

router.get('/projects', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { lab_id, status } = req.query;

    if (lab_id && !(await userBelongsToLab(userId, String(lab_id)))) {
      return res.status(403).json({ error: 'Not a member of this lab' });
    }

    let query = `
      SELECT
        rp.*,
        ${userDisplayName('u')} AS pi_name
      FROM research_projects rp
      LEFT JOIN users u ON rp.principal_investigator_id = u.id
      WHERE (
        rp.principal_investigator_id = $1
        OR (
          rp.lab_id IS NOT NULL
          AND rp.lab_id IN (
            SELECT lab_id FROM lab_members WHERE user_id = $2 AND COALESCE(is_active, 1) = 1
          )
        )
      )
    `;

    const params: any[] = [userId, userId];
    let paramCount = 3;

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
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
});

router.post('/projects', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      lab_id,
      project_code,
      project_title,
      project_description,
      principal_investigator_id,
      project_type,
      research_field,
      total_budget,
      planned_start_date,
      planned_end_date,
      status,
    } = req.body;

    if (!project_title || !String(project_title).trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    if (lab_id && !(await userBelongsToLab(userId, String(lab_id)))) {
      return res.status(403).json({ error: 'Not a member of this lab' });
    }

    const id = newId();
    await pool.query(
      `
      INSERT INTO research_projects (
        id, lab_id, project_code, project_title, project_description,
        principal_investigator_id, project_type, research_field,
        total_budget, planned_start_date, planned_end_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        id,
        lab_id || null,
        project_code || null,
        String(project_title).trim(),
        project_description || null,
        principal_investigator_id || req.user?.id || null,
        project_type || null,
        research_field || null,
        total_budget ?? null,
        planned_start_date || null,
        planned_end_date || null,
        status || 'planning',
      ]
    );

    const row = await getById('research_projects', id);
    res.status(201).json(row);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
  }
});

router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const [project, workPackages] = await Promise.all([
      pool.query(
        `
        SELECT
          rp.*,
          ${userDisplayName('u')} AS pi_name
        FROM research_projects rp
        LEFT JOIN users u ON rp.principal_investigator_id = u.id
        WHERE rp.id = $1
      `,
        [projectId]
      ),
      pool.query(
        `
        SELECT
          wp.*,
          ${userDisplayName('u')} AS lead_name
        FROM project_work_packages wp
        LEFT JOIN users u ON wp.lead_researcher_id = u.id
        WHERE wp.project_id = $1
        ORDER BY wp.package_code
      `,
        [projectId]
      ),
    ]);

    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      project: project.rows[0],
      workPackages: workPackages.rows,
    });
  } catch (error: any) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch project details' });
  }
});

router.put('/projects/:projectId', async (req: any, res) => {
  try {
    const { projectId } = req.params;
    const {
      project_code,
      project_title,
      project_description,
      principal_investigator_id,
      project_type,
      research_field,
      total_budget,
      planned_start_date,
      planned_end_date,
      status,
      overall_progress_percentage,
    } = req.body;

    await pool.query(
      `
      UPDATE research_projects SET
        project_code = COALESCE($1, project_code),
        project_title = COALESCE($2, project_title),
        project_description = COALESCE($3, project_description),
        principal_investigator_id = COALESCE($4, principal_investigator_id),
        project_type = COALESCE($5, project_type),
        research_field = COALESCE($6, research_field),
        total_budget = COALESCE($7, total_budget),
        planned_start_date = COALESCE($8, planned_start_date),
        planned_end_date = COALESCE($9, planned_end_date),
        status = COALESCE($10, status),
        overall_progress_percentage = COALESCE($11, overall_progress_percentage),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `,
      [
        project_code ?? null,
        project_title ?? null,
        project_description ?? null,
        principal_investigator_id ?? null,
        project_type ?? null,
        research_field ?? null,
        total_budget ?? null,
        planned_start_date ?? null,
        planned_end_date ?? null,
        status ?? null,
        overall_progress_percentage ?? null,
        projectId,
      ]
    );

    const row = await getById('research_projects', projectId);
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(row);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message || 'Failed to update project' });
  }
});

router.delete('/projects/:projectId', async (req: any, res) => {
  try {
    const { projectId } = req.params;

    const projectCheck = await pool.query(`SELECT id FROM research_projects WHERE id = $1`, [
      projectId,
    ]);

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const workPackagesCheck = await pool.query(
      `SELECT id FROM project_work_packages WHERE project_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [projectId]
    );

    if (workPackagesCheck.rows.length > 0) {
      return res.status(400).json({
        error:
          'Cannot delete project with active work packages. Please complete or cancel work packages first.',
      });
    }

    await pool.query(`DELETE FROM research_projects WHERE id = $1`, [projectId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message || 'Failed to delete project' });
  }
});

// ==============================================
// WORK PACKAGES
// ==============================================

router.post('/work-packages', async (req: any, res) => {
  try {
    const {
      project_id,
      package_code,
      package_title,
      package_description,
      lead_researcher_id,
      objectives,
      deliverables,
      planned_end_date,
      estimated_person_hours,
    } = req.body;

    const id = newId();
    await pool.query(
      `
      INSERT INTO project_work_packages (
        id, project_id, package_code, package_title, package_description,
        lead_researcher_id, objectives, deliverables,
        planned_end_date, estimated_person_hours, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'not_started')
    `,
      [
        id,
        project_id,
        package_code || null,
        package_title,
        package_description || null,
        lead_researcher_id || null,
        objectives || null,
        deliverables || null,
        planned_end_date || null,
        estimated_person_hours ?? null,
      ]
    );

    res.status(201).json(await getById('project_work_packages', id));
  } catch (error: any) {
    console.error('Error creating work package:', error);
    res.status(500).json({ error: error.message || 'Failed to create work package' });
  }
});

router.put('/work-packages/:packageId', async (req: any, res) => {
  try {
    const { packageId } = req.params;
    const { status, progress_percentage, actual_person_hours } = req.body;

    await pool.query(
      `
      UPDATE project_work_packages SET
        status = COALESCE($1, status),
        progress_percentage = COALESCE($2, progress_percentage),
        actual_person_hours = COALESCE($3, actual_person_hours),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `,
      [status ?? null, progress_percentage ?? null, actual_person_hours ?? null, packageId]
    );

    const row = await getById('project_work_packages', packageId);
    if (!row) return res.status(404).json({ error: 'Work package not found' });
    res.json(row);
  } catch (error: any) {
    console.error('Error updating work package:', error);
    res.status(500).json({ error: error.message || 'Failed to update work package' });
  }
});

// ==============================================
// TEAM HIERARCHY
// ==============================================

router.get('/team-hierarchy/:labId', async (req, res) => {
  try {
    const { labId } = req.params;

    const result = await pool.query(
      `
      SELECT
        lth.*,
        ${userDisplayName('u')} AS member_name,
        u.email AS member_email,
        ${userDisplayName('supervisor')} AS supervisor_name
      FROM lab_team_hierarchy lth
      JOIN users u ON lth.member_id = u.id
      LEFT JOIN users supervisor ON lth.reports_to = supervisor.id
      WHERE lth.lab_id = $1 AND lth.is_active = 1
      ORDER BY lth.position_level, lth.member_id
    `,
      [labId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching team hierarchy:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch team hierarchy' });
  }
});

router.post('/team-hierarchy', async (req: any, res) => {
  try {
    const {
      lab_id,
      member_id,
      reports_to,
      position_level,
      role,
      position_title,
      start_date,
      primary_responsibilities,
    } = req.body;

    const id = newId();
    await pool.query(
      `
      INSERT INTO lab_team_hierarchy (
        id, lab_id, member_id, reports_to, position_level, role,
        position_title, start_date, primary_responsibilities
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        id,
        lab_id,
        member_id,
        reports_to || null,
        position_level ?? 1,
        role || null,
        position_title || null,
        start_date || null,
        primary_responsibilities || null,
      ]
    );

    res.status(201).json(await getById('lab_team_hierarchy', id));
  } catch (error: any) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: error.message || 'Failed to add team member' });
  }
});

// ==============================================
// PROGRESS REPORTS
// ==============================================

router.get('/progress-reports', async (req: any, res) => {
  try {
    const { member_id, project_id, status } = req.query;

    let query = `
      SELECT
        mpr.*,
        ${userDisplayName('u')} AS member_name,
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
    res.status(500).json({ error: error.message || 'Failed to fetch progress reports' });
  }
});

router.post('/progress-reports', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      lab_id,
      project_id,
      work_package_id,
      report_title,
      report_period_start,
      report_period_end,
      report_type,
      summary,
      accomplishments,
      challenges_encountered,
      planned_next_steps,
      hours_worked,
    } = req.body;

    const id = newId();
    await pool.query(
      `
      INSERT INTO member_progress_reports (
        id, lab_id, member_id, project_id, work_package_id, report_title,
        report_period_start, report_period_end, report_type,
        summary, accomplishments, challenges_encountered,
        planned_next_steps, hours_worked, submission_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'submitted')
    `,
      [
        id,
        lab_id || null,
        userId,
        project_id || null,
        work_package_id || null,
        report_title,
        report_period_start || null,
        report_period_end || null,
        report_type || null,
        summary || null,
        accomplishments || null,
        challenges_encountered || null,
        planned_next_steps || null,
        hours_worked ?? null,
      ]
    );

    const senderName =
      `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || req.user.username || 'A teammate';

    try {
      const notifId = newId();
      await pool.query(
        `
        INSERT INTO progress_notifications (
          id, notification_type, recipient_id, sender_id, report_id,
          title, message, priority
        )
        SELECT
          $1,
          'report_submitted',
          rp.principal_investigator_id,
          $2,
          $3,
          'New Progress Report Submitted',
          CONCAT($4, ' submitted a progress report for ', rp.project_title),
          'normal'
        FROM research_projects rp
        WHERE rp.id = $5 AND rp.principal_investigator_id IS NOT NULL
      `,
        [notifId, userId, id, senderName, project_id]
      );
    } catch (notifErr) {
      console.warn('Progress report notification skipped:', notifErr);
    }

    res.status(201).json(await getById('member_progress_reports', id));
  } catch (error: any) {
    console.error('Error submitting progress report:', error);
    res.status(500).json({ error: error.message || 'Failed to submit progress report' });
  }
});

// ==============================================
// PI REVIEWS
// ==============================================

router.get('/progress-reports/:reportId/reviews', async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await pool.query(
      `
      SELECT
        pr.*,
        ${userDisplayName('u')} AS reviewer_name
      FROM pi_reviews pr
      LEFT JOIN users u ON pr.reviewer_id = u.id
      WHERE pr.progress_report_id = $1
      ORDER BY pr.created_at DESC
    `,
      [reportId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch reviews' });
  }
});

router.post('/pi-reviews', async (req: any, res) => {
  try {
    const reviewerId = req.user.id;
    const {
      progress_report_id,
      reviewee_id,
      overall_assessment,
      strengths,
      areas_for_improvement,
      approval_status,
      requires_resubmission,
      recommended_actions,
      progress_rating,
      quality_rating,
    } = req.body;

    const id = newId();
    await pool.query(
      `
      INSERT INTO pi_reviews (
        id, progress_report_id, reviewer_id, reviewee_id,
        overall_assessment, strengths, areas_for_improvement,
        approval_status, requires_resubmission, recommended_actions,
        progress_rating, quality_rating
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
      [
        id,
        progress_report_id,
        reviewerId,
        reviewee_id,
        overall_assessment || null,
        strengths || null,
        areas_for_improvement || null,
        approval_status || null,
        requires_resubmission ? 1 : 0,
        recommended_actions || null,
        progress_rating ?? null,
        quality_rating ?? null,
      ]
    );

    await pool.query(
      `
      UPDATE member_progress_reports SET
        submission_status = CASE
          WHEN $1 = 'approved' THEN 'approved'
          WHEN $1 = 'revision_requested' THEN 'revision_requested'
          ELSE submission_status
        END
      WHERE id = $2
    `,
      [approval_status, progress_report_id]
    );

    try {
      const notifId = newId();
      await pool.query(
        `
        INSERT INTO progress_notifications (
          id, notification_type, recipient_id, sender_id, report_id, review_id,
          title, message, priority
        )
        VALUES (
          $1, 'review_completed', $2, $3, $4, $5,
          'Your Progress Report Has Been Reviewed',
          CONCAT('Your PI has reviewed your progress report. Status: ', $6),
          CASE WHEN $7 = 1 THEN 'high' ELSE 'normal' END
        )
      `,
        [
          notifId,
          reviewee_id,
          reviewerId,
          progress_report_id,
          id,
          approval_status || 'reviewed',
          requires_resubmission ? 1 : 0,
        ]
      );
    } catch (notifErr) {
      console.warn('PI review notification skipped:', notifErr);
    }

    res.status(201).json(await getById('pi_reviews', id));
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// ==============================================
// NOTIFICATIONS
// ==============================================

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
      params.push(is_read === 'true' || is_read === true || is_read === '1' ? 1 : 0);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit) || 50);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:notificationId/read', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    await pool.query(
      `
      UPDATE progress_notifications SET
        is_read = 1,
        read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND recipient_id = $2
    `,
      [notificationId, userId]
    );

    const row = await getById('progress_notifications', notificationId);
    if (!row) return res.status(404).json({ error: 'Notification not found' });
    res.json(row);
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

// ==============================================
// TEAM MEETINGS
// ==============================================

router.get('/meetings', async (req: any, res) => {
  try {
    const { lab_id, project_id, upcoming = 'false' } = req.query;

    let query = `
      SELECT
        tm.*,
        ${userDisplayName('u')} AS organizer_name
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
    res.status(500).json({ error: error.message || 'Failed to fetch meetings' });
  }
});

router.post('/meetings', async (req: any, res) => {
  try {
    const organizerId = req.user.id;
    const {
      lab_id,
      project_id,
      meeting_title,
      meeting_type,
      scheduled_date,
      duration_minutes,
      agenda_items,
      required_attendees,
    } = req.body;

    const id = newId();
    await pool.query(
      `
      INSERT INTO team_meetings (
        id, lab_id, project_id, organizer_id, meeting_title, meeting_type,
        scheduled_date, duration_minutes, agenda_items, required_attendees, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
    `,
      [
        id,
        lab_id || null,
        project_id || null,
        organizerId,
        meeting_title,
        meeting_type || null,
        scheduled_date,
        duration_minutes ?? 60,
        typeof agenda_items === 'string' ? agenda_items : JSON.stringify(agenda_items || []),
        typeof required_attendees === 'string'
          ? required_attendees
          : JSON.stringify(required_attendees || []),
      ]
    );

    res.status(201).json(await getById('team_meetings', id));
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: error.message || 'Failed to create meeting' });
  }
});

export default router;
