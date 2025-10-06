import { Router, Request, Response } from 'express';
import { pool } from '../database/config.js';

const router = Router();

// Types for Research Data Bank
interface DataBankOrganization {
  id: string;
  name: string;
  type: 'research_lab' | 'hospital' | 'diagnostic_lab' | 'industry' | 'public_sector' | 'ngo' | 'individual';
  category: 'healthcare' | 'research' | 'industry' | 'government' | 'nonprofit' | 'academic';
  country: string;
  region: string;
  contactEmail: string;
  website?: string;
  description: string;
  specializations: string[];
  verified: boolean;
  rating: number;
  joinedDate: Date;
  lastActive: Date;
}

interface DataOffer {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  dataType: 'clinical' | 'epidemiological' | 'genomic' | 'environmental' | 'social' | 'economic' | 'demographic';
  diseaseFocus?: string[];
  populationType: 'general' | 'pediatric' | 'adult' | 'elderly' | 'specific_condition';
  sampleSize?: number;
  geographicCoverage: string[];
  timePeriod: string;
  accessLevel: 'open' | 'restricted' | 'collaboration_required';
  requirements: string[];
  contactPerson: string;
  lastUpdated: Date;
  requestCount: number;
}

interface DataRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterInstitution: string;
  dataOfferId: string;
  purpose: string;
  methodology: string;
  timeline: string;
  collaborationProposed: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  submittedDate: Date;
  responseDate?: Date;
  notes?: string;
}

// ===== ORGANIZATION MANAGEMENT =====

// Get all organizations with filtering and pagination
router.get('/organizations', async (req: Request, res: Response) => {
  try {
    const { 
      type, 
      category, 
      country, 
      verified, 
      search, 
      page = 1, 
      limit = 20,
      sortBy = 'verified',
      sortOrder = 'desc'
    } = req.query as any;

    let query = `
      SELECT 
        o.*,
        COUNT(d.id) as data_count,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as rating_count
      FROM databank_organizations o
      LEFT JOIN databank_data_offers d ON o.id = d.organization_id
      LEFT JOIN databank_ratings r ON o.id = r.organization_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    if (type && type !== 'all') {
      paramCount++;
      query += ` AND o.type = $${paramCount}`;
      params.push(type);
    }

    if (category && category !== 'all') {
      paramCount++;
      query += ` AND o.category = $${paramCount}`;
      params.push(category);
    }

    if (country && country !== 'all') {
      paramCount++;
      query += ` AND o.country ILIKE $${paramCount}`;
      params.push(`%${country}%`);
    }

    if (verified !== undefined) {
      paramCount++;
      query += ` AND o.verified = $${paramCount}`;
      params.push(verified === 'true');
    }

    if (search) {
      paramCount++;
      query += ` AND (
        o.name ILIKE $${paramCount} OR 
        o.description ILIKE $${paramCount} OR 
        EXISTS (
          SELECT 1 FROM unnest(o.specializations) AS spec 
          WHERE spec ILIKE $${paramCount}
        )
      )`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY o.id`;

    // Add sorting
    const validSortFields = ['name', 'rating', 'joined_date', 'verified'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'verified';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    if (sortField === 'rating') {
      query += ` ORDER BY avg_rating ${order} NULLS LAST, o.joined_date DESC`;
    } else if (sortField === 'verified') {
      query += ` ORDER BY o.verified ${order}, avg_rating DESC NULLS LAST`;
    } else {
      query += ` ORDER BY o.${sortField} ${order}`;
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM databank_organizations o
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (type && type !== 'all') {
      countParamCount++;
      countQuery += ` AND o.type = $${countParamCount}`;
      countParams.push(type);
    }
    if (category && category !== 'all') {
      countParamCount++;
      countQuery += ` AND o.category = $${countParamCount}`;
      countParams.push(category);
    }
    if (country && country !== 'all') {
      countParamCount++;
      countQuery += ` AND o.country ILIKE $${countParamCount}`;
      countParams.push(`%${country}%`);
    }
    if (verified !== undefined) {
      countParamCount++;
      countQuery += ` AND o.verified = $${countParamCount}`;
      countParams.push(verified === 'true');
    }
    if (search) {
      countParamCount++;
      countQuery += ` AND (
        o.name ILIKE $${countParamCount} OR 
        o.description ILIKE $${countParamCount} OR 
        EXISTS (
          SELECT 1 FROM unnest(o.specializations) AS spec 
          WHERE spec ILIKE $${countParamCount}
        )
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      organizations: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization by ID
router.get('/organizations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orgResult = await pool.query(`
      SELECT 
        o.*,
        COUNT(d.id) as data_count,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as rating_count
      FROM databank_organizations o
      LEFT JOIN databank_data_offers d ON o.id = d.organization_id
      LEFT JOIN databank_ratings r ON o.id = r.organization_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const organization = orgResult.rows[0];

    // Get data offers for this organization
    const dataResult = await pool.query(`
      SELECT * FROM databank_data_offers
      WHERE organization_id = $1
      ORDER BY last_updated DESC
    `, [id]);

    organization.data_offers = dataResult.rows;

    res.json({ organization });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new organization
router.post('/organizations', async (req: Request, res: Response) => {
  try {
    const {
      name,
      type,
      category,
      country,
      region,
      contactEmail,
      website,
      description,
      specializations
    } = req.body;

    const result = await pool.query(`
      INSERT INTO databank_organizations (
        name, type, category, country, region, contact_email, 
        website, description, specializations, verified, rating, 
        joined_date, last_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [name, type, category, country, region, contactEmail, website, description, specializations]);

    console.log('📊 New organization registered:', { name, type, category, contactEmail });

    res.status(201).json({ 
      organization: result.rows[0],
      message: 'Organization registered successfully. It will be verified before appearing publicly.'
    });

  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== DATA OFFERS MANAGEMENT =====

// Get data offers with filtering
router.get('/data-offers', async (req: Request, res: Response) => {
  try {
    const { 
      organizationId,
      dataType,
      diseaseFocus,
      accessLevel,
      country,
      search,
      page = 1,
      limit = 20
    } = req.query as any;

    let query = `
      SELECT 
        d.*,
        o.name as organization_name,
        o.country as organization_country,
        o.verified as organization_verified
      FROM databank_data_offers d
      JOIN databank_organizations o ON d.organization_id = o.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    if (organizationId) {
      paramCount++;
      query += ` AND d.organization_id = $${paramCount}`;
      params.push(organizationId);
    }

    if (dataType && dataType !== 'all') {
      paramCount++;
      query += ` AND d.data_type = $${paramCount}`;
      params.push(dataType);
    }

    if (diseaseFocus) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(d.disease_focus)`;
      params.push(diseaseFocus);
    }

    if (accessLevel && accessLevel !== 'all') {
      paramCount++;
      query += ` AND d.access_level = $${paramCount}`;
      params.push(accessLevel);
    }

    if (country && country !== 'all') {
      paramCount++;
      query += ` AND o.country ILIKE $${paramCount}`;
      params.push(`%${country}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        d.title ILIKE $${paramCount} OR 
        d.description ILIKE $${paramCount} OR 
        o.name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY d.last_updated DESC`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({ data_offers: result.rows });

  } catch (error) {
    console.error('Error fetching data offers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new data offer
router.post('/data-offers', async (req: Request, res: Response) => {
  try {
    const {
      organizationId,
      title,
      description,
      dataType,
      diseaseFocus,
      populationType,
      sampleSize,
      geographicCoverage,
      timePeriod,
      accessLevel,
      requirements,
      contactPerson
    } = req.body;

    const result = await pool.query(`
      INSERT INTO databank_data_offers (
        organization_id, title, description, data_type, disease_focus,
        population_type, sample_size, geographic_coverage, time_period,
        access_level, requirements, contact_person, last_updated, request_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, 0)
      RETURNING *
    `, [
      organizationId, title, description, dataType, diseaseFocus,
      populationType, sampleSize, geographicCoverage, timePeriod,
      accessLevel, requirements, contactPerson
    ]);

    console.log('📊 New data offer created:', { title, organizationId, dataType });

    res.status(201).json({ 
      data_offer: result.rows[0],
      message: 'Data offer created successfully'
    });

  } catch (error) {
    console.error('Error creating data offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== DATA REQUESTS MANAGEMENT =====

// Submit data request
router.post('/data-requests', async (req: Request, res: Response) => {
  try {
    const {
      dataOfferId,
      requesterName,
      requesterInstitution,
      requesterEmail,
      purpose,
      methodology,
      timeline,
      collaborationProposed,
      additionalNotes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO databank_data_requests (
        data_offer_id, requester_name, requester_institution, requester_email,
        purpose, methodology, timeline, collaboration_proposed, additional_notes,
        status, submitted_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      dataOfferId, requesterName, requesterInstitution, requesterEmail,
      purpose, methodology, timeline, collaborationProposed, additionalNotes
    ]);

    // Update request count for the data offer
    await pool.query(`
      UPDATE databank_data_offers 
      SET request_count = request_count + 1 
      WHERE id = $1
    `, [dataOfferId]);

    console.log('📊 New data request submitted:', { 
      dataOfferId, 
      requesterName, 
      requesterInstitution,
      purpose: purpose.substring(0, 100) + '...'
    });

    res.status(201).json({ 
      data_request: result.rows[0],
      message: 'Data request submitted successfully. The organization will review your request.'
    });

  } catch (error) {
    console.error('Error submitting data request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get data requests for an organization
router.get('/organizations/:id/requests', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query as any;

    let query = `
      SELECT 
        dr.*,
        do.title as data_offer_title,
        do.data_type
      FROM databank_data_requests dr
      JOIN databank_data_offers do ON dr.data_offer_id = do.id
      WHERE do.organization_id = $1
    `;
    
    const params: any[] = [id];
    let paramCount = 1;

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND dr.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY dr.submitted_date DESC`;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({ data_requests: result.rows });

  } catch (error) {
    console.error('Error fetching data requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update data request status
router.put('/data-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, response, notes } = req.body;

    const result = await pool.query(`
      UPDATE databank_data_requests 
      SET status = $1, response = $2, notes = $3, response_date = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, response, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data request not found' });
    }

    console.log('📊 Data request status updated:', { id, status, response: response?.substring(0, 50) + '...' });

    res.json({ 
      data_request: result.rows[0],
      message: 'Data request status updated successfully'
    });

  } catch (error) {
    console.error('Error updating data request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== STATISTICS AND ANALYTICS =====

// Get platform statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [orgStats, dataStats, requestStats] = await Promise.all([
      // Organization statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_organizations,
          COUNT(*) FILTER (WHERE verified = true) as verified_organizations,
          COUNT(*) FILTER (WHERE type = 'research_lab') as research_labs,
          COUNT(*) FILTER (WHERE type = 'hospital') as hospitals,
          COUNT(*) FILTER (WHERE type = 'ngo') as ngos,
          COUNT(*) FILTER (WHERE country = 'United States') as us_organizations
        FROM databank_organizations
      `),
      
      // Data offer statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_data_offers,
          COUNT(*) FILTER (WHERE access_level = 'open') as open_data,
          COUNT(*) FILTER (WHERE access_level = 'restricted') as restricted_data,
          COUNT(*) FILTER (WHERE access_level = 'collaboration_required') as collaboration_data,
          SUM(request_count) as total_requests
        FROM databank_data_offers
      `),
      
      // Request statistics
      pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
          COUNT(*) FILTER (WHERE submitted_date >= CURRENT_DATE - INTERVAL '30 days') as recent_requests
        FROM databank_data_requests
      `)
    ]);

    const stats = {
      organizations: orgStats.rows[0],
      data_offers: dataStats.rows[0],
      requests: requestStats.rows[0],
      generated_at: new Date().toISOString()
    };

    res.json({ stats });

  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
