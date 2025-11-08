// Simple Couchsurfing-Style Reference System API
// AI-Generated Reference Letters from Collected References

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

// Get user's reference collection (like Couchsurfing profile)
router.get('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const profileQuery = `
      SELECT 
        rs.*,
        u.email,
        u.first_name,
        u.last_name
      FROM user_reference_stats rs
      JOIN users u ON rs.user_id = u.id
      WHERE rs.user_id = $1
    `;
    
    const result = await pool.query(profileQuery, [userId]);
    
    if (result.rows.length === 0) {
      // Create initial stats
      await pool.query(
        'INSERT INTO user_reference_stats (user_id) VALUES ($1)',
        [userId]
      );
      res.json({ profile: { user_id: userId, total_references: 0, average_rating: 0 }, isNew: true });
    } else {
      res.json({ profile: result.rows[0], isNew: false });
    }
  } catch (error) {
    console.error('Error fetching reference profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all references for a user
router.get('/references', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { contextType, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        rc.*,
        u.email as giver_email,
        u.first_name as giver_first_name,
        u.last_name as giver_last_name
      FROM reference_collections rc
      JOIN users u ON rc.reference_giver_id = u.id
      WHERE rc.user_id = $1
    `;
    
    const params = [userId];
    
    if (contextType) {
      query += ` AND rc.context_type = $2`;
      params.push(contextType);
    }
    
    query += ` ORDER BY rc.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    res.json({ references: result.rows });
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a reference (like leaving a Couchsurfing review)
router.post('/add-reference', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      userId, // The person being referenced
      contextType,
      contextDetails,
      relationshipDuration,
      workingRelationship,
      referenceText,
      overallRating,
      skillsMentioned = []
    } = req.body;
    
    const giverId = req.user.id;
    
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Insert reference
    const insertQuery = `
      INSERT INTO reference_collections (
        user_id, reference_giver_id, context_type, context_details,
        relationship_duration, working_relationship, reference_text,
        overall_rating, skills_mentioned
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, reference_giver_id, context_type, context_details) 
      DO UPDATE SET
        relationship_duration = EXCLUDED.relationship_duration,
        working_relationship = EXCLUDED.working_relationship,
        reference_text = EXCLUDED.reference_text,
        overall_rating = EXCLUDED.overall_rating,
        skills_mentioned = EXCLUDED.skills_mentioned,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      userId, giverId, contextType, contextDetails,
      relationshipDuration, workingRelationship, referenceText,
      overallRating, skillsMentioned
    ]);
    
    res.json({ 
      reference: result.rows[0],
      message: 'Reference added successfully'
    });
  } catch (error) {
    console.error('Error adding reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request a reference from someone
router.post('/request-reference', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      referenceGiverEmail,
      contextType,
      contextDetails,
      relationshipDescription,
      message
    } = req.body;
    
    const requesterId = req.user.id;
    
    // Find the reference giver
    const giverQuery = await pool.query('SELECT id FROM users WHERE email = $1', [referenceGiverEmail]);
    if (giverQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const referenceGiverId = giverQuery.rows[0].id;
    
    // Create request
    const requestQuery = `
      INSERT INTO reference_requests (
        requester_id, reference_giver_id, context_type,
        context_details, relationship_description, message
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(requestQuery, [
      requesterId, referenceGiverId, contextType,
      contextDetails, relationshipDescription, message
    ]);
    
    res.json({ 
      request: result.rows[0],
      message: 'Reference request sent successfully'
    });
  } catch (error) {
    console.error('Error requesting reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending reference requests
router.get('/pending-requests', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const requestsQuery = `
      SELECT 
        rr.*,
        u.email as requester_email,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name
      FROM reference_requests rr
      JOIN users u ON rr.requester_id = u.id
      WHERE rr.reference_giver_id = $1 AND rr.status = 'pending'
      ORDER BY rr.created_at DESC
    `;
    
    const result = await pool.query(requestsQuery, [userId]);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate AI reference letter for job application
router.post('/generate-reference-letter', authenticateToken, async (req: any, res: any) => {
  try {
    const {
      jobTitle,
      companyName,
      jobDescription,
      requiredSkills = [],
      jobType = 'industry'
    } = req.body;
    
    const userId = req.user.id;
    
    // Find relevant references based on job requirements
    const relevantReferencesQuery = `
      SELECT 
        rc.*,
        u.email as giver_email,
        u.first_name as giver_first_name,
        u.last_name as giver_last_name
      FROM reference_collections rc
      JOIN users u ON rc.reference_giver_id = u.id
      WHERE rc.user_id = $1
      AND (
        $2 = ANY(rc.skills_mentioned) OR
        rc.context_type = $3 OR
        rc.overall_rating >= 4
      )
      ORDER BY rc.overall_rating DESC, rc.created_at DESC
      LIMIT 5
    `;
    
    const references = await pool.query(relevantReferencesQuery, [
      userId, 
      requiredSkills.length > 0 ? requiredSkills[0] : null,
      jobType
    ]);
    
    if (references.rows.length === 0) {
      return res.status(404).json({ error: 'No relevant references found' });
    }
    
    // Generate AI reference letter
    const aiLetter = await generateAIReferenceLetter({
      jobTitle,
      companyName,
      jobDescription,
      requiredSkills,
      references: references.rows
    });
    
    // Save job application
    const applicationQuery = `
      INSERT INTO job_applications (
        user_id, job_title, company_name, job_description,
        required_skills, job_type, matched_references,
        ai_generated_letter, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const application = await pool.query(applicationQuery, [
      userId, jobTitle, companyName, jobDescription,
      requiredSkills, jobType, references.rows.map((r: any) => r.id),
      aiLetter.text, aiLetter.confidence
    ]);
    
    res.json({
      application: application.rows[0],
      matchedReferences: references.rows,
      aiGeneratedLetter: aiLetter.text,
      confidenceScore: aiLetter.confidence
    });
  } catch (error) {
    console.error('Error generating reference letter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's job applications
router.get('/applications', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const applicationsQuery = `
      SELECT * FROM job_applications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(applicationsQuery, [userId]);
    res.json({ applications: result.rows });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reference templates
router.get('/templates', async (req: any, res: any) => {
  try {
    const { contextType, jobType } = req.query;
    
    let query = 'SELECT * FROM reference_templates WHERE is_active = true';
    const params = [];
    
    if (contextType) {
      query += ` AND context_type = $1`;
      params.push(contextType);
    }
    
    if (jobType) {
      query += ` AND (job_type = $${params.length + 1} OR job_type IS NULL)`;
      params.push(jobType);
    }
    
    query += ' ORDER BY context_type, job_type';
    
    const result = await pool.query(query, params);
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Reference Letter Generation Function
async function generateAIReferenceLetter({ jobTitle, companyName, jobDescription, requiredSkills, references }: any) {
  try {
    // This would integrate with an AI service like OpenAI, Claude, or Gemini
    // For now, we'll create a simple template-based approach
    
    const template = `
To Whom It May Concern,

I am writing to recommend [USER_NAME] for the position of [JOB_TITLE] at [COMPANY_NAME]. Based on multiple professional interactions and collaborations, I can confidently attest to their qualifications and character.

[REFERENCE_SUMMARY]

Key Strengths:
[STRENGTHS_LIST]

Specific Examples:
[EXAMPLES_LIST]

I strongly recommend [USER_NAME] for this position and believe they would be a valuable addition to your team.

Sincerely,
[AI_GENERATED_SIGNATURE]
    `;
    
    // Extract key information from references
    const strengths = extractStrengths(references);
    const examples = extractExamples(references);
    const summary = generateSummary(references);
    
    // Replace placeholders
    let letter = template
      .replace('[USER_NAME]', 'the candidate')
      .replace('[JOB_TITLE]', jobTitle)
      .replace('[COMPANY_NAME]', companyName)
      .replace('[REFERENCE_SUMMARY]', summary)
      .replace('[STRENGTHS_LIST]', strengths)
      .replace('[EXAMPLES_LIST]', examples)
      .replace('[AI_GENERATED_SIGNATURE]', 'AI-Generated Reference Letter');
    
    // Calculate confidence score based on reference quality and quantity
    const confidence = calculateConfidenceScore(references);
    
    return {
      text: letter,
      confidence: confidence
    };
  } catch (error) {
    console.error('Error generating AI reference letter:', error);
    throw error;
  }
}

// Helper functions for AI letter generation
function extractStrengths(references: any[]) {
  const strengths = new Set();
  
  references.forEach(ref => {
    if (ref.skills_mentioned) {
      ref.skills_mentioned.forEach((skill: string) => strengths.add(skill));
    }
  });
  
  return Array.from(strengths).slice(0, 5).map(strength => 
    `• Excellent ${strength} skills`
  ).join('\n');
}

function extractExamples(references: any[]) {
  return references.slice(0, 3).map(ref => 
    `• ${ref.context_details}: "${ref.reference_text.substring(0, 100)}..."`
  ).join('\n');
}

function generateSummary(references: any[]) {
  const avgRating = references.reduce((sum, ref) => sum + ref.overall_rating, 0) / references.length;
  const contextTypes = [...new Set(references.map(ref => ref.context_type))];
  
  return `I have had the pleasure of working with this candidate in various capacities including ${contextTypes.join(', ')}. Their consistent high performance (average rating: ${avgRating.toFixed(1)}/5) and professional excellence make them an outstanding candidate.`;
}

function calculateConfidenceScore(references: any[]) {
  if (references.length === 0) return 0;
  
  const avgRating = references.reduce((sum, ref) => sum + ref.overall_rating, 0) / references.length;
  const verifiedCount = references.filter(ref => ref.is_verified).length;
  const verificationRate = verifiedCount / references.length;
  
  // Confidence based on rating, verification, and quantity
  const ratingScore = avgRating / 5; // 0-1
  const verificationScore = verificationRate; // 0-1
  const quantityScore = Math.min(references.length / 5, 1); // 0-1, max at 5 references
  
  return (ratingScore * 0.4 + verificationScore * 0.3 + quantityScore * 0.3);
}

export default router;
