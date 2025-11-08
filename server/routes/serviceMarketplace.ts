/**
 * Service Provider Marketplace API Routes
 * Handles service listings, requests, projects, work packages, and reviews
 */

import { Router } from 'express';
import pool from '../../database/config.js';

const router: Router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Service marketplace routes are loaded!' });
});

// ==============================================
// SERVICE CATEGORIES
// ==============================================

// Get all service categories
router.get('/categories', async (req, res) => {
  try {
    console.log('🔍 Fetching service categories...');
    const result = await pool.query(`
      SELECT *
      FROM service_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `);

    console.log(`✅ Found ${result.rows.length} categories`);
    res.json(result.rows);
  } catch (error: any) {
    console.error('❌ Error fetching service categories:', error.message);
    res.status(500).json({ error: 'Failed to fetch service categories', details: error.message });
  }
});

// ==============================================
// SERVICE LISTINGS
// ==============================================

// Browse all service listings
router.get('/listings', async (req, res) => {
  try {
    const { category, service_type, min_price, max_price, search, sort_by = 'rating' } = req.query;
    
    console.log('📋 Fetching service listings with filters:', { category, service_type, search });
    
    let query = `
      SELECT 
        sl.*,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as provider_name,
        COALESCE(u.role::text, 'researcher') as provider_position,
        COALESCE(u.bio, '') as provider_institution
      FROM service_listings sl
      LEFT JOIN users u ON sl.provider_id = u.id
      WHERE sl.is_active = true
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND sl.category_id = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (service_type) {
      query += ` AND sl.service_type = $${paramCount}`;
      params.push(service_type);
      paramCount++;
    }

    if (min_price) {
      query += ` AND sl.base_price >= $${paramCount}`;
      params.push(min_price);
      paramCount++;
    }

    if (max_price) {
      query += ` AND COALESCE(sl.price_range_max, sl.base_price) <= $${paramCount}`;
      params.push(max_price);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        sl.service_title ILIKE $${paramCount} OR
        sl.service_description ILIKE $${paramCount} OR
        COALESCE(array_to_string(sl.tags, ','), '') ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Sorting
    if (sort_by === 'rating') {
      query += ` ORDER BY COALESCE(sl.average_rating, 0) DESC, COALESCE(sl.total_ratings, 0) DESC`;
    } else if (sort_by === 'price_low') {
      query += ` ORDER BY sl.base_price ASC`;
    } else if (sort_by === 'price_high') {
      query += ` ORDER BY sl.base_price DESC`;
    } else if (sort_by === 'recent') {
      query += ` ORDER BY sl.created_at DESC`;
    }

    query += ` LIMIT 50`;

    console.log('📋 Executing query...');
    const result = await pool.query(query, params);
    console.log(`✅ Found ${result.rows.length} service listings`);
    res.json(result.rows);
  } catch (error: any) {
    console.error('❌ Error fetching service listings:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch service listings', details: error.message });
  }
});

// Get a specific service listing
router.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        sl.*,
        u.first_name || ' ' || u.last_name as provider_name,
        u.role as provider_position,
        u.email as provider_institution,
        u.bio as provider_bio
      FROM service_listings sl
      JOIN users u ON sl.provider_id = u.id
      WHERE sl.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service listing not found' });
    }

    // Increment view count
    await pool.query(`
      UPDATE service_listings
      SET views_count = views_count + 1
      WHERE id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching service listing:', error);
    res.status(500).json({ error: 'Failed to fetch service listing' });
  }
});

// Get my service listings
router.get('/my-listings', async (req: any, res) => {
  try {
    const providerId = req.user.id;

    const result = await pool.query(`
      SELECT sl.*, COUNT(sr.id) as pending_requests
      FROM service_listings sl
      LEFT JOIN service_requests sr ON sl.id = sr.service_id AND sr.status = 'pending'
      WHERE sl.provider_id = $1
      GROUP BY sl.id
      ORDER BY sl.created_at DESC
    `, [providerId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching my service listings:', error);
    res.status(500).json({ error: 'Failed to fetch my service listings' });
  }
});

// Create a service listing
router.post('/listings', async (req: any, res) => {
  try {
    const providerId = req.user.id;
    const {
      service_title, service_description, category_id, service_type,
      expertise_areas, techniques_offered, software_tools,
      pricing_model, base_price, currency, price_range_min, price_range_max,
      typical_turnaround_days, requirements_description, deliverables_description,
      tags
    } = req.body;

    const result = await pool.query(`
      INSERT INTO service_listings (
        provider_id, service_title, service_description, category_id, service_type,
        expertise_areas, techniques_offered, software_tools,
        pricing_model, base_price, currency, price_range_min, price_range_max,
        typical_turnaround_days, requirements_description, deliverables_description,
        tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [providerId, service_title, service_description, category_id, service_type,
        expertise_areas, techniques_offered, software_tools,
        pricing_model, base_price, currency, price_range_min, price_range_max,
        typical_turnaround_days, requirements_description, deliverables_description,
        tags]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating service listing:', error);
    res.status(500).json({ error: 'Failed to create service listing' });
  }
});

// Update a service listing
router.put('/listings/:id', async (req: any, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;
    const {
      service_title, service_description, pricing_model, base_price,
      currently_accepting_projects, is_active
    } = req.body;

    const result = await pool.query(`
      UPDATE service_listings
      SET 
        service_title = COALESCE($1, service_title),
        service_description = COALESCE($2, service_description),
        pricing_model = COALESCE($3, pricing_model),
        base_price = COALESCE($4, base_price),
        currently_accepting_projects = COALESCE($5, currently_accepting_projects),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND provider_id = $8
      RETURNING *
    `, [service_title, service_description, pricing_model, base_price,
        currently_accepting_projects, is_active, id, providerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service listing not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating service listing:', error);
    res.status(500).json({ error: 'Failed to update service listing' });
  }
});

// ==============================================
// SERVICE PORTFOLIO
// ==============================================

// Get portfolio items for a service
router.get('/listings/:serviceId/portfolio', async (req, res) => {
  try {
    const { serviceId } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM service_portfolio_items
      WHERE service_id = $1 AND is_public = true
      ORDER BY display_order, created_at DESC
    `, [serviceId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching portfolio items:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
});

// Add portfolio item
router.post('/listings/:serviceId/portfolio', async (req: any, res) => {
  try {
    const providerId = req.user.id;
    const { serviceId } = req.params;
    const {
      title, description, project_type, challenge_description,
      solution_description, results_description, techniques_used,
      tools_used, project_duration_days
    } = req.body;

    // Verify ownership
    const serviceCheck = await pool.query(`
      SELECT id FROM service_listings WHERE id = $1 AND provider_id = $2
    `, [serviceId, providerId]);

    if (serviceCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(`
      INSERT INTO service_portfolio_items (
        service_id, provider_id, title, description, project_type,
        challenge_description, solution_description, results_description,
        techniques_used, tools_used, project_duration_days
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [serviceId, providerId, title, description, project_type,
        challenge_description, solution_description, results_description,
        techniques_used, tools_used, project_duration_days]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding portfolio item:', error);
    res.status(500).json({ error: 'Failed to add portfolio item' });
  }
});

// ==============================================
// SERVICE REQUESTS
// ==============================================

// Get my service requests (as client)
router.get('/my-requests', async (req: any, res) => {
  try {
    const clientId = req.user.id;

    const result = await pool.query(`
      SELECT 
        sr.*,
        sl.service_title,
        u.first_name || ' ' || u.last_name as provider_name
      FROM service_requests sr
      JOIN service_listings sl ON sr.service_id = sl.id
      JOIN users u ON sr.provider_id = u.id
      WHERE sr.client_id = $1
      ORDER BY sr.created_at DESC
    `, [clientId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching my service requests:', error);
    res.status(500).json({ error: 'Failed to fetch my service requests' });
  }
});

// Get incoming service requests (as provider)
router.get('/incoming-requests', async (req: any, res) => {
  try {
    const providerId = req.user.id;

    const result = await pool.query(`
      SELECT 
        sr.*,
        sl.service_title,
        u.first_name || ' ' || u.last_name as client_name,
        u.current_institution as client_institution
      FROM service_requests sr
      JOIN service_listings sl ON sr.service_id = sl.id
      JOIN users u ON sr.client_id = u.id
      WHERE sr.provider_id = $1
      ORDER BY 
        CASE WHEN sr.status = 'pending' THEN 0 ELSE 1 END,
        sr.created_at DESC
    `, [providerId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching incoming requests:', error);
    res.status(500).json({ error: 'Failed to fetch incoming requests' });
  }
});

// Create a service request
router.post('/requests', async (req: any, res) => {
  try {
    const clientId = req.user.id;
    const {
      service_id, project_title, project_description, specific_requirements,
      desired_start_date, desired_completion_date, urgency_level,
      budget_range_min, budget_range_max
    } = req.body;

    // Get provider_id from service
    const serviceResult = await pool.query(`
      SELECT provider_id FROM service_listings WHERE id = $1
    `, [service_id]);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const providerId = serviceResult.rows[0].provider_id;

    const result = await pool.query(`
      INSERT INTO service_requests (
        service_id, provider_id, client_id, project_title, project_description,
        specific_requirements, desired_start_date, desired_completion_date,
        urgency_level, budget_range_min, budget_range_max
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [service_id, providerId, clientId, project_title, project_description,
        specific_requirements, desired_start_date, desired_completion_date,
        urgency_level, budget_range_min, budget_range_max]);

    // Increment inquiries count for the service
    await pool.query(`
      UPDATE service_listings
      SET inquiries_count = inquiries_count + 1
      WHERE id = $1
    `, [service_id]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Failed to create service request' });
  }
});

// Update service request status (provider responds)
router.put('/requests/:id', async (req: any, res) => {
  try {
    const providerId = req.user.id;
    const { id } = req.params;
    const { status, provider_response } = req.body;

    const result = await pool.query(`
      UPDATE service_requests
      SET 
        status = COALESCE($1, status),
        provider_response = COALESCE($2, provider_response),
        provider_responded_at = CASE WHEN $2 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE provider_responded_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND provider_id = $4
      RETURNING *
    `, [status, provider_response, id, providerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating service request:', error);
    res.status(500).json({ error: 'Failed to update service request' });
  }
});

// ==============================================
// SERVICE PROPOSALS
// ==============================================

// Create a proposal for a request
router.post('/proposals', async (req: any, res) => {
  try {
    const providerId = req.user.id;
    const {
      request_id, proposal_title, proposed_approach, methodology_description,
      quoted_price, currency, estimated_duration_days, deliverables,
      payment_terms, payment_schedule
    } = req.body;

    // Verify the request belongs to this provider
    const requestCheck = await pool.query(`
      SELECT id FROM service_requests WHERE id = $1 AND provider_id = $2
    `, [request_id, providerId]);

    if (requestCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(`
      INSERT INTO service_proposals (
        request_id, provider_id, proposal_title, proposed_approach,
        methodology_description, quoted_price, currency, estimated_duration_days,
        deliverables, payment_terms, payment_schedule, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'sent')
      RETURNING *
    `, [request_id, providerId, proposal_title, proposed_approach,
        methodology_description, quoted_price, currency, estimated_duration_days,
        deliverables, payment_terms, payment_schedule]);

    // Update request status
    await pool.query(`
      UPDATE service_requests
      SET status = 'proposal_sent', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [request_id]);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// Get proposals for a request
router.get('/requests/:requestId/proposals', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Verify user is either client or provider
    const requestCheck = await pool.query(`
      SELECT client_id, provider_id FROM service_requests WHERE id = $1
    `, [requestId]);

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const { client_id, provider_id } = requestCheck.rows[0];
    if (userId !== client_id && userId !== provider_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(`
      SELECT *
      FROM service_proposals
      WHERE request_id = $1
      ORDER BY created_at DESC
    `, [requestId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Accept a proposal (client)
router.post('/proposals/:id/accept', async (req: any, res) => {
  try {
    const clientId = req.user.id;
    const { id } = req.params;

    // Get proposal and verify client
    const proposal = await pool.query(`
      SELECT sp.*, sr.client_id, sr.service_id
      FROM service_proposals sp
      JOIN service_requests sr ON sp.request_id = sr.id
      WHERE sp.id = $1
    `, [id]);

    if (proposal.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.rows[0].client_id !== clientId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update proposal status
    await pool.query(`
      UPDATE service_proposals
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    // Update request status
    await pool.query(`
      UPDATE service_requests
      SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [proposal.rows[0].request_id]);

    // Create a service project
    const projectResult = await pool.query(`
      INSERT INTO service_projects (
        request_id, proposal_id, service_id, provider_id, client_id,
        project_title, project_description, agreed_price, currency,
        start_date, expected_completion_date, status
      )
      SELECT 
        sp.request_id, sp.id, sr.service_id, sp.provider_id, sr.client_id,
        sr.project_title, sr.project_description, sp.quoted_price, sp.currency,
        CURRENT_DATE, CURRENT_DATE + sp.estimated_duration_days, 'active'
      FROM service_proposals sp
      JOIN service_requests sr ON sp.request_id = sr.id
      WHERE sp.id = $1
      RETURNING *
    `, [id]);

    res.json({ message: 'Proposal accepted', project: projectResult.rows[0] });
  } catch (error: any) {
    console.error('Error accepting proposal:', error);
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// ==============================================
// SERVICE PROJECTS
// ==============================================

// Get my projects (as provider)
router.get('/my-projects/provider', async (req: any, res) => {
  try {
    const providerId = req.user.id;

    const result = await pool.query(`
      SELECT 
        sp.*,
        u.first_name || ' ' || u.last_name as client_name,
        sl.service_title
      FROM service_projects sp
      JOIN users u ON sp.client_id = u.id
      JOIN service_listings sl ON sp.service_id = sl.id
      WHERE sp.provider_id = $1
      ORDER BY 
        CASE sp.status 
          WHEN 'active' THEN 0
          WHEN 'pending_start' THEN 1
          WHEN 'on_hold' THEN 2
          ELSE 3
        END,
        sp.created_at DESC
    `, [providerId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching provider projects:', error);
    res.status(500).json({ error: 'Failed to fetch provider projects' });
  }
});

// Get my projects (as client)
router.get('/my-projects/client', async (req: any, res) => {
  try {
    const clientId = req.user.id;

    const result = await pool.query(`
      SELECT 
        sp.*,
        u.first_name || ' ' || u.last_name as provider_name,
        sl.service_title
      FROM service_projects sp
      JOIN users u ON sp.provider_id = u.id
      JOIN service_listings sl ON sp.service_id = sl.id
      WHERE sp.client_id = $1
      ORDER BY 
        CASE sp.status 
          WHEN 'active' THEN 0
          WHEN 'pending_start' THEN 1
          WHEN 'on_hold' THEN 2
          ELSE 3
        END,
        sp.created_at DESC
    `, [clientId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching client projects:', error);
    res.status(500).json({ error: 'Failed to fetch client projects' });
  }
});

// Get project details
router.get('/projects/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        sp.*,
        u_provider.first_name || ' ' || u_provider.last_name as provider_name,
        u_client.first_name || ' ' || u_client.last_name as client_name,
        sl.service_title
      FROM service_projects sp
      JOIN users u_provider ON sp.provider_id = u_provider.id
      JOIN users u_client ON sp.client_id = u_client.id
      JOIN service_listings sl ON sp.service_id = sl.id
      WHERE sp.id = $1 AND (sp.provider_id = $2 OR sp.client_id = $2)
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Update project status
router.put('/projects/:id', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, progress_percentage } = req.body;

    const result = await pool.query(`
      UPDATE service_projects
      SET 
        status = COALESCE($1, status),
        progress_percentage = COALESCE($2, progress_percentage),
        actual_completion_date = CASE WHEN $1 = 'completed' THEN CURRENT_DATE ELSE actual_completion_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND provider_id = $4
      RETURNING *
    `, [status, progress_percentage, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ==============================================
// SERVICE REVIEWS
// ==============================================

// Get reviews for a service
router.get('/listings/:serviceId/reviews', async (req, res) => {
  try {
    const { serviceId } = req.params;

    const result = await pool.query(`
      SELECT 
        sr.*,
        u.first_name || ' ' || u.last_name as reviewer_name,
        u.current_institution as reviewer_institution
      FROM service_reviews sr
      JOIN users u ON sr.reviewer_id = u.id
      WHERE sr.service_id = $1 AND sr.is_flagged = false
      ORDER BY sr.created_at DESC
      LIMIT 50
    `, [serviceId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit a review (client reviews provider)
router.post('/reviews', async (req: any, res) => {
  try {
    const reviewerId = req.user.id;
    const {
      service_id, project_id, overall_rating, quality_rating,
      communication_rating, timeliness_rating, professionalism_rating,
      value_for_money_rating, review_title, review_text,
      would_hire_again, would_recommend_to_others
    } = req.body;

    // Verify the reviewer is the client of this project
    const projectCheck = await pool.query(`
      SELECT provider_id FROM service_projects WHERE id = $1 AND client_id = $2
    `, [project_id, reviewerId]);

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to review this project' });
    }

    const providerId = projectCheck.rows[0].provider_id;

    const result = await pool.query(`
      INSERT INTO service_reviews (
        service_id, project_id, reviewer_id, provider_id,
        overall_rating, quality_rating, communication_rating,
        timeliness_rating, professionalism_rating, value_for_money_rating,
        review_title, review_text, would_hire_again, would_recommend_to_others,
        is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
      ON CONFLICT (project_id, reviewer_id)
      DO UPDATE SET
        overall_rating = EXCLUDED.overall_rating,
        quality_rating = EXCLUDED.quality_rating,
        review_text = EXCLUDED.review_text,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [service_id, project_id, reviewerId, providerId, overall_rating,
        quality_rating, communication_rating, timeliness_rating,
        professionalism_rating, value_for_money_rating, review_title,
        review_text, would_hire_again, would_recommend_to_others]);

    // Update service ratings
    await updateServiceRatings(service_id);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Helper function to update service ratings
async function updateServiceRatings(serviceId: string) {
  await pool.query(`
    UPDATE service_listings
    SET 
      average_rating = (
        SELECT AVG(overall_rating)::DECIMAL(3,2)
        FROM service_reviews
        WHERE service_id = $1
      ),
      total_ratings = (
        SELECT COUNT(*)
        FROM service_reviews
        WHERE service_id = $1
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [serviceId]);
}

// ==============================================
// PROVIDER STATISTICS
// ==============================================

// Get provider statistics
router.get('/providers/:providerId/stats', async (req, res) => {
  try {
    const { providerId } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM service_provider_stats
      WHERE provider_id = $1
    `, [providerId]);

    if (result.rows.length === 0) {
      return res.json({
        provider_id: providerId,
        total_projects_completed: 0,
        average_rating: 0,
        total_reviews: 0
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({ error: 'Failed to fetch provider stats' });
  }
});

export default router;

