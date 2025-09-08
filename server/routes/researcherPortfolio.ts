import express from 'express';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../index';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Researcher portfolio API is working!' });
});

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/digital_research_manager'
});

// AI Analysis Service (Mock implementation - replace with actual AI service)
const aiAnalysisService = {
  async analyzePublication(pdfPath: string, title: string, abstract: string) {
    // Mock AI analysis - replace with actual AI service integration
    return {
      summary: `AI-generated summary for: ${title}`,
      keywords: ['machine learning', 'research', 'analysis'],
      researchAreas: ['computer science', 'artificial intelligence'],
      confidence: 0.85
    };
  },

  async analyzeResearcherProfile(publications: any[], profile: any) {
    // Mock AI analysis for researcher profile
    return {
      bio: `Experienced researcher with expertise in ${profile.expertise_areas?.join(', ') || 'various fields'}`,
      strengths: ['collaboration', 'innovation', 'leadership'],
      collaborationStyle: 'collaborative and supportive'
    };
  },

  async calculateMatchingScore(studentProfile: any, supervisorProfile: any) {
    // Mock matching algorithm
    const domainMatch = studentProfile.research_domains?.some((domain: string) => 
      supervisorProfile.research_domains?.includes(domain)
    ) ? 0.8 : 0.3;

    const interestMatch = studentProfile.research_interests?.some((interest: string) => 
      supervisorProfile.research_interests?.includes(interest)
    ) ? 0.9 : 0.4;

    return Math.round((domainMatch + interestMatch) * 50); // 0-100 scale
  }
};

// Publication Management Routes

// Upload and analyze publication (simplified without file upload for now)
router.post('/publications/upload', authenticateToken, async (req, res) => {
  try {
    const { title, abstract, authors, journal, publication_date, doi, keywords, research_domains } = req.body;
    const researcher_id = req.user.id;

    // Perform AI analysis
    const aiAnalysis = await aiAnalysisService.analyzePublication('', title, abstract);

    // Save publication to database
    const result = await pool.query(`
      INSERT INTO researcher_publications 
      (researcher_id, title, abstract, authors, journal, publication_date, doi, 
       keywords, research_domains, ai_summary, ai_keywords, ai_research_areas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      researcher_id,
      title,
      abstract,
      JSON.parse(authors || '[]'),
      journal,
      publication_date,
      doi,
      JSON.parse(keywords || '[]'),
      JSON.parse(research_domains || '[]'),
      aiAnalysis.summary,
      aiAnalysis.keywords,
      aiAnalysis.researchAreas
    ]);

    res.json({
      success: true,
      publication: result.rows[0],
      aiAnalysis
    });
  } catch (error) {
    console.error('Error uploading publication:', error);
    res.status(500).json({ error: 'Failed to upload publication' });
  }
});

// Get researcher publications
router.get('/publications/:researcherId', async (req, res) => {
  try {
    const { researcherId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM researcher_publications 
      WHERE researcher_id = $1 
      ORDER BY publication_date DESC
    `, [researcherId]);

    res.json({ publications: result.rows });
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// Search publications
router.get('/publications/search', async (req, res) => {
  try {
    const { query, domain, limit = 20 } = req.query;
    
    let sql = `
      SELECT rp.*, u.first_name, u.last_name, u.email
      FROM researcher_publications rp
      JOIN users u ON rp.researcher_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (query) {
      paramCount++;
      sql += ` AND to_tsvector('english', rp.title || ' ' || COALESCE(rp.abstract, '')) @@ plainto_tsquery('english', $${paramCount})`;
      params.push(query);
    }

    if (domain) {
      paramCount++;
      sql += ` AND $${paramCount} = ANY(rp.research_domains)`;
      params.push(domain);
    }

    sql += ` ORDER BY rp.publication_date DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(sql, params);
    res.json({ publications: result.rows });
  } catch (error) {
    console.error('Error searching publications:', error);
    res.status(500).json({ error: 'Failed to search publications' });
  }
});

// Researcher Profile Routes

// Create or update researcher profile
router.post('/profiles', authenticateToken, async (req, res) => {
  try {
    const {
      institution, department, position, research_interests, expertise_areas,
      research_domains, years_of_experience, current_projects, previous_institutions,
      awards, grants, languages, max_students, collaboration_preferences,
      research_philosophy, mentorship_style, lab_website, orcid_id,
      google_scholar_id, researchgate_id, linkedin_url, twitter_handle
    } = req.body;

    const user_id = req.user.id;

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM researcher_profiles WHERE user_id = $1',
      [user_id]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await pool.query(`
        UPDATE researcher_profiles SET
          institution = $2, department = $3, position = $4, research_interests = $5,
          expertise_areas = $6, research_domains = $7, years_of_experience = $8,
          current_projects = $9, previous_institutions = $10, awards = $11, grants = $12,
          languages = $13, max_students = $14, collaboration_preferences = $15,
          research_philosophy = $16, mentorship_style = $17, lab_website = $18,
          orcid_id = $19, google_scholar_id = $20, researchgate_id = $21,
          linkedin_url = $22, twitter_handle = $23, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `, [
        user_id, institution, department, position, JSON.parse(research_interests || '[]'),
        JSON.parse(expertise_areas || '[]'), JSON.parse(research_domains || '[]'),
        years_of_experience, JSON.parse(current_projects || '[]'),
        JSON.parse(previous_institutions || '[]'), JSON.parse(awards || '[]'),
        JSON.parse(grants || '[]'), JSON.parse(languages || '[]'), max_students,
        collaboration_preferences, research_philosophy, mentorship_style,
        lab_website, orcid_id, google_scholar_id, researchgate_id,
        linkedin_url, twitter_handle
      ]);
    } else {
      // Create new profile
      result = await pool.query(`
        INSERT INTO researcher_profiles (
          user_id, institution, department, position, research_interests,
          expertise_areas, research_domains, years_of_experience, current_projects,
          previous_institutions, awards, grants, languages, max_students,
          collaboration_preferences, research_philosophy, mentorship_style,
          lab_website, orcid_id, google_scholar_id, researchgate_id,
          linkedin_url, twitter_handle
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *
      `, [
        user_id, institution, department, position, JSON.parse(research_interests || '[]'),
        JSON.parse(expertise_areas || '[]'), JSON.parse(research_domains || '[]'),
        years_of_experience, JSON.parse(current_projects || '[]'),
        JSON.parse(previous_institutions || '[]'), JSON.parse(awards || '[]'),
        JSON.parse(grants || '[]'), JSON.parse(languages || '[]'), max_students,
        collaboration_preferences, research_philosophy, mentorship_style,
        lab_website, orcid_id, google_scholar_id, researchgate_id,
        linkedin_url, twitter_handle
      ]);
    }

    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Error saving researcher profile:', error);
    res.status(500).json({ error: 'Failed to save researcher profile' });
  }
});

// Get researcher profile
router.get('/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT rp.*, u.first_name, u.last_name, u.email, u.role
      FROM researcher_profiles rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Co-Supervisor Matching Routes

// Find potential co-supervisors
router.post('/matching/find-supervisors', authenticateToken, async (req, res) => {
  try {
    const { research_interests, research_domains, max_results = 10 } = req.body;
    const student_id = req.user.id;

    // Get student profile
    const studentProfile = await pool.query(`
      SELECT research_interests, research_domains FROM researcher_profiles 
      WHERE user_id = $1
    `, [student_id]);

    const studentInterests = studentProfile.rows[0]?.research_interests || research_interests || [];
    const studentDomains = studentProfile.rows[0]?.research_domains || research_domains || [];

    // Find matching supervisors
    const result = await pool.query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email,
        rp.institution, rp.position, rp.research_interests, rp.research_domains,
        rp.expertise_areas, rp.availability_status, rp.max_students, rp.current_students,
        rp.total_publications, rp.total_citations, rp.h_index,
        calculate_research_compatibility($1, rp.research_domains, rp.research_interests) as compatibility_score
      FROM users u
      JOIN researcher_profiles rp ON u.id = rp.user_id
      WHERE u.role IN ('principal_researcher', 'co_supervisor')
        AND rp.availability_status = 'available'
        AND rp.current_students < rp.max_students
      ORDER BY compatibility_score DESC
      LIMIT $2
    `, [JSON.stringify(studentInterests), parseInt(max_results)]);

    res.json({ 
      supervisors: result.rows,
      studentProfile: {
        interests: studentInterests,
        domains: studentDomains
      }
    });
  } catch (error) {
    console.error('Error finding supervisors:', error);
    res.status(500).json({ error: 'Failed to find supervisors' });
  }
});

// Send co-supervisor request
router.post('/matching/send-request', authenticateToken, async (req, res) => {
  try {
    const { supervisor_id, message } = req.body;
    const student_id = req.user.id;

    // Check if request already exists
    const existingRequest = await pool.query(`
      SELECT id FROM co_supervisor_matches 
      WHERE student_id = $1 AND supervisor_id = $2
    `, [student_id, supervisor_id]);

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Request already sent to this supervisor' });
    }

    // Get compatibility score
    const studentProfile = await pool.query(`
      SELECT research_interests, research_domains FROM researcher_profiles 
      WHERE user_id = $1
    `, [student_id]);

    const supervisorProfile = await pool.query(`
      SELECT research_interests, research_domains FROM researcher_profiles 
      WHERE user_id = $1
    `, [supervisor_id]);

    const compatibilityScore = await pool.query(`
      SELECT calculate_research_compatibility($1, $2, $3) as score
    `, [
      JSON.stringify(studentProfile.rows[0]?.research_interests || []),
      supervisorProfile.rows[0]?.research_domains || [],
      supervisorProfile.rows[0]?.research_interests || []
    ]);

    // Create match request
    const result = await pool.query(`
      INSERT INTO co_supervisor_matches 
      (student_id, supervisor_id, match_score, student_message, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [student_id, supervisor_id, compatibilityScore.rows[0].score, message]);

    res.json({ success: true, match: result.rows[0] });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Research Exchange Routes

// Create exchange opportunity
router.post('/exchange/opportunities', authenticateToken, async (req, res) => {
  try {
    const {
      title, description, research_domains, required_expertise, duration_weeks,
      start_date, end_date, funding_available, funding_amount, accommodation_provided,
      visa_support, application_deadline, max_applicants, requirements, benefits,
      contact_email, application_url
    } = req.body;

    const host_researcher_id = req.user.id;
    
    // Get lab_id from user
    const userResult = await pool.query('SELECT lab_id FROM users WHERE id = $1', [host_researcher_id]);
    const host_lab_id = userResult.rows[0]?.lab_id;

    if (!host_lab_id) {
      return res.status(400).json({ error: 'User must be associated with a lab' });
    }

    const result = await pool.query(`
      INSERT INTO research_exchange_opportunities (
        host_lab_id, host_researcher_id, title, description, research_domains,
        required_expertise, duration_weeks, start_date, end_date, funding_available,
        funding_amount, accommodation_provided, visa_support, application_deadline,
        max_applicants, requirements, benefits, contact_email, application_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      host_lab_id, host_researcher_id, title, description, JSON.parse(research_domains || '[]'),
      JSON.parse(required_expertise || '[]'), duration_weeks, start_date, end_date,
      funding_available, funding_amount, accommodation_provided, visa_support,
      application_deadline, max_applicants, JSON.parse(requirements || '[]'),
      JSON.parse(benefits || '[]'), contact_email, application_url
    ]);

    res.json({ success: true, opportunity: result.rows[0] });
  } catch (error) {
    console.error('Error creating exchange opportunity:', error);
    res.status(500).json({ error: 'Failed to create exchange opportunity' });
  }
});

// Get exchange opportunities
router.get('/exchange/opportunities', async (req, res) => {
  try {
    const { domain, status = 'active', limit = 20 } = req.query;
    
    let sql = `
      SELECT 
        reo.*, 
        u.first_name, u.last_name, u.email as host_email,
        l.name as lab_name, l.institution
      FROM research_exchange_opportunities reo
      JOIN users u ON reo.host_researcher_id = u.id
      JOIN labs l ON reo.host_lab_id = l.id
      WHERE reo.status = $1
    `;
    const params: any[] = [status];
    let paramCount = 1;

    if (domain) {
      paramCount++;
      sql += ` AND $${paramCount} = ANY(reo.research_domains)`;
      params.push(domain);
    }

    sql += ` ORDER BY reo.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(sql, params);
    res.json({ opportunities: result.rows });
  } catch (error) {
    console.error('Error fetching exchange opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch exchange opportunities' });
  }
});

// Apply for exchange opportunity
router.post('/exchange/apply', authenticateToken, async (req, res) => {
  try {
    const { opportunity_id, motivation, relevant_experience, research_proposal, cv_url, recommendation_letter_url } = req.body;
    const applicant_id = req.user.id;

    // Check if already applied
    const existingApplication = await pool.query(`
      SELECT id FROM exchange_applications 
      WHERE opportunity_id = $1 AND applicant_id = $2
    `, [opportunity_id, applicant_id]);

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({ error: 'Already applied to this opportunity' });
    }

    const result = await pool.query(`
      INSERT INTO exchange_applications (
        opportunity_id, applicant_id, motivation, relevant_experience,
        research_proposal, cv_url, recommendation_letter_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [opportunity_id, applicant_id, motivation, relevant_experience, research_proposal, cv_url, recommendation_letter_url]);

    res.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Error applying for exchange:', error);
    res.status(500).json({ error: 'Failed to apply for exchange opportunity' });
  }
});

// Dashboard Routes

// Get researcher dashboard data
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get profile
    const profileResult = await pool.query(`
      SELECT * FROM researcher_profiles WHERE user_id = $1
    `, [userId]);

    // Get publications
    const publicationsResult = await pool.query(`
      SELECT * FROM researcher_publications 
      WHERE researcher_id = $1 
      ORDER BY publication_date DESC LIMIT 10
    `, [userId]);

    // Get recent matches/requests
    const matchesResult = await pool.query(`
      SELECT csm.*, u.first_name, u.last_name, u.email
      FROM co_supervisor_matches csm
      JOIN users u ON csm.supervisor_id = u.id
      WHERE csm.student_id = $1
      ORDER BY csm.created_at DESC LIMIT 5
    `, [userId]);

    res.json({
      profile: profileResult.rows[0],
      recentPublications: publicationsResult.rows,
      recentMatches: matchesResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
