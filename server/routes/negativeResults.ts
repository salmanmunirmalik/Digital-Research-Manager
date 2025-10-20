/**
 * Negative Results Database API Routes
 * Revolutionary feature: Document and share failed experiments
 * Give researchers credit for transparency and save community time/money
 */

import { Router } from 'express';
import pool from '../../database/config.js';

const router = Router();

// ==============================================
// NEGATIVE RESULTS SUBMISSIONS
// ==============================================

// Browse/search negative results
router.get('/', async (req, res) => {
  try {
    const {
      research_field, sharing_status = 'public', search,
      sort_by = 'recent', limit = 50
    } = req.query;

    let query = `
      SELECT 
        nr.*,
        u.first_name || ' ' || u.last_name as researcher_name,
        u.email as current_institution,
        CASE WHEN nr.anonymous_sharing THEN 'Anonymous' ELSE u.first_name || ' ' || u.last_name END as display_name,
        l.name as lab_name
      FROM negative_results nr
      JOIN users u ON nr.researcher_id = u.id
      LEFT JOIN labs l ON nr.lab_id = l.id
      WHERE nr.is_publicly_searchable = true
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (research_field) {
      query += ` AND nr.research_field = $${paramCount}`;
      params.push(research_field);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        nr.experiment_title ILIKE $${paramCount} OR
        nr.original_hypothesis ILIKE $${paramCount} OR
        nr.lessons_learned ILIKE $${paramCount} OR
        array_to_string(nr.tags, ',') ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Sorting
    if (sort_by === 'recent') {
      query += ` ORDER BY nr.created_at DESC`;
    } else if (sort_by === 'helpful') {
      query += ` ORDER BY nr.helpful_votes DESC`;
    } else if (sort_by === 'citations') {
      query += ` ORDER BY nr.citation_count DESC`;
    } else if (sort_by === 'impact') {
      query += ` ORDER BY nr.saved_someone_votes DESC`;
    }

    query += ` LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching negative results:', error);
    res.status(500).json({ error: 'Failed to fetch negative results' });
  }
});

// Get a specific negative result
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        nr.*,
        u.first_name || ' ' || u.last_name as researcher_name,
        u.role as current_position,
        u.email as current_institution,
        CASE WHEN nr.anonymous_sharing THEN 'Anonymous' ELSE u.first_name || ' ' || u.last_name END as display_name,
        l.name as lab_name
      FROM negative_results nr
      JOIN users u ON nr.researcher_id = u.id
      LEFT JOIN labs l ON nr.lab_id = l.id
      WHERE nr.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negative result not found' });
    }

    // Increment view count
    await pool.query(`
      UPDATE negative_results
      SET views_count = views_count + 1
      WHERE id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching negative result:', error);
    res.status(500).json({ error: 'Failed to fetch negative result' });
  }
});

// Get my negative results
router.get('/my/submissions', async (req: any, res) => {
  try {
    const researcherId = req.user.id;

    const result = await pool.query(`
      SELECT 
        nr.*,
        (SELECT COUNT(*) FROM negative_result_comments WHERE negative_result_id = nr.id) as comments_count
      FROM negative_results nr
      WHERE nr.researcher_id = $1
      ORDER BY nr.created_at DESC
    `, [researcherId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching my negative results:', error);
    res.status(500).json({ error: 'Failed to fetch my negative results' });
  }
});

// Submit a negative result
router.post('/', async (req: any, res) => {
  try {
    const researcherId = req.user.id;
    const {
      lab_id, experiment_title, research_field, research_domain, keywords,
      original_hypothesis, expected_outcome, theoretical_basis, literature_citations,
      actual_outcome, unexpected_observations, failure_type, primary_reason,
      secondary_reasons, contributing_factors, reproduction_attempts, consistent_failure,
      variations_tested, methodology_description, protocol_used_id, materials_used,
      equipment_used, key_parameters, experimental_conditions, lessons_learned,
      recommendations_for_others, alternative_approaches_suggested, what_would_you_try_instead,
      estimated_cost_usd, time_spent_hours, sharing_status, is_publicly_searchable,
      allow_citations, anonymous_sharing, experiment_date, tags
    } = req.body;

    const result = await pool.query(`
      INSERT INTO negative_results (
        researcher_id, lab_id, experiment_title, research_field, research_domain,
        keywords, original_hypothesis, expected_outcome, theoretical_basis,
        literature_citations, actual_outcome, unexpected_observations, failure_type,
        primary_reason, secondary_reasons, contributing_factors, reproduction_attempts,
        consistent_failure, variations_tested, methodology_description, protocol_used_id,
        materials_used, equipment_used, key_parameters, experimental_conditions,
        lessons_learned, recommendations_for_others, alternative_approaches_suggested,
        what_would_you_try_instead, estimated_cost_usd, time_spent_hours,
        sharing_status, is_publicly_searchable, allow_citations, anonymous_sharing,
        experiment_date, tags
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37
      )
      RETURNING *
    `, [
      researcherId, lab_id, experiment_title, research_field, research_domain,
      keywords, original_hypothesis, expected_outcome, theoretical_basis,
      literature_citations, actual_outcome, unexpected_observations, failure_type,
      primary_reason, secondary_reasons, contributing_factors, reproduction_attempts,
      consistent_failure, variations_tested, methodology_description, protocol_used_id,
      materials_used, equipment_used, key_parameters, experimental_conditions,
      lessons_learned, recommendations_for_others, alternative_approaches_suggested,
      what_would_you_try_instead, estimated_cost_usd, time_spent_hours,
      sharing_status, is_publicly_searchable, allow_citations, anonymous_sharing,
      experiment_date, tags
    ]);

    // Update contributor stats
    await updateContributorStats(researcherId);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error submitting negative result:', error);
    res.status(500).json({ error: 'Failed to submit negative result' });
  }
});

// Update a negative result
router.put('/:id', async (req: any, res) => {
  try {
    const researcherId = req.user.id;
    const { id } = req.params;
    const {
      sharing_status, is_publicly_searchable, lessons_learned,
      recommendations_for_others
    } = req.body;

    const result = await pool.query(`
      UPDATE negative_results
      SET 
        sharing_status = COALESCE($1, sharing_status),
        is_publicly_searchable = COALESCE($2, is_publicly_searchable),
        lessons_learned = COALESCE($3, lessons_learned),
        recommendations_for_others = COALESCE($4, recommendations_for_others),
        last_updated = CURRENT_TIMESTAMP
      WHERE id = $5 AND researcher_id = $6
      RETURNING *
    `, [sharing_status, is_publicly_searchable, lessons_learned,
        recommendations_for_others, id, researcherId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negative result not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating negative result:', error);
    res.status(500).json({ error: 'Failed to update negative result' });
  }
});

// ==============================================
// VARIATION ATTEMPTS
// ==============================================

// Get variation attempts for a negative result
router.get('/:id/variations', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM negative_result_variations
      WHERE negative_result_id = $1
      ORDER BY variation_number
    `, [id]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching variations:', error);
    res.status(500).json({ error: 'Failed to fetch variations' });
  }
});

// Add a variation attempt
router.post('/:id/variations', async (req: any, res) => {
  try {
    const researcherId = req.user.id;
    const { id } = req.params;
    const { variation_description, parameters_changed, outcome, success_level, observations } = req.body;

    // Verify ownership
    const ownerCheck = await pool.query(`
      SELECT researcher_id FROM negative_results WHERE id = $1
    `, [id]);

    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].researcher_id !== researcherId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get next variation number
    const maxVariation = await pool.query(`
      SELECT COALESCE(MAX(variation_number), 0) as max_num
      FROM negative_result_variations
      WHERE negative_result_id = $1
    `, [id]);

    const variationNumber = maxVariation.rows[0].max_num + 1;

    const result = await pool.query(`
      INSERT INTO negative_result_variations (
        negative_result_id, variation_number, variation_description,
        parameters_changed, outcome, success_level, observations
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, variationNumber, variation_description, parameters_changed,
        outcome, success_level, observations]);

    // Update reproduction attempts count
    await pool.query(`
      UPDATE negative_results
      SET reproduction_attempts = reproduction_attempts + 1
      WHERE id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding variation:', error);
    res.status(500).json({ error: 'Failed to add variation' });
  }
});

// ==============================================
// COMMENTS & DISCUSSION
// ==============================================

// Get comments for a negative result
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        nrc.*,
        u.first_name || ' ' || u.last_name as commenter_name,
        u.current_position as commenter_position
      FROM negative_result_comments nrc
      JOIN users u ON nrc.commenter_id = u.id
      WHERE nrc.negative_result_id = $1
      ORDER BY nrc.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment
router.post('/:id/comments', async (req: any, res) => {
  try {
    const commenterId = req.user.id;
    const { id } = req.params;
    const {
      comment_text, comment_type, had_similar_failure, found_solution, solution_description
    } = req.body;

    const result = await pool.query(`
      INSERT INTO negative_result_comments (
        negative_result_id, commenter_id, comment_text, comment_type,
        had_similar_failure, found_solution, solution_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [id, commenterId, comment_text, comment_type, had_similar_failure,
        found_solution, solution_description]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ==============================================
// VOTING & ENGAGEMENT
// ==============================================

// Vote helpful
router.post('/:id/vote-helpful', async (req: any, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE negative_results
      SET helpful_votes = helpful_votes + 1
      WHERE id = $1
      RETURNING helpful_votes
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Negative result not found' });
    }

    res.json({ helpful_votes: result.rows[0].helpful_votes });
  } catch (error: any) {
    console.error('Error voting helpful:', error);
    res.status(500).json({ error: 'Failed to vote helpful' });
  }
});

// Vote "saved me time/money"
router.post('/:id/vote-saved-me', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { estimated_time_saved_hours, estimated_cost_saved_usd } = req.body;

    // Record the save
    await pool.query(`
      INSERT INTO saved_negative_results (
        user_id, negative_result_id, save_reason, 
        avoided_repeating_mistake, estimated_time_saved_hours, estimated_cost_saved_usd
      )
      VALUES ($1, $2, 'avoided_failure', true, $3, $4)
      ON CONFLICT (user_id, negative_result_id) DO UPDATE
      SET 
        estimated_time_saved_hours = EXCLUDED.estimated_time_saved_hours,
        estimated_cost_saved_usd = EXCLUDED.estimated_cost_saved_usd
    `, [userId, id, estimated_time_saved_hours, estimated_cost_saved_usd]);

    // Update the negative result
    const result = await pool.query(`
      UPDATE negative_results
      SET saved_someone_votes = saved_someone_votes + 1
      WHERE id = $1
      RETURNING saved_someone_votes
    `, [id]);

    res.json({ saved_someone_votes: result.rows[0].saved_someone_votes });
  } catch (error: any) {
    console.error('Error voting saved me:', error);
    res.status(500).json({ error: 'Failed to vote saved me' });
  }
});

// ==============================================
// SAVE/BOOKMARK NEGATIVE RESULTS
// ==============================================

// Get my saved negative results
router.get('/my/saved', async (req: any, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        nr.*,
        snr.save_reason,
        snr.notes,
        snr.saved_at,
        u.first_name || ' ' || u.last_name as researcher_name
      FROM saved_negative_results snr
      JOIN negative_results nr ON snr.negative_result_id = nr.id
      JOIN users u ON nr.researcher_id = u.id
      WHERE snr.user_id = $1
      ORDER BY snr.saved_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching saved negative results:', error);
    res.status(500).json({ error: 'Failed to fetch saved negative results' });
  }
});

// Save/bookmark a negative result
router.post('/:id/save', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { save_reason, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO saved_negative_results (
        user_id, negative_result_id, save_reason, notes
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, negative_result_id) DO UPDATE
      SET save_reason = EXCLUDED.save_reason, notes = EXCLUDED.notes
      RETURNING *
    `, [userId, id, save_reason, notes]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error saving negative result:', error);
    res.status(500).json({ error: 'Failed to save negative result' });
  }
});

// Unsave a negative result
router.delete('/:id/save', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(`
      DELETE FROM saved_negative_results
      WHERE user_id = $1 AND negative_result_id = $2
    `, [userId, id]);

    res.json({ message: 'Negative result unsaved' });
  } catch (error: any) {
    console.error('Error unsaving negative result:', error);
    res.status(500).json({ error: 'Failed to unsave negative result' });
  }
});

// ==============================================
// CITATIONS
// ==============================================

// Cite a negative result
router.post('/:id/cite', async (req: any, res) => {
  try {
    const citingUserId = req.user.id;
    const { id } = req.params;
    const { cited_in, citation_context, how_it_helped, impact_type } = req.body;

    const result = await pool.query(`
      INSERT INTO negative_result_citations (
        negative_result_id, citing_user_id, cited_in, citation_context,
        how_it_helped, impact_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, citingUserId, cited_in, citation_context, how_it_helped, impact_type]);

    // Update citation count
    await pool.query(`
      UPDATE negative_results
      SET citation_count = citation_count + 1
      WHERE id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error citing negative result:', error);
    res.status(500).json({ error: 'Failed to cite negative result' });
  }
});

// Get citations for a negative result
router.get('/:id/citations', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        nrc.*,
        u.first_name || ' ' || u.last_name as citing_user_name,
        u.current_institution
      FROM negative_result_citations nrc
      JOIN users u ON nrc.citing_user_id = u.id
      WHERE nrc.negative_result_id = $1
      ORDER BY nrc.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching citations:', error);
    res.status(500).json({ error: 'Failed to fetch citations' });
  }
});

// ==============================================
// SUCCESSFUL ALTERNATIVES
// ==============================================

// Get successful alternatives for a failed experiment
router.get('/:id/alternatives', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        sa.*,
        u.first_name || ' ' || u.last_name as researcher_name,
        u.current_institution
      FROM successful_alternatives sa
      JOIN users u ON sa.researcher_id = u.id
      WHERE sa.original_negative_result_id = $1
      ORDER BY sa.helpful_votes DESC
    `, [id]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching alternatives:', error);
    res.status(500).json({ error: 'Failed to fetch alternatives' });
  }
});

// Submit a successful alternative
router.post('/:id/alternatives', async (req: any, res) => {
  try {
    const researcherId = req.user.id;
    const { id } = req.params;
    const {
      alternative_title, alternative_description, key_differences,
      success_level, outcome_description, methodology
    } = req.body;

    const result = await pool.query(`
      INSERT INTO successful_alternatives (
        original_negative_result_id, researcher_id, alternative_title,
        alternative_description, key_differences, success_level,
        outcome_description, methodology
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, researcherId, alternative_title, alternative_description,
        key_differences, success_level, outcome_description, methodology]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error submitting alternative:', error);
    res.status(500).json({ error: 'Failed to submit alternative' });
  }
});

// ==============================================
// CONTRIBUTOR STATISTICS
// ==============================================

// Get contributor statistics
router.get('/contributors/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM negative_results_contributor_stats
      WHERE researcher_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        researcher_id: userId,
        total_negative_results_shared: 0,
        total_citations: 0,
        total_helpful_votes: 0,
        total_saved_someone_votes: 0,
        transparency_badges: []
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching contributor stats:', error);
    res.status(500).json({ error: 'Failed to fetch contributor stats' });
  }
});

// Get top contributors (leaderboard)
router.get('/leaderboard', async (req, res) => {
  try {
    const { timeframe = 'all_time', limit = 50 } = req.query;

    const result = await pool.query(`
      SELECT 
        nrcs.*,
        u.first_name || ' ' || u.last_name as researcher_name,
        u.current_position,
        u.current_institution
      FROM negative_results_contributor_stats nrcs
      JOIN users u ON nrcs.researcher_id = u.id
      WHERE nrcs.total_negative_results_shared > 0
      ORDER BY nrcs.overall_trust_score DESC, nrcs.total_saved_someone_votes DESC
      LIMIT $1
    `, [limit]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ==============================================
// FAILURE PATTERNS
// ==============================================

// Get common failure patterns
router.get('/patterns', async (req, res) => {
  try {
    const { research_field } = req.query;

    let query = `
      SELECT *
      FROM failure_patterns
      WHERE is_validated = true
    `;

    const params: any[] = [];

    if (research_field) {
      query += ` AND $1 = ANY(research_fields)`;
      params.push(research_field);
    }

    query += ` ORDER BY votes_count DESC LIMIT 20`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching failure patterns:', error);
    res.status(500).json({ error: 'Failed to fetch failure patterns' });
  }
});

// Helper function to update contributor stats
async function updateContributorStats(researcherId: string) {
  await pool.query(`
    INSERT INTO negative_results_contributor_stats (
      researcher_id, total_negative_results_shared, public_negative_results_count
    )
    VALUES ($1, 1, 1)
    ON CONFLICT (researcher_id) DO UPDATE
    SET 
      total_negative_results_shared = negative_results_contributor_stats.total_negative_results_shared + 1,
      public_negative_results_count = negative_results_contributor_stats.public_negative_results_count + 1,
      last_calculated = CURRENT_TIMESTAMP
  `, [researcherId]);
}

export default router;

