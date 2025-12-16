/**
 * AI Protocol Generation API Routes
 * Handles AI-powered protocol generation and management
 */

import { Router } from 'express';
import { ProtocolAIGenerator } from '../services/ProtocolAIGenerator.js';
import pool from '../../database/config.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

/**
 * Generate protocol using AI
 * POST /api/protocol-ai/generate
 */
router.post('/generate', authenticateToken, async (req: any, res) => {
  try {
    const { query, category, difficulty, context } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Protocol query is required' });
    }

    // Check if protocol already exists
    const existing = await pool.query(
      `SELECT * FROM protocols 
       WHERE (title ILIKE $1 OR description ILIKE $1)
       AND is_approved = true
       LIMIT 1`,
      [`%${query}%`]
    );

    if (existing.rows.length > 0) {
      return res.json({
        protocol: existing.rows[0],
        wasGenerated: false,
        message: 'Found existing protocol'
      });
    }

    // Generate new protocol
    try {
      const generated = await ProtocolAIGenerator.generateProtocol({
        query,
        category,
        difficulty,
        userId: req.user.id,
        context
      });

      res.json({
        protocol: generated,
        wasGenerated: true,
        message: 'Protocol generated successfully'
      });
    } catch (genError: any) {
      // If AI generation fails (e.g., no API key), create a basic protocol structure
      if (genError.message?.includes('No AI API configured') || genError.message?.includes('API')) {
        console.log('AI generation not available, creating basic protocol structure');
        
        // Create a basic protocol structure without AI
        const basicProtocol = {
          title: query,
          description: `Protocol for ${query}`,
          category: category || 'General',
          objective: `Perform ${query}`,
          background: `This protocol enables ${query} in a laboratory setting.`,
          materials: [],
          equipment: [],
          safety_notes: ['Follow standard laboratory safety procedures'],
          procedure: [
            {
              id: 1,
              title: 'Preparation',
              description: `Prepare all materials and equipment needed for ${query}`,
              duration: 15,
              critical: true,
              materials_needed: [],
              warnings: [],
              tips: []
            },
            {
              id: 2,
              title: 'Execution',
              description: `Follow the standard procedure for ${query}`,
              duration: 30,
              critical: true,
              materials_needed: [],
              warnings: [],
              tips: []
            },
            {
              id: 3,
              title: 'Completion',
              description: `Complete and document the results of ${query}`,
              duration: 15,
              critical: false,
              materials_needed: [],
              warnings: [],
              tips: []
            }
          ],
          expected_results: 'Successful completion of the protocol',
          troubleshooting: [],
          references: [],
          tags: query.toLowerCase().split(' '),
          estimated_duration: 60,
          difficulty_level: difficulty || 'intermediate'
        };

        // Try to save to database
        try {
          const userResult = await pool.query(
            'SELECT lab_id FROM users WHERE id = $1',
            [req.user.id]
          );
          const labId = userResult.rows[0]?.lab_id || null;

          const result = await pool.query(
            `INSERT INTO protocols (
              title, description, category, version, author_id, lab_id,
              content, materials, equipment, safety_notes, tags, privacy_level,
              is_approved, difficulty_level, estimated_duration, objective
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
              basicProtocol.title,
              basicProtocol.description,
              basicProtocol.category,
              '1.0',
              req.user.id,
              labId,
              JSON.stringify(basicProtocol.procedure),
              basicProtocol.materials.map((m: any) => typeof m === 'string' ? m : `${m.name} - ${m.quantity} ${m.unit}`),
              basicProtocol.equipment.map((e: any) => typeof e === 'string' ? e : e.name),
              basicProtocol.safety_notes.join('\n'),
              basicProtocol.tags,
              'personal',
              true,
              basicProtocol.difficulty_level,
              basicProtocol.estimated_duration,
              basicProtocol.objective
            ]
          );

          res.json({
            protocol: { ...basicProtocol, id: result.rows[0].id },
            wasGenerated: true,
            message: 'Basic protocol created. Configure AI API keys in Settings for enhanced generation.',
            aiAvailable: false
          });
        } catch (saveError: any) {
          // Even if save fails, return the basic protocol
          res.json({
            protocol: basicProtocol,
            wasGenerated: true,
            message: 'Basic protocol structure created. Configure AI API keys in Settings for enhanced generation.',
            aiAvailable: false
          });
        }
      } else {
        throw genError;
      }
    }
  } catch (error: any) {
    console.error('Error generating protocol:', error);
    res.status(500).json({ 
      error: 'Failed to generate protocol', 
      details: error.message,
      suggestion: 'Please configure AI API keys in Settings → API Management for full AI generation capabilities.'
    });
  }
});

/**
 * Get or generate protocol (smart retrieval)
 * POST /api/protocol-ai/get-or-generate
 */
router.post('/get-or-generate', authenticateToken, async (req: any, res) => {
  try {
    const { query, category, difficulty, generateIfNotFound = true } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Protocol query is required' });
    }

    try {
      const result = await ProtocolAIGenerator.getOrGenerateProtocol(
        query,
        req.user.id,
        { category, difficulty, generateIfNotFound }
      );

      res.json(result);
    } catch (genError: any) {
      // If generation fails due to missing API, try to find existing or create basic
      if (genError.message?.includes('No AI API configured') || genError.message?.includes('API') || genError.message?.includes('generation disabled')) {
        // Try to find existing protocol first
        const existing = await pool.query(
          `SELECT * FROM protocols 
           WHERE (title ILIKE $1 OR description ILIKE $1 OR tags @> $2)
           AND is_approved = true
           ORDER BY usage_count DESC, created_at DESC
           LIMIT 1`,
          [`%${query}%`, [query.toLowerCase()]]
        );

        if (existing.rows.length > 0) {
          return res.json({
            protocol: existing.rows[0],
            wasGenerated: false,
            message: 'Found existing protocol'
          });
        }

        // Create basic protocol structure
        const basicProtocol = {
          title: query,
          description: `Protocol for ${query}`,
          category: category || 'General',
          objective: `Perform ${query}`,
          background: `This protocol enables ${query} in a laboratory setting.`,
          materials: [],
          equipment: [],
          safety_notes: ['Follow standard laboratory safety procedures'],
          procedure: [
            {
              id: 1,
              title: 'Preparation',
              description: `Prepare all materials and equipment needed for ${query}`,
              duration: 15,
              critical: true,
              materials_needed: [],
              warnings: [],
              tips: []
            },
            {
              id: 2,
              title: 'Execution',
              description: `Follow the standard procedure for ${query}`,
              duration: 30,
              critical: true,
              materials_needed: [],
              warnings: [],
              tips: []
            }
          ],
          expected_results: 'Successful completion of the protocol',
          troubleshooting: [],
          references: [],
          tags: query.toLowerCase().split(' '),
          estimated_duration: 60,
          difficulty_level: difficulty || 'intermediate'
        };

        res.json({
          protocol: basicProtocol,
          wasGenerated: true,
          message: 'Basic protocol structure created. Configure AI API keys in Settings for enhanced generation.',
          aiAvailable: false
        });
      } else {
        throw genError;
      }
    }
  } catch (error: any) {
    console.error('Error in get-or-generate:', error);
    res.status(500).json({ 
      error: 'Failed to get or generate protocol', 
      details: error.message,
      suggestion: 'Please configure AI API keys in Settings → API Management for full AI generation capabilities.'
    });
  }
});

/**
 * Enhance existing protocol with AI
 * POST /api/protocol-ai/:id/enhance
 */
router.post('/:id/enhance', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { enhancements } = req.body; // e.g., ['add_troubleshooting', 'improve_safety', 'add_references']

    // Get existing protocol
    const protocol = await pool.query(
      'SELECT * FROM protocols WHERE id = $1',
      [id]
    );

    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // TODO: Implement AI enhancement logic
    // This would use AI to enhance specific aspects of the protocol

    res.json({
      message: 'Protocol enhancement feature coming soon',
      protocol: protocol.rows[0]
    });
  } catch (error: any) {
    console.error('Error enhancing protocol:', error);
    res.status(500).json({ 
      error: 'Failed to enhance protocol', 
      details: error.message 
    });
  }
});

/**
 * Get AI-generated protocols for user
 * GET /api/protocol-ai/my-generated
 */
router.get('/my-generated', authenticateToken, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM protocols 
       WHERE author_id = $1 
       AND title ILIKE '%AI-generated%' OR description ILIKE '%AI-generated%'
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      protocols: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching generated protocols:', error);
    res.status(500).json({ 
      error: 'Failed to fetch generated protocols', 
      details: error.message 
    });
  }
});

export default router;

