import express from 'express';
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

const router = express.Router();

// ==============================================
// UNIFIED PROFILE MANAGEMENT
// ==============================================

// Get user profile (consolidated)
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as publications_count,
        COUNT(DISTINCT ur.id) as references_count,
        COUNT(DISTINCT uc.id) as connections_count,
        COUNT(DISTINCT uf_following.id) as following_count,
        COUNT(DISTINCT uf_followers.id) as followers_count
      FROM users u
      LEFT JOIN publications p ON u.id = p.user_id
      LEFT JOIN unified_references ur ON u.id = ur.user_id
      LEFT JOIN user_connections uc ON u.id = uc.user_id AND uc.status = 'accepted'
      LEFT JOIN user_follows uf_following ON u.id = uf_following.follower_id
      LEFT JOIN user_follows uf_followers ON u.id = uf_followers.following_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (consolidated)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      first_name, last_name, phone, department, specialization, bio,
      current_position, current_institution, research_interests, expertise_areas, languages,
      website_url, linkedin_url, twitter_url, orcid_id, google_scholar_url,
      location, timezone, profile_visibility, show_email, show_phone, show_location,
      show_research_interests, show_publications, allow_connection_requests,
      allow_follow_requests, allow_profile_sharing, allow_reference_requests
    } = req.body;

    const result = await pool.query(`
      UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        department = COALESCE($4, department),
        specialization = COALESCE($5, specialization),
        bio = COALESCE($6, bio),
        current_position = COALESCE($7, current_position),
        current_institution = COALESCE($8, current_institution),
        research_interests = COALESCE($9, research_interests),
        expertise_areas = COALESCE($10, expertise_areas),
        languages = COALESCE($11, languages),
        website_url = COALESCE($12, website_url),
        linkedin_url = COALESCE($13, linkedin_url),
        twitter_url = COALESCE($14, twitter_url),
        orcid_id = COALESCE($15, orcid_id),
        google_scholar_url = COALESCE($16, google_scholar_url),
        location = COALESCE($17, location),
        timezone = COALESCE($18, timezone),
        profile_visibility = COALESCE($19, profile_visibility),
        show_email = COALESCE($20, show_email),
        show_phone = COALESCE($21, show_phone),
        show_location = COALESCE($22, show_location),
        show_research_interests = COALESCE($23, show_research_interests),
        show_publications = COALESCE($24, show_publications),
        allow_connection_requests = COALESCE($25, allow_connection_requests),
        allow_follow_requests = COALESCE($26, allow_follow_requests),
        allow_profile_sharing = COALESCE($27, allow_profile_sharing),
        allow_reference_requests = COALESCE($28, allow_reference_requests),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $29
      RETURNING *
    `, [
      first_name, last_name, phone, department, specialization, bio,
      current_position, current_institution, research_interests, expertise_areas, languages,
      website_url, linkedin_url, twitter_url, orcid_id, google_scholar_url,
      location, timezone, profile_visibility, show_email, show_phone, show_location,
      show_research_interests, show_publications, allow_connection_requests,
      allow_follow_requests, allow_profile_sharing, allow_reference_requests, userId
    ]);

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==============================================
// UNIFIED REFERENCE SYSTEM
// ==============================================

// Get user references
router.get('/references', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let query = `
      SELECT * FROM unified_references 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (type) {
      query += ` AND type = $2`;
      params.push(type as string);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ references: result.rows });
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ error: 'Failed to fetch references' });
  }
});

// Create reference
router.post('/references', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type, title, description, skills, context, relationship, duration,
      score, confidence, source_name, source_type, job_matches
    } = req.body;

    const result = await pool.query(`
      INSERT INTO unified_references (
        user_id, type, title, description, skills, context, relationship, duration,
        score, confidence, source_name, source_type, job_matches
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      userId, type, title, description, skills, context, relationship, duration,
      score, confidence, source_name, source_type, job_matches
    ]);

    res.json({ reference: result.rows[0] });
  } catch (error) {
    console.error('Error creating reference:', error);
    res.status(500).json({ error: 'Failed to create reference' });
  }
});

// Request reference
router.post('/references/request', authenticateToken, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId, context, skills, message } = req.body;

    const result = await pool.query(`
      INSERT INTO reference_requests (from_user_id, to_user_id, context, skills, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [fromUserId, toUserId, context, skills, message]);

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Error requesting reference:', error);
    res.status(500).json({ error: 'Failed to request reference' });
  }
});

// Respond to reference request
router.put('/references/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, responseMessage } = req.body;

    const result = await pool.query(`
      UPDATE reference_requests 
      SET status = $1, response_message = $2, response_date = CURRENT_TIMESTAMP
      WHERE id = $3 AND to_user_id = $4
      RETURNING *
    `, [status, responseMessage, requestId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
});

// ==============================================
// SOCIAL NETWORKING (CONSOLIDATED)
// ==============================================

// Send connection request
router.post('/connections/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectedUserId, relationshipContext, requestMessage } = req.body;

    const result = await pool.query(`
      INSERT INTO user_connections (user_id, connected_user_id, relationship_context, request_message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, connectedUserId, relationshipContext, requestMessage]);

    res.json({ connection: result.rows[0] });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

// Respond to connection request
router.put('/connections/:connectionId', authenticateToken, async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status, responseMessage } = req.body;

    const result = await pool.query(`
      UPDATE user_connections 
      SET status = $1, response_message = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND connected_user_id = $4
      RETURNING *
    `, [status, responseMessage, connectionId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    res.json({ connection: result.rows[0] });
  } catch (error) {
    console.error('Error responding to connection request:', error);
    res.status(500).json({ error: 'Failed to respond to connection request' });
  }
});

// Follow user
router.post('/follow', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followingId, followType, notifyOnPublications, notifyOnActivities, notifyOnConnections } = req.body;

    const result = await pool.query(`
      INSERT INTO user_follows (follower_id, following_id, follow_type, notify_on_publications, notify_on_activities, notify_on_connections)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [followerId, followingId, followType, notifyOnPublications, notifyOnActivities, notifyOnConnections]);

    res.json({ follow: result.rows[0] });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
router.delete('/follow/:followingId', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followingId } = req.params;

    const result = await pool.query(`
      DELETE FROM user_follows 
      WHERE follower_id = $1 AND following_id = $2
      RETURNING *
    `, [followerId, followingId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// ==============================================
// RESEARCH OPPORTUNITIES (CONSOLIDATED)
// ==============================================

// Get research opportunities
router.get('/opportunities', authenticateToken, async (req, res) => {
  try {
    const { type, institution, status } = req.query;

    let query = `
      SELECT 
        ro.*,
        u.first_name, u.last_name, u.current_institution,
        COUNT(oa.id) as applications_count
      FROM research_opportunities ro
      JOIN users u ON ro.user_id = u.id
      LEFT JOIN opportunity_applications oa ON ro.id = oa.opportunity_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (type) {
      paramCount++;
      query += ` AND ro.type = $${paramCount}`;
      params.push(type);
    }

    if (institution) {
      paramCount++;
      query += ` AND ro.institution ILIKE $${paramCount}`;
      params.push(`%${institution}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND ro.status = $${paramCount}`;
      params.push(status);
    }

    query += ` GROUP BY ro.id, u.first_name, u.last_name, u.current_institution ORDER BY ro.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ opportunities: result.rows });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Create research opportunity
router.post('/opportunities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title, description, type, institution, location, country,
      requirements, skills_required, duration, start_date, end_date,
      funding_amount, funding_currency, benefits, application_deadline, max_applicants
    } = req.body;

    const result = await pool.query(`
      INSERT INTO research_opportunities (
        user_id, title, description, type, institution, location, country,
        requirements, skills_required, duration, start_date, end_date,
        funding_amount, funding_currency, benefits, application_deadline, max_applicants
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      userId, title, description, type, institution, location, country,
      requirements, skills_required, duration, start_date, end_date,
      funding_amount, funding_currency, benefits, application_deadline, max_applicants
    ]);

    res.json({ opportunity: result.rows[0] });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Apply to opportunity
router.post('/opportunities/:opportunityId/apply', authenticateToken, async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const applicantId = req.user.id;
    const { coverLetter, cvUrl, portfolioUrl } = req.body;

    const result = await pool.query(`
      INSERT INTO opportunity_applications (opportunity_id, applicant_id, cover_letter, cv_url, portfolio_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [opportunityId, applicantId, coverLetter, cvUrl, portfolioUrl]);

    res.json({ application: result.rows[0] });
  } catch (error) {
    console.error('Error applying to opportunity:', error);
    res.status(500).json({ error: 'Failed to apply to opportunity' });
  }
});

// ==============================================
// SEARCH AND DISCOVERY
// ==============================================

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, institution, research_interests, role } = req.query;

    let searchQuery = `
      SELECT 
        u.id, u.first_name, u.last_name, u.current_position, u.current_institution,
        u.research_interests, u.expertise_areas, u.profile_visibility,
        u.connections_count, u.followers_count
      FROM users u
      WHERE u.status = 'active' AND u.id != $1
    `;
    const params: any[] = [req.user.id];
    let paramCount = 1;

    if (query) {
      paramCount++;
      searchQuery += ` AND (
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.current_position ILIKE $${paramCount} OR
        u.current_institution ILIKE $${paramCount}
      )`;
      params.push(`%${query}%`);
    }

    if (institution) {
      paramCount++;
      searchQuery += ` AND u.current_institution ILIKE $${paramCount}`;
      params.push(`%${institution}%`);
    }

    if (research_interests) {
      paramCount++;
      searchQuery += ` AND u.research_interests && $${paramCount}`;
      params.push(research_interests);
    }

    if (role) {
      paramCount++;
      searchQuery += ` AND u.role = $${paramCount}`;
      params.push(role);
    }

    searchQuery += ` ORDER BY u.connections_count DESC LIMIT 50`;

    const result = await pool.query(searchQuery, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get connection recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's research interests
    const userResult = await pool.query(`
      SELECT research_interests, current_institution FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userInterests = userResult.rows[0].research_interests || [];
    const userInstitution = userResult.rows[0].current_institution;

    // Find users with similar interests or from same institution
    const result = await pool.query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.current_position, u.current_institution,
        u.research_interests, u.expertise_areas, u.connections_count,
        calculate_research_compatibility($1, u.research_interests, u.expertise_areas) as compatibility_score
      FROM users u
      WHERE u.id != $2 
        AND u.status = 'active'
        AND u.allow_connection_requests = true
        AND (
          u.research_interests && $1 OR 
          u.current_institution = $3
        )
        AND u.id NOT IN (
          SELECT connected_user_id FROM user_connections WHERE user_id = $2 AND status = 'accepted'
          UNION
          SELECT user_id FROM user_connections WHERE connected_user_id = $2 AND status = 'accepted'
        )
      ORDER BY compatibility_score DESC, u.connections_count DESC
      LIMIT 20
    `, [userInterests, userId, userInstitution]);

    res.json({ recommendations: result.rows });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ==============================================
// NOTIFICATIONS
// ==============================================

// Get notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT 
        n.*,
        u.first_name, u.last_name, u.current_institution
      FROM notifications n
      LEFT JOIN users u ON n.related_user_id = u.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit as string), parseInt(offset as string)]);

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE notifications 
      SET read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
