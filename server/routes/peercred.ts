// PeerCred Reference System - Core API Routes
// Sophisticated, fair, and transparent reference platform

import express, { type Router } from 'express';
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

const router: Router = express.Router();

// Get user's reference profile
router.get('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const profileQuery = `
      SELECT 
        pu.*,
        u.email,
        u.first_name,
        u.last_name,
        ra.average_rating,
        ra.reference_consistency,
        ra.verification_rate
      FROM peercred_users pu
      JOIN users u ON pu.user_id = u.id
      LEFT JOIN reference_analytics ra ON pu.id = ra.user_id
      WHERE pu.user_id = $1
    `;
    
    const result = await pool.query(profileQuery, [userId]);
    
    if (result.rows.length === 0) {
      // Create profile if doesn't exist
      const createProfileQuery = `
        INSERT INTO peercred_users (user_id, profile_complete)
        VALUES ($1, false)
        RETURNING *
      `;
      const newProfile = await pool.query(createProfileQuery, [userId]);
      res.json({ profile: newProfile.rows[0], isNew: true });
    } else {
      res.json({ profile: result.rows[0], isNew: false });
    }
  } catch (error) {
    console.error('Error fetching reference profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify work relationship
router.post('/verify-relationship', authenticateToken, async (req: any, res: any) => {
  try {
    const { 
      colleagueEmail, 
      companyName, 
      projectName, 
      relationshipType, 
      startDate, 
      endDate 
    } = req.body;
    
    const userId = req.user.id;
    
    // Check if colleague exists
    const colleagueQuery = `
      SELECT u.id, pu.id as peercred_id
      FROM users u
      LEFT JOIN peercred_users pu ON u.id = pu.user_id
      WHERE u.email = $1
    `;
    const colleagueResult = await pool.query(colleagueQuery, [colleagueEmail]);
    
    if (colleagueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Colleague not found' });
    }
    
    const colleagueId = colleagueResult.rows[0].id;
    const colleaguePeercredId = colleagueResult.rows[0].peercred_id;
    
    // Get current user's peercred ID
    const userPeercredQuery = `
      SELECT id FROM peercred_users WHERE user_id = $1
    `;
    const userPeercredResult = await pool.query(userPeercredQuery, [userId]);
    const userPeercredId = userPeercredResult.rows[0].id;
    
    // Create work relationship
    const relationshipQuery = `
      INSERT INTO work_relationships (
        user1_id, user2_id, company_name, project_name, 
        relationship_type, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user1_id, user2_id, company_name, project_name) 
      DO UPDATE SET 
        relationship_type = EXCLUDED.relationship_type,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const relationshipResult = await pool.query(relationshipQuery, [
      userPeercredId, colleaguePeercredId || colleagueId, companyName, 
      projectName, relationshipType, startDate, endDate
    ]);
    
    res.json({ 
      relationship: relationshipResult.rows[0],
      message: 'Relationship verification request sent to colleague'
    });
  } catch (error) {
    console.error('Error verifying relationship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request reference
router.post('/request-reference', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      refereeEmail,
      workRelationshipId,
      positionAppliedFor,
      companyApplyingTo,
      referenceType,
      skillsToEvaluate,
      deadline,
      isBlindReference = true
    } = req.body;
    
    const userId = req.user.id;
    
    // Get referee's peercred ID
    const refereeQuery = `
      SELECT pu.id as peercred_id
      FROM users u
      JOIN peercred_users pu ON u.id = pu.user_id
      WHERE u.email = $1
    `;
    const refereeResult = await pool.query(refereeQuery, [refereeEmail]);
    
    if (refereeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Referee not found in PeerCred system' });
    }
    
    // Get requester's peercred ID
    const requesterQuery = `
      SELECT id FROM peercred_users WHERE user_id = $1
    `;
    const requesterResult = await pool.query(requesterQuery, [userId]);
    const requesterPeercredId = requesterResult.rows[0].id;
    
    // Create reference request
    const requestQuery = `
      INSERT INTO reference_requests (
        requester_id, referee_id, work_relationship_id,
        position_applied_for, company_applying_to, reference_type,
        skills_to_evaluate, deadline, is_blind_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const requestResult = await pool.query(requestQuery, [
      requesterPeercredId,
      refereeResult.rows[0].peercred_id,
      workRelationshipId,
      positionAppliedFor,
      companyApplyingTo,
      referenceType,
      skillsToEvaluate,
      deadline,
      isBlindReference
    ]);
    
    res.json({ 
      request: requestResult.rows[0],
      message: 'Reference request sent successfully'
    });
  } catch (error) {
    console.error('Error requesting reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit reference response
router.post('/submit-reference', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      requestId,
      ratings,
      strengths,
      areasForImprovement,
      specificExamples,
      recommendationStrength
    } = req.body;
    
    const userId = req.user.id;
    
    // Get referee's peercred ID
    const refereeQuery = `
      SELECT id FROM peercred_users WHERE user_id = $1
    `;
    const refereeResult = await pool.query(refereeQuery, [userId]);
    const refereePeercredId = refereeResult.rows[0].id;
    
    // Submit reference response
    const responseQuery = `
      INSERT INTO reference_responses (
        request_id, referee_id, technical_skills, communication_skills,
        leadership_skills, teamwork, problem_solving, reliability,
        adaptability, overall_performance, strengths, areas_for_improvement,
        specific_examples, recommendation_strength
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const responseResult = await pool.query(responseQuery, [
      requestId,
      refereePeercredId,
      ratings.technicalSkills,
      ratings.communicationSkills,
      ratings.leadershipSkills,
      ratings.teamwork,
      ratings.problemSolving,
      ratings.reliability,
      ratings.adaptability,
      ratings.overallPerformance,
      strengths,
      areasForImprovement,
      specificExamples,
      recommendationStrength
    ]);
    
    // Update request status
    await pool.query(
      'UPDATE reference_requests SET status = $1 WHERE id = $2',
      ['completed', requestId]
    );
    
    // Trigger bias analysis (would be done by background job)
    // analyzeReferenceBias(responseResult.rows[0].id);
    
    res.json({ 
      response: responseResult.rows[0],
      message: 'Reference submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reference requests for user
router.get('/requests', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { status = 'pending' } = req.query;
    
    const requestsQuery = `
      SELECT 
        rr.*,
        pu.email as requester_email,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        wr.company_name,
        wr.project_name,
        wr.relationship_type
      FROM reference_requests rr
      JOIN peercred_users pu ON rr.requester_id = pu.id
      JOIN users u ON pu.user_id = u.id
      JOIN work_relationships wr ON rr.work_relationship_id = wr.id
      WHERE rr.referee_id = (SELECT id FROM peercred_users WHERE user_id = $1)
      AND rr.status = $2
      ORDER BY rr.created_at DESC
    `;
    
    const result = await pool.query(requestsQuery, [userId, status]);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching reference requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's reference portfolio
router.get('/portfolio', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { portfolioId } = req.query;
    
    let portfolioQuery;
    let queryParams;
    
    if (portfolioId) {
      portfolioQuery = `
        SELECT 
          rp.*,
          rr.technical_skills, rr.communication_skills, rr.leadership_skills,
          rr.teamwork, rr.problem_solving, rr.reliability, rr.adaptability,
          rr.overall_performance, rr.strengths, rr.areas_for_improvement,
          rr.specific_examples, rr.recommendation_strength,
          pu.email as referee_email,
          u.first_name as referee_first_name,
          u.last_name as referee_last_name,
          wr.company_name, wr.project_name, wr.relationship_type
        FROM reference_portfolios rp
        JOIN unnest(rp.references_included) AS ref_id ON true
        JOIN reference_responses rr ON rr.id = ref_id::uuid
        JOIN peercred_users pu ON rr.referee_id = pu.id
        JOIN users u ON pu.user_id = u.id
        JOIN reference_requests rq ON rr.request_id = rq.id
        JOIN work_relationships wr ON rq.work_relationship_id = wr.id
        WHERE rp.id = $1
      `;
      queryParams = [portfolioId];
    } else {
      portfolioQuery = `
        SELECT 
          rp.*,
          COUNT(rr.id) as reference_count,
          AVG(rr.overall_performance) as average_rating
        FROM reference_portfolios rp
        LEFT JOIN unnest(rp.references_included) AS ref_id ON true
        LEFT JOIN reference_responses rr ON rr.id = ref_id::uuid
        WHERE rp.user_id = (SELECT id FROM peercred_users WHERE user_id = $1)
        GROUP BY rp.id
        ORDER BY rp.created_at DESC
      `;
      queryParams = [userId];
    }
    
    const result = await pool.query(portfolioQuery, queryParams);
    res.json({ portfolios: result.rows });
  } catch (error) {
    console.error('Error fetching reference portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create reference portfolio
router.post('/portfolio', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      portfolioName,
      positionType,
      industry,
      skillsFocus,
      referencesIncluded,
      isPublic = false
    } = req.body;
    
    const userId = req.user.id;
    
    // Get user's peercred ID
    const userQuery = `
      SELECT id FROM peercred_users WHERE user_id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    const userPeercredId = userResult.rows[0].id;
    
    // Calculate overall score
    const scoreQuery = `
      SELECT AVG(overall_performance) as avg_score
      FROM reference_responses
      WHERE id = ANY($1)
    `;
    const scoreResult = await pool.query(scoreQuery, [referencesIncluded]);
    const overallScore = scoreResult.rows[0].avg_score || 0;
    
    // Create portfolio
    const portfolioQuery = `
      INSERT INTO reference_portfolios (
        user_id, portfolio_name, position_type, industry,
        skills_focus, references_included, overall_score, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const portfolioResult = await pool.query(portfolioQuery, [
      userPeercredId,
      portfolioName,
      positionType,
      industry,
      skillsFocus,
      referencesIncluded,
      overallScore,
      isPublic
    ]);
    
    res.json({ 
      portfolio: portfolioResult.rows[0],
      message: 'Reference portfolio created successfully'
    });
  } catch (error) {
    console.error('Error creating reference portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get work relationships
router.get('/relationships', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const relationshipsQuery = `
      SELECT 
        wr.*,
        u.email as colleague_email,
        u.first_name as colleague_first_name,
        u.last_name as colleague_last_name
      FROM work_relationships wr
      JOIN peercred_users pu ON wr.user2_id = pu.id
      JOIN users u ON pu.user_id = u.id
      WHERE wr.user1_id = (SELECT id FROM peercred_users WHERE user_id = $1)
      AND wr.verification_status = 'verified'
      ORDER BY wr.end_date DESC NULLS FIRST, wr.start_date DESC
    `;
    
    const result = await pool.query(relationshipsQuery, [userId]);
    res.json({ relationships: result.rows });
  } catch (error) {
    console.error('Error fetching work relationships:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get skills and categories
router.get('/skills', async (req: any, res: any) => {
  try {
    const skillsQuery = `
      SELECT 
        s.*,
        sc.category_name,
        sc.description as category_description
      FROM skills s
      JOIN skill_categories sc ON s.category_id = sc.id
      ORDER BY sc.category_name, s.skill_name
    `;
    
    const result = await pool.query(skillsQuery);
    
    // Group by category
    const skillsByCategory = result.rows.reduce((acc: any, skill: any) => {
      if (!acc[skill.category_name]) {
        acc[skill.category_name] = {
          category: skill.category_name,
          description: skill.category_description,
          skills: []
        };
      }
      acc[skill.category_name].skills.push({
        id: skill.id,
        name: skill.skill_name,
        description: skill.description,
        verificationMethods: skill.verification_methods
      });
      return acc;
    }, {});
    
    res.json({ skillsByCategory: Object.values(skillsByCategory) });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics and insights
router.get('/analytics', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const analyticsQuery = `
      SELECT 
        ra.*,
        pu.credibility_score,
        pu.total_references_given,
        pu.total_references_received
      FROM reference_analytics ra
      JOIN peercred_users pu ON ra.user_id = pu.id
      WHERE pu.user_id = $1
    `;
    
    const result = await pool.query(analyticsQuery, [userId]);
    
    if (result.rows.length === 0) {
      // Generate initial analytics
      await generateUserAnalytics(userId);
      const newResult = await pool.query(analyticsQuery, [userId]);
      res.json({ analytics: newResult.rows[0] });
    } else {
      res.json({ analytics: result.rows[0] });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate user analytics
async function generateUserAnalytics(userId: string) {
  try {
    const userPeercredId = await pool.query(
      'SELECT id FROM peercred_users WHERE user_id = $1',
      [userId]
    );
    
    if (userPeercredId.rows.length === 0) return;
    
    const peercredId = userPeercredId.rows[0].id;
    
    // Calculate various metrics
    const metricsQuery = `
      SELECT 
        AVG(rr.overall_performance) as average_rating,
        COUNT(rr.id) as total_references,
        AVG(rqm.overall_bias_score) as avg_bias_score,
        COUNT(CASE WHEN rr.is_verified = true THEN 1 END) as verified_count
      FROM reference_responses rr
      JOIN reference_requests rq ON rr.request_id = rq.id
      LEFT JOIN reference_quality_metrics rqm ON rr.id = rqm.response_id
      WHERE rq.requester_id = $1
    `;
    
    const metrics = await pool.query(metricsQuery, [peercredId]);
    const metricsData = metrics.rows[0];
    
    // Insert analytics
    const analyticsQuery = `
      INSERT INTO reference_analytics (
        user_id, average_rating, verification_rate, 
        referee_credibility_avg, response_rate
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        average_rating = EXCLUDED.average_rating,
        verification_rate = EXCLUDED.verification_rate,
        last_updated = CURRENT_TIMESTAMP
    `;
    
    await pool.query(analyticsQuery, [
      peercredId,
      metricsData.average_rating || 0,
      metricsData.total_references > 0 ? 
        (metricsData.verified_count / metricsData.total_references) : 0,
      0, // referee_credibility_avg - would need separate calculation
      1.0 // response_rate - would need separate calculation
    ]);
  } catch (error) {
    console.error('Error generating analytics:', error);
  }
}

export default router;
