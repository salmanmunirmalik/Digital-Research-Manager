/**
 * Scientist Passport API Routes
 * Handles skills, certifications, availability, endorsements, and speaking profile
 */

import { Router } from 'express';
import pool from '../../database/config.js';

const router = Router();

// ==============================================
// TECHNICAL SKILLS
// ==============================================

// Get user's technical skills
router.get('/skills', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        id, skill_name, skill_category, proficiency_level,
        years_experience, last_used, is_verified, 
        endorsements_count, created_at
      FROM user_technical_skills
      WHERE user_id = $1
      ORDER BY proficiency_level DESC, endorsements_count DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching technical skills:', error);
    res.status(500).json({ error: 'Failed to fetch technical skills' });
  }
});

// Add a technical skill
router.post('/skills', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { 
      skill_name, skill_category, proficiency_level, 
      years_experience, last_used 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO user_technical_skills (
        user_id, skill_name, skill_category, proficiency_level,
        years_experience, last_used
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, skill_name) 
      DO UPDATE SET
        skill_category = EXCLUDED.skill_category,
        proficiency_level = EXCLUDED.proficiency_level,
        years_experience = EXCLUDED.years_experience,
        last_used = EXCLUDED.last_used,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, skill_name, skill_category, proficiency_level, years_experience, last_used]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding technical skill:', error);
    res.status(500).json({ error: 'Failed to add technical skill' });
  }
});

// Update a technical skill
router.put('/skills/:skillId', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;
    const { proficiency_level, years_experience, last_used } = req.body;

    const result = await pool.query(`
      UPDATE user_technical_skills
      SET 
        proficiency_level = COALESCE($1, proficiency_level),
        years_experience = COALESCE($2, years_experience),
        last_used = COALESCE($3, last_used),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [proficiency_level, years_experience, last_used, skillId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating technical skill:', error);
    res.status(500).json({ error: 'Failed to update technical skill' });
  }
});

// Delete a technical skill
router.delete('/skills/:skillId', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;

    const result = await pool.query(`
      DELETE FROM user_technical_skills
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [skillId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting technical skill:', error);
    res.status(500).json({ error: 'Failed to delete technical skill' });
  }
});

// ==============================================
// SOFTWARE EXPERTISE
// ==============================================

// Get user's software expertise
router.get('/software', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM user_software_expertise
      WHERE user_id = $1
      ORDER BY proficiency_level DESC, years_experience DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching software expertise:', error);
    res.status(500).json({ error: 'Failed to fetch software expertise' });
  }
});

// Add software expertise
router.post('/software', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { 
      software_name, software_type, proficiency_level,
      version_used, years_experience, projects_completed 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO user_software_expertise (
        user_id, software_name, software_type, proficiency_level,
        version_used, years_experience, projects_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, software_name)
      DO UPDATE SET
        software_type = EXCLUDED.software_type,
        proficiency_level = EXCLUDED.proficiency_level,
        version_used = EXCLUDED.version_used,
        years_experience = EXCLUDED.years_experience,
        projects_completed = EXCLUDED.projects_completed
      RETURNING *
    `, [userId, software_name, software_type, proficiency_level, version_used, years_experience, projects_completed]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding software expertise:', error);
    res.status(500).json({ error: 'Failed to add software expertise' });
  }
});

// ==============================================
// LABORATORY TECHNIQUES
// ==============================================

// Get user's laboratory techniques
router.get('/techniques', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM user_laboratory_techniques
      WHERE user_id = $1
      ORDER BY proficiency_level DESC, times_performed DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching laboratory techniques:', error);
    res.status(500).json({ error: 'Failed to fetch laboratory techniques' });
  }
});

// Add laboratory technique
router.post('/techniques', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      technique_name, technique_category, proficiency_level,
      times_performed, success_rate, can_train_others
    } = req.body;

    const result = await pool.query(`
      INSERT INTO user_laboratory_techniques (
        user_id, technique_name, technique_category, proficiency_level,
        times_performed, success_rate, can_train_others
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, technique_name)
      DO UPDATE SET
        technique_category = EXCLUDED.technique_category,
        proficiency_level = EXCLUDED.proficiency_level,
        times_performed = EXCLUDED.times_performed,
        success_rate = EXCLUDED.success_rate,
        can_train_others = EXCLUDED.can_train_others
      RETURNING *
    `, [userId, technique_name, technique_category, proficiency_level, times_performed, success_rate, can_train_others]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding laboratory technique:', error);
    res.status(500).json({ error: 'Failed to add laboratory technique' });
  }
});

// ==============================================
// CERTIFICATIONS
// ==============================================

// Get user's certifications
router.get('/certifications', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM user_certifications
      WHERE user_id = $1
      ORDER BY issue_date DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ error: 'Failed to fetch certifications' });
  }
});

// Add certification
router.post('/certifications', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      certification_name, issuing_organization, certification_type,
      issue_date, expiry_date, certification_number, verification_url
    } = req.body;

    const result = await pool.query(`
      INSERT INTO user_certifications (
        user_id, certification_name, issuing_organization, certification_type,
        issue_date, expiry_date, certification_number, verification_url,
        is_current
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
        CASE WHEN $6 IS NULL OR $6 > CURRENT_DATE THEN true ELSE false END
      )
      RETURNING *
    `, [userId, certification_name, issuing_organization, certification_type, issue_date, expiry_date, certification_number, verification_url]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding certification:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

// ==============================================
// AVAILABILITY
// ==============================================

// Get user's availability
router.get('/availability', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM user_availability
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Return default availability if not set
      return res.json({
        user_id: userId,
        open_for_collaboration: true,
        currently_available: true
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update user's availability
router.put('/availability', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      open_for_collaboration, collaboration_types, available_as_keynote_speaker,
      available_for_workshops, available_as_service_provider, service_types,
      available_as_consultant, consulting_domains, hourly_rate, rate_currency,
      travel_willingness, currently_available, availability_notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO user_availability (
        user_id, open_for_collaboration, collaboration_types,
        available_as_keynote_speaker, available_for_workshops,
        available_as_service_provider, service_types,
        available_as_consultant, consulting_domains,
        hourly_rate, rate_currency, travel_willingness,
        currently_available, availability_notes, last_updated
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        open_for_collaboration = COALESCE($2, user_availability.open_for_collaboration),
        collaboration_types = COALESCE($3, user_availability.collaboration_types),
        available_as_keynote_speaker = COALESCE($4, user_availability.available_as_keynote_speaker),
        available_for_workshops = COALESCE($5, user_availability.available_for_workshops),
        available_as_service_provider = COALESCE($6, user_availability.available_as_service_provider),
        service_types = COALESCE($7, user_availability.service_types),
        available_as_consultant = COALESCE($8, user_availability.available_as_consultant),
        consulting_domains = COALESCE($9, user_availability.consulting_domains),
        hourly_rate = COALESCE($10, user_availability.hourly_rate),
        rate_currency = COALESCE($11, user_availability.rate_currency),
        travel_willingness = COALESCE($12, user_availability.travel_willingness),
        currently_available = COALESCE($13, user_availability.currently_available),
        availability_notes = COALESCE($14, user_availability.availability_notes),
        last_updated = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, open_for_collaboration, collaboration_types, available_as_keynote_speaker,
        available_for_workshops, available_as_service_provider, service_types,
        available_as_consultant, consulting_domains, hourly_rate, rate_currency,
        travel_willingness, currently_available, availability_notes]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// ==============================================
// SPEAKING PROFILE
// ==============================================

// Get user's speaking profile
router.get('/speaking-profile', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM user_speaking_profile
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ user_id: userId, total_keynotes_delivered: 0 });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching speaking profile:', error);
    res.status(500).json({ error: 'Failed to fetch speaking profile' });
  }
});

// Update speaking profile
router.put('/speaking-profile', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      speaker_bio, speaking_topics, target_audience_levels, speaking_languages,
      preferred_presentation_length, requires_speaker_fee,
      speaker_fee_range_min, speaker_fee_range_max, fee_currency
    } = req.body;

    const result = await pool.query(`
      INSERT INTO user_speaking_profile (
        user_id, speaker_bio, speaking_topics, target_audience_levels,
        speaking_languages, preferred_presentation_length,
        requires_speaker_fee, speaker_fee_range_min, speaker_fee_range_max,
        fee_currency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id)
      DO UPDATE SET
        speaker_bio = COALESCE($2, user_speaking_profile.speaker_bio),
        speaking_topics = COALESCE($3, user_speaking_profile.speaking_topics),
        target_audience_levels = COALESCE($4, user_speaking_profile.target_audience_levels),
        speaking_languages = COALESCE($5, user_speaking_profile.speaking_languages),
        preferred_presentation_length = COALESCE($6, user_speaking_profile.preferred_presentation_length),
        requires_speaker_fee = COALESCE($7, user_speaking_profile.requires_speaker_fee),
        speaker_fee_range_min = COALESCE($8, user_speaking_profile.speaker_fee_range_min),
        speaker_fee_range_max = COALESCE($9, user_speaking_profile.speaker_fee_range_max),
        fee_currency = COALESCE($10, user_speaking_profile.fee_currency),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, speaker_bio, speaking_topics, target_audience_levels, speaking_languages,
        preferred_presentation_length, requires_speaker_fee, speaker_fee_range_min,
        speaker_fee_range_max, fee_currency]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating speaking profile:', error);
    res.status(500).json({ error: 'Failed to update speaking profile' });
  }
});

// Get speaking engagements
router.get('/speaking-engagements', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM speaking_engagements
      WHERE user_id = $1
      ORDER BY event_date DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching speaking engagements:', error);
    res.status(500).json({ error: 'Failed to fetch speaking engagements' });
  }
});

// Add speaking engagement
router.post('/speaking-engagements', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      event_name, event_type, event_date, event_location,
      presentation_title, presentation_topic, audience_size
    } = req.body;

    const result = await pool.query(`
      INSERT INTO speaking_engagements (
        user_id, event_name, event_type, event_date, event_location,
        presentation_title, presentation_topic, audience_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, event_name, event_type, event_date, event_location,
        presentation_title, presentation_topic, audience_size]);

    // Update speaking profile counts
    await pool.query(`
      UPDATE user_speaking_profile
      SET 
        total_keynotes_delivered = total_keynotes_delivered + CASE WHEN $1 = 'keynote' THEN 1 ELSE 0 END,
        total_conference_presentations = total_conference_presentations + CASE WHEN $1 = 'conference_presentation' THEN 1 ELSE 0 END,
        total_invited_talks = total_invited_talks + CASE WHEN $1 = 'invited_talk' THEN 1 ELSE 0 END,
        total_workshops_conducted = total_workshops_conducted + CASE WHEN $1 = 'workshop' THEN 1 ELSE 0 END
      WHERE user_id = $2
    `, [event_type, userId]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding speaking engagement:', error);
    res.status(500).json({ error: 'Failed to add speaking engagement' });
  }
});

// ==============================================
// ENDORSEMENTS
// ==============================================

// Get endorsements received
router.get('/endorsements/received', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        pe.*,
        u.first_name as endorser_first_name,
        u.last_name as endorser_last_name,
        u.current_position as endorser_position
      FROM peer_endorsements pe
      JOIN users u ON pe.endorser_id = u.id
      WHERE pe.endorsee_id = $1
      ORDER BY pe.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching endorsements:', error);
    res.status(500).json({ error: 'Failed to fetch endorsements' });
  }
});

// Give an endorsement
router.post('/endorsements', async (req: any, res) => {
  try {
    const endorserId = req.user.id;
    const {
      endorsee_id, relationship, relationship_duration, work_context,
      endorsement_text, technical_skills_rating, collaboration_rating,
      communication_rating, reliability_rating, innovation_rating,
      would_collaborate_again, would_recommend
    } = req.body;

    if (endorserId === endorsee_id) {
      return res.status(400).json({ error: 'Cannot endorse yourself' });
    }

    const result = await pool.query(`
      INSERT INTO peer_endorsements (
        endorsee_id, endorser_id, relationship, relationship_duration,
        work_context, endorsement_text, technical_skills_rating,
        collaboration_rating, communication_rating, reliability_rating,
        innovation_rating, would_collaborate_again, would_recommend
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (endorsee_id, endorser_id)
      DO UPDATE SET
        endorsement_text = EXCLUDED.endorsement_text,
        technical_skills_rating = EXCLUDED.technical_skills_rating,
        collaboration_rating = EXCLUDED.collaboration_rating,
        communication_rating = EXCLUDED.communication_rating,
        reliability_rating = EXCLUDED.reliability_rating,
        innovation_rating = EXCLUDED.innovation_rating,
        would_collaborate_again = EXCLUDED.would_collaborate_again,
        would_recommend = EXCLUDED.would_recommend,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [endorsee_id, endorserId, relationship, relationship_duration, work_context,
        endorsement_text, technical_skills_rating, collaboration_rating,
        communication_rating, reliability_rating, innovation_rating,
        would_collaborate_again, would_recommend]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding endorsement:', error);
    res.status(500).json({ error: 'Failed to add endorsement' });
  }
});

// ==============================================
// PLATFORM SCORES
// ==============================================

// Get user's platform scores
router.get('/platform-scores', async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT *
      FROM user_platform_scores
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Return default scores if not calculated yet
      return res.json({
        user_id: userId,
        expertise_score: 0,
        activity_score: 0,
        reliability_score: 0,
        overall_trust_score: 0
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching platform scores:', error);
    res.status(500).json({ error: 'Failed to fetch platform scores' });
  }
});

// Search researchers by skills (public endpoint)
router.get('/search', async (req: any, res) => {
  try {
    const { skills, software, techniques, available_for } = req.query;
    
    let query = `
      SELECT DISTINCT
        u.id, u.first_name, u.last_name, u.current_position,
        u.current_institution, u.research_interests,
        ups.overall_trust_score, ups.expertise_score,
        ua.available_as_service_provider, ua.available_as_keynote_speaker,
        ua.available_as_consultant
      FROM users u
      LEFT JOIN user_platform_scores ups ON u.id = ups.user_id
      LEFT JOIN user_availability ua ON u.id = ua.user_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    if (skills) {
      query += ` AND EXISTS (
        SELECT 1 FROM user_technical_skills uts 
        WHERE uts.user_id = u.id 
        AND uts.skill_name ILIKE $${paramCount}
      )`;
      params.push(`%${skills}%`);
      paramCount++;
    }

    if (available_for === 'speaker') {
      query += ` AND ua.available_as_keynote_speaker = true`;
    } else if (available_for === 'service') {
      query += ` AND ua.available_as_service_provider = true`;
    } else if (available_for === 'consultant') {
      query += ` AND ua.available_as_consultant = true`;
    }

    query += ` ORDER BY ups.overall_trust_score DESC NULLS LAST LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error searching researchers:', error);
    res.status(500).json({ error: 'Failed to search researchers' });
  }
});

export default router;

