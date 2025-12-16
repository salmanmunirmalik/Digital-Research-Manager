/**
 * AI Protocol Generator Service
 * Automatically generates protocols when they're not found in the database
 * Uses AI to create complete, structured protocols from user queries
 */

import { AIProviderFactory } from './AIProviderFactory.js';
import { getApiForTask } from '../routes/apiTaskAssignments.js';
import pool from '../../database/config.js';

export interface ProtocolGenerationRequest {
  query: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  userId: string;
  context?: {
    labEquipment?: string[];
    availableMaterials?: string[];
    previousProtocols?: string[];
  };
}

export interface GeneratedProtocol {
  title: string;
  description: string;
  category: string;
  objective: string;
  background: string;
  materials: Array<{
    name: string;
    quantity: string;
    unit: string;
    concentration?: string;
    supplier?: string;
    catalog_number?: string;
    storage_conditions?: string;
  }>;
  equipment: Array<{
    name: string;
    model?: string;
    calibration_required: boolean;
    maintenance_schedule?: string;
  }>;
  safety_notes: string[];
  procedure: Array<{
    id: number;
    title: string;
    description: string;
    duration: number;
    critical: boolean;
    materials_needed?: Array<{ name: string; quantity: string; unit: string }>;
    warnings?: string[];
    tips?: string[];
  }>;
  expected_results: string;
  troubleshooting: Array<{ issue: string; solution: string }>;
  references: string[];
  tags: string[];
  estimated_duration: number;
  difficulty_level: string;
}

export class ProtocolAIGenerator {
  /**
   * Generate a protocol using AI when not found in database
   */
  static async generateProtocol(request: ProtocolGenerationRequest): Promise<GeneratedProtocol> {
    try {
      // Get AI API assignment
      const apiAssignment = await getApiForTask(request.userId, 'content_writing');
      
      if (!apiAssignment) {
        throw new Error('No AI API configured for protocol generation');
      }

      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);

      // Create detailed prompt for protocol generation
      const prompt = this.buildGenerationPrompt(request);

      // Generate protocol using AI
      const messages = [
        { role: 'system' as const, content: 'You are an expert research protocol writer. Generate complete, professional experimental protocols in JSON format.' },
        { role: 'user' as const, content: prompt }
      ];
      
      const response = await aiProvider.chat(messages, {
        apiKey: apiAssignment.apiKey,
        temperature: 0.7,
        maxTokens: 4000
      });
      
      const responseText = typeof response === 'string' ? response : (response as any).content || JSON.stringify(response);

      // Parse AI response into structured protocol
      const protocol = this.parseAIResponse(responseText, request);

      // Save generated protocol to database
      const savedProtocol = await this.saveGeneratedProtocol(protocol, request.userId);

      return savedProtocol;
    } catch (error: any) {
      console.error('Error generating protocol:', error);
      throw new Error(`Failed to generate protocol: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for AI protocol generation
   * Enhanced with user context awareness
   */
  private static async buildGenerationPrompt(request: ProtocolGenerationRequest): Promise<string> {
    const { query, category, difficulty, context, userId } = request;

    // Get user's research context for better personalization
    const userContext = await this.getUserContext(userId);

    let prompt = `You are an expert research protocol writer. Generate a complete, professional experimental protocol based on the following request:

REQUEST: "${query}"

REQUIREMENTS:
- Create a detailed, step-by-step protocol that can be followed in a research laboratory
- Include all necessary materials with quantities, suppliers, and catalog numbers where applicable
- List all required equipment with specifications
- Provide clear safety notes and warnings
- Include expected results and troubleshooting guide
- Add relevant scientific references
- Make it suitable for ${difficulty || 'intermediate'} level researchers

`;

    // Add user's research interests for context
    if (userContext.researchInterests && userContext.researchInterests.length > 0) {
      prompt += `USER'S RESEARCH INTERESTS: ${userContext.researchInterests.join(', ')}\n`;
    }

    // Add user's previous protocols for consistency
    if (userContext.previousProtocols && userContext.previousProtocols.length > 0) {
      prompt += `USER'S PREVIOUS PROTOCOLS (for style consistency): ${userContext.previousProtocols.slice(0, 3).join(', ')}\n`;
    }

    // Add lab equipment context
    if (context?.labEquipment && context.labEquipment.length > 0) {
      prompt += `AVAILABLE EQUIPMENT: ${context.labEquipment.join(', ')}\n`;
    } else if (userContext.labEquipment && userContext.labEquipment.length > 0) {
      prompt += `AVAILABLE EQUIPMENT (from user's lab): ${userContext.labEquipment.slice(0, 10).join(', ')}\n`;
    }

    // Add available materials context
    if (context?.availableMaterials && context.availableMaterials.length > 0) {
      prompt += `AVAILABLE MATERIALS: ${context.availableMaterials.join(', ')}\n`;
    } else if (userContext.availableMaterials && userContext.availableMaterials.length > 0) {
      prompt += `AVAILABLE MATERIALS (from user's inventory): ${userContext.availableMaterials.slice(0, 10).join(', ')}\n`;
    }

    prompt += `
OUTPUT FORMAT (JSON):
{
  "title": "Protocol title",
  "description": "Brief description",
  "category": "${category || 'General'}",
  "objective": "What this protocol accomplishes",
  "background": "Scientific background and rationale",
  "materials": [
    {
      "name": "Material name",
      "quantity": "amount",
      "unit": "unit",
      "concentration": "if applicable",
      "supplier": "supplier name",
      "catalog_number": "catalog #",
      "storage_conditions": "storage info"
    }
  ],
  "equipment": [
    {
      "name": "Equipment name",
      "model": "model if applicable",
      "calibration_required": true/false,
      "maintenance_schedule": "schedule"
    }
  ],
  "safety_notes": ["safety note 1", "safety note 2"],
  "procedure": [
    {
      "id": 1,
      "title": "Step title",
      "description": "Detailed step description",
      "duration": 15,
      "critical": true/false,
      "materials_needed": [{"name": "material", "quantity": "qty", "unit": "unit"}],
      "warnings": ["warning if any"],
      "tips": ["tip if any"]
    }
  ],
  "expected_results": "What researchers should expect to see",
  "troubleshooting": [
    {"issue": "common issue", "solution": "solution"}
  ],
  "references": ["reference 1", "reference 2"],
  "tags": ["tag1", "tag2"],
  "estimated_duration": 120,
  "difficulty_level": "${difficulty || 'intermediate'}"
}

Generate the protocol now:`;

    return prompt;
  }

  /**
   * Get user context for personalized protocol generation
   */
  private static async getUserContext(userId: string): Promise<{
    researchInterests: string[];
    previousProtocols: string[];
    labEquipment: string[];
    availableMaterials: string[];
  }> {
    try {
      // Get user's research interests
      const userResult = await pool.query(
        `SELECT research_interests FROM users WHERE id = $1`,
        [userId]
      );
      const researchInterests = userResult.rows[0]?.research_interests || [];

      // Get user's previous protocols
      const protocolsResult = await pool.query(
        `SELECT title FROM protocols WHERE author_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );
      const previousProtocols = protocolsResult.rows.map((r: any) => r.title);

      // Get lab equipment (from user's lab)
      const labResult = await pool.query(
        `SELECT l.id FROM labs l
         JOIN lab_members lm ON lm.lab_id = l.id
         WHERE lm.user_id = $1 LIMIT 1`,
        [userId]
      );
      let labEquipment: string[] = [];
      let availableMaterials: string[] = [];

      if (labResult.rows.length > 0) {
        const labId = labResult.rows[0].id;

        // Get instruments
        const instrumentsResult = await pool.query(
          `SELECT name FROM instruments WHERE lab_id = $1`,
          [labId]
        );
        labEquipment = instrumentsResult.rows.map((r: any) => r.name);

        // Get inventory items
        const inventoryResult = await pool.query(
          `SELECT name FROM inventory_items WHERE lab_id = $1 AND quantity > 0 LIMIT 20`,
          [labId]
        );
        availableMaterials = inventoryResult.rows.map((r: any) => r.name);
      }

      return {
        researchInterests,
        previousProtocols,
        labEquipment,
        availableMaterials
      };
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        researchInterests: [],
        previousProtocols: [],
        labEquipment: [],
        availableMaterials: []
      };
    }
  }

  /**
   * Parse AI response into structured protocol
   */
  private static parseAIResponse(response: string, request: ProtocolGenerationRequest): GeneratedProtocol {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndNormalizeProtocol(parsed, request);
      }

      // If no JSON found, try to parse as structured text
      return this.parseTextResponse(response, request);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback: create a basic protocol structure
      return this.createFallbackProtocol(request);
    }
  }

  /**
   * Validate and normalize parsed protocol
   */
  private static validateAndNormalizeProtocol(parsed: any, request: ProtocolGenerationRequest): GeneratedProtocol {
    return {
      title: parsed.title || request.query,
      description: parsed.description || `AI-generated protocol for ${request.query}`,
      category: parsed.category || request.category || 'General',
      objective: parsed.objective || `Perform ${request.query}`,
      background: parsed.background || `This protocol enables ${request.query} in a laboratory setting.`,
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      equipment: Array.isArray(parsed.equipment) ? parsed.equipment : [],
      safety_notes: Array.isArray(parsed.safety_notes) ? parsed.safety_notes : ['Follow standard laboratory safety procedures'],
      procedure: Array.isArray(parsed.procedure) 
        ? parsed.procedure.map((step: any, idx: number) => ({
            id: step.id || idx + 1,
            title: step.title || `Step ${idx + 1}`,
            description: step.description || '',
            duration: step.duration || 15,
            critical: step.critical || false,
            materials_needed: step.materials_needed || [],
            warnings: step.warnings || [],
            tips: step.tips || []
          }))
        : [],
      expected_results: parsed.expected_results || 'Successful completion of the protocol',
      troubleshooting: Array.isArray(parsed.troubleshooting) ? parsed.troubleshooting : [],
      references: Array.isArray(parsed.references) ? parsed.references : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : request.query.toLowerCase().split(' '),
      estimated_duration: parsed.estimated_duration || parsed.procedure?.reduce((acc: number, s: any) => acc + (s.duration || 15), 0) || 60,
      difficulty_level: parsed.difficulty_level || request.difficulty || 'intermediate'
    };
  }

  /**
   * Parse text-based response (fallback)
   */
  private static parseTextResponse(response: string, request: ProtocolGenerationRequest): GeneratedProtocol {
    // Simple text parsing - extract key sections
    const lines = response.split('\n').filter(l => l.trim());
    
    return {
      title: request.query,
      description: `AI-generated protocol for ${request.query}`,
      category: request.category || 'General',
      objective: `Perform ${request.query}`,
      background: `This protocol enables ${request.query} in a laboratory setting.`,
      materials: [],
      equipment: [],
      safety_notes: ['Follow standard laboratory safety procedures'],
      procedure: lines
        .filter(l => /^\d+\.|step/i.test(l))
        .map((line, idx) => ({
          id: idx + 1,
          title: `Step ${idx + 1}`,
          description: line.replace(/^\d+\.\s*/i, '').trim(),
          duration: 15,
          critical: false,
          materials_needed: [],
          warnings: [],
          tips: []
        })),
      expected_results: 'Successful completion of the protocol',
      troubleshooting: [],
      references: [],
      tags: request.query.toLowerCase().split(' '),
      estimated_duration: 60,
      difficulty_level: request.difficulty || 'intermediate'
    };
  }

  /**
   * Create fallback protocol if parsing fails
   */
  private static createFallbackProtocol(request: ProtocolGenerationRequest): GeneratedProtocol {
    return {
      title: request.query,
      description: `AI-generated protocol for ${request.query}`,
      category: request.category || 'General',
      objective: `Perform ${request.query}`,
      background: `This protocol enables ${request.query} in a laboratory setting.`,
      materials: [],
      equipment: [],
      safety_notes: ['Follow standard laboratory safety procedures'],
      procedure: [
        {
          id: 1,
          title: 'Preparation',
          description: `Prepare for ${request.query}`,
          duration: 15,
          critical: true,
          materials_needed: [],
          warnings: [],
          tips: []
        }
      ],
      expected_results: 'Successful completion of the protocol',
      troubleshooting: [],
      references: [],
      tags: request.query.toLowerCase().split(' '),
      estimated_duration: 60,
      difficulty_level: request.difficulty || 'intermediate'
    };
  }

  /**
   * Save generated protocol to database
   */
  private static async saveGeneratedProtocol(
    protocol: GeneratedProtocol,
    userId: string
  ): Promise<GeneratedProtocol> {
    try {
      // Get user's lab_id
      const userResult = await pool.query(
        'SELECT lab_id FROM users WHERE id = $1',
        [userId]
      );
      const labId = userResult.rows[0]?.lab_id || null;

      // Insert protocol
      const result = await pool.query(
        `INSERT INTO protocols (
          title, description, category, version, author_id, lab_id,
          content, materials, equipment, safety_notes, tags, privacy_level,
          is_approved, difficulty_level, estimated_duration, objective
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          protocol.title,
          protocol.description,
          protocol.category,
          '1.0',
          userId,
          labId,
          JSON.stringify(protocol.procedure),
          protocol.materials.map(m => `${m.name} - ${m.quantity} ${m.unit}`),
          protocol.equipment.map(e => e.name),
          protocol.safety_notes.join('\n'),
          protocol.tags,
          'personal',
          true,
          protocol.difficulty_level,
          protocol.estimated_duration,
          protocol.objective
        ]
      );

      return protocol;
    } catch (error) {
      console.error('Error saving generated protocol:', error);
      // Return protocol even if save fails
      return protocol;
    }
  }

  /**
   * Check if protocol exists, generate if not
   */
  static async getOrGenerateProtocol(
    query: string,
    userId: string,
    options?: {
      category?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      generateIfNotFound?: boolean;
    }
  ): Promise<{ protocol: any; wasGenerated: boolean }> {
    // First, try to find existing protocol
    const searchResult = await pool.query(
      `SELECT * FROM protocols 
       WHERE (title ILIKE $1 OR description ILIKE $1 OR tags @> $2)
       AND is_approved = true
       ORDER BY usage_count DESC, created_at DESC
       LIMIT 1`,
      [`%${query}%`, [query.toLowerCase()]]
    );

    if (searchResult.rows.length > 0) {
      return {
        protocol: searchResult.rows[0],
        wasGenerated: false
      };
    }

    // If not found and generation is enabled, generate it
    if (options?.generateIfNotFound !== false) {
      const generated = await this.generateProtocol({
        query,
        category: options?.category,
        difficulty: options?.difficulty,
        userId
      });

      return {
        protocol: generated,
        wasGenerated: true
      };
    }

    throw new Error('Protocol not found and generation disabled');
  }
}

