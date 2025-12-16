/**
 * Protocol Comparison Service
 * Compares protocols to identify differences, missing steps, and troubleshooting insights
 */

import pool from '../../database/config.js';
import { AIProviderFactory } from './AIProviderFactory.js';
import { getApiForTask } from '../routes/apiTaskAssignments.js';

export interface ProtocolComparison {
  protocol1: any;
  protocol2: any;
  similarities: SimilarityMetric[];
  differences: Difference[];
  missingSteps: MissingStep[];
  missingMaterials: MissingMaterial[];
  recommendations: string[];
  troubleshooting: TroubleshootingInsight[];
  overallScore: number;
}

export interface SimilarityMetric {
  aspect: 'title' | 'objective' | 'materials' | 'equipment' | 'procedure' | 'safety';
  similarity: number; // 0-1
  details: string;
}

export interface Difference {
  type: 'step_order' | 'step_content' | 'material' | 'equipment' | 'duration' | 'safety';
  location: string;
  protocol1Value: any;
  protocol2Value: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
}

export interface MissingStep {
  step: any;
  inProtocol: '1' | '2';
  suggestedPosition: number;
  reason: string;
}

export interface MissingMaterial {
  material: string;
  inProtocol: '1' | '2';
  impact: string;
  alternative?: string;
}

export interface TroubleshootingInsight {
  issue: string;
  likelyCause: string;
  solution: string;
  relatedDifferences: string[];
  confidence: number;
}

export class ProtocolComparator {
  /**
   * Find similar protocols for comparison
   */
  static async findSimilarProtocols(
    protocolId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      // Get the target protocol
      const protocolResult = await pool.query(
        `SELECT * FROM protocols WHERE id = $1`,
        [protocolId]
      );

      if (protocolResult.rows.length === 0) {
        throw new Error('Protocol not found');
      }

      const targetProtocol = protocolResult.rows[0];

      // Find similar protocols by:
      // 1. Same category
      // 2. Similar title/description
      // 3. Similar tags
      // 4. High success rate
      const similarProtocols = await pool.query(
        `SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.username as creator_name,
          (
            -- Category match
            CASE WHEN p.category = $1 THEN 3 ELSE 0 END +
            -- Title similarity
            CASE WHEN p.title ILIKE $2 THEN 2 ELSE 0 END +
            -- Tag overlap
            (SELECT COUNT(*) FROM unnest(p.tags) tag 
             WHERE tag = ANY($3::text[])) * 1 +
            -- Success rate bonus
            CASE WHEN p.success_rate >= 80 THEN 2 ELSE 0 END
          ) as similarity_score
         FROM protocols p
         JOIN users u ON p.author_id = u.id
         WHERE p.id != $4
           AND p.is_approved = true
           AND (
             p.category = $1
             OR p.title ILIKE $2
             OR EXISTS (SELECT 1 FROM unnest(p.tags) tag WHERE tag = ANY($3::text[]))
           )
         ORDER BY similarity_score DESC, p.success_rate DESC, p.usage_count DESC
         LIMIT $5`,
        [
          targetProtocol.category,
          `%${targetProtocol.title.split(' ')[0]}%`,
          targetProtocol.tags || [],
          protocolId,
          limit
        ]
      );

      return similarProtocols.rows;
    } catch (error: any) {
      console.error('Error finding similar protocols:', error);
      throw new Error(`Failed to find similar protocols: ${error.message}`);
    }
  }

  /**
   * Compare two protocols in detail
   */
  static async compareProtocols(
    protocol1Id: string,
    protocol2Id: string,
    userId?: string
  ): Promise<ProtocolComparison> {
    try {
      // Fetch both protocols
      const [protocol1, protocol2] = await Promise.all([
        this.fetchProtocol(protocol1Id),
        this.fetchProtocol(protocol2Id)
      ]);

      // Calculate similarities
      const similarities = this.calculateSimilarities(protocol1, protocol2);

      // Find differences
      const differences = this.findDifferences(protocol1, protocol2);

      // Find missing steps
      const missingSteps = this.findMissingSteps(protocol1, protocol2);

      // Find missing materials
      const missingMaterials = this.findMissingMaterials(protocol1, protocol2);

      // Generate AI-powered recommendations and troubleshooting
      const { recommendations, troubleshooting } = await this.generateAIInsights(
        protocol1,
        protocol2,
        differences,
        missingSteps,
        missingMaterials,
        userId
      );

      // Calculate overall similarity score
      const overallScore = this.calculateOverallScore(similarities, differences);

      return {
        protocol1,
        protocol2,
        similarities,
        differences,
        missingSteps,
        missingMaterials,
        recommendations,
        troubleshooting,
        overallScore
      };
    } catch (error: any) {
      console.error('Error comparing protocols:', error);
      throw new Error(`Failed to compare protocols: ${error.message}`);
    }
  }

  /**
   * Fetch protocol with all details
   */
  private static async fetchProtocol(protocolId: string): Promise<any> {
    const result = await pool.query(
      `SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.username as creator_name,
        l.name as lab_name
       FROM protocols p
       JOIN users u ON p.author_id = u.id
       LEFT JOIN labs l ON p.lab_id = l.id
       WHERE p.id = $1`,
      [protocolId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    const protocol = result.rows[0];
    
    // Parse procedure if stored as JSON
    if (typeof protocol.content === 'string') {
      try {
        protocol.procedure = JSON.parse(protocol.content);
      } catch {
        protocol.procedure = [];
      }
    } else {
      protocol.procedure = protocol.content || [];
    }

    return protocol;
  }

  /**
   * Calculate similarity metrics
   */
  private static calculateSimilarities(protocol1: any, protocol2: any): SimilarityMetric[] {
    const similarities: SimilarityMetric[] = [];

    // Title similarity
    const titleSimilarity = this.calculateTextSimilarity(
      protocol1.title,
      protocol2.title
    );
    similarities.push({
      aspect: 'title',
      similarity: titleSimilarity,
      details: `Titles are ${(titleSimilarity * 100).toFixed(0)}% similar`
    });

    // Objective similarity
    const objectiveSimilarity = this.calculateTextSimilarity(
      protocol1.objective || protocol1.description,
      protocol2.objective || protocol2.description
    );
    similarities.push({
      aspect: 'objective',
      similarity: objectiveSimilarity,
      details: `Objectives are ${(objectiveSimilarity * 100).toFixed(0)}% similar`
    });

    // Materials similarity
    const materials1 = this.extractMaterials(protocol1);
    const materials2 = this.extractMaterials(protocol2);
    const materialsSimilarity = this.calculateSetSimilarity(materials1, materials2);
    similarities.push({
      aspect: 'materials',
      similarity: materialsSimilarity,
      details: `${this.getCommonItems(materials1, materials2).length} common materials out of ${Math.max(materials1.length, materials2.length)}`
    });

    // Equipment similarity
    const equipment1 = this.extractEquipment(protocol1);
    const equipment2 = this.extractEquipment(protocol2);
    const equipmentSimilarity = this.calculateSetSimilarity(equipment1, equipment2);
    similarities.push({
      aspect: 'equipment',
      similarity: equipmentSimilarity,
      details: `${this.getCommonItems(equipment1, equipment2).length} common equipment out of ${Math.max(equipment1.length, equipment2.length)}`
    });

    // Procedure similarity
    const procedureSimilarity = this.calculateProcedureSimilarity(
      protocol1.procedure || [],
      protocol2.procedure || []
    );
    similarities.push({
      aspect: 'procedure',
      similarity: procedureSimilarity,
      details: `Procedures have ${(procedureSimilarity * 100).toFixed(0)}% similarity`
    });

    // Safety notes similarity
    const safety1 = this.extractSafetyNotes(protocol1);
    const safety2 = this.extractSafetyNotes(protocol2);
    const safetySimilarity = this.calculateSetSimilarity(safety1, safety2);
    similarities.push({
      aspect: 'safety',
      similarity: safetySimilarity,
      details: `${this.getCommonItems(safety1, safety2).length} common safety notes`
    });

    return similarities;
  }

  /**
   * Find differences between protocols
   */
  private static findDifferences(protocol1: any, protocol2: any): Difference[] {
    const differences: Difference[] = [];

    // Compare step order and content
    const steps1 = protocol1.procedure || [];
    const steps2 = protocol2.procedure || [];

    // Find step order differences
    const maxSteps = Math.max(steps1.length, steps2.length);
    for (let i = 0; i < maxSteps; i++) {
      const step1 = steps1[i];
      const step2 = steps2[i];

      if (!step1 && step2) {
        differences.push({
          type: 'step_content',
          location: `Step ${i + 1}`,
          protocol1Value: null,
          protocol2Value: step2.title,
          severity: 'high',
          impact: `Protocol 2 has an additional step: "${step2.title}"`
        });
      } else if (step1 && !step2) {
        differences.push({
          type: 'step_content',
          location: `Step ${i + 1}`,
          protocol1Value: step1.title,
          protocol2Value: null,
          severity: 'high',
          impact: `Protocol 1 has an additional step: "${step1.title}"`
        });
      } else if (step1 && step2) {
        // Compare step content
        const stepSimilarity = this.calculateTextSimilarity(
          step1.description || '',
          step2.description || ''
        );

        if (stepSimilarity < 0.7) {
          differences.push({
            type: 'step_content',
            location: `Step ${i + 1}: ${step1.title}`,
            protocol1Value: step1.description?.substring(0, 100),
            protocol2Value: step2.description?.substring(0, 100),
            severity: stepSimilarity < 0.3 ? 'high' : 'medium',
            impact: `Step descriptions differ significantly (${(stepSimilarity * 100).toFixed(0)}% similar)`
          });
        }

        // Compare durations
        if (Math.abs((step1.duration || 0) - (step2.duration || 0)) > 5) {
          differences.push({
            type: 'duration',
            location: `Step ${i + 1}: ${step1.title}`,
            protocol1Value: `${step1.duration || 0} minutes`,
            protocol2Value: `${step2.duration || 0} minutes`,
            severity: 'low',
            impact: `Duration difference may affect timing`
          });
        }
      }
    }

    // Compare materials
    const materials1 = this.extractMaterials(protocol1);
    const materials2 = this.extractMaterials(protocol2);
    const uniqueMaterials1 = materials1.filter(m => !materials2.includes(m));
    const uniqueMaterials2 = materials2.filter(m => !materials1.includes(m));

    uniqueMaterials1.forEach(material => {
      differences.push({
        type: 'material',
        location: 'Materials list',
        protocol1Value: material,
        protocol2Value: null,
        severity: 'medium',
        impact: `Protocol 1 uses "${material}" which is not in Protocol 2`
      });
    });

    uniqueMaterials2.forEach(material => {
      differences.push({
        type: 'material',
        location: 'Materials list',
        protocol1Value: null,
        protocol2Value: material,
        severity: 'medium',
        impact: `Protocol 2 uses "${material}" which is not in Protocol 1`
      });
    });

    // Compare equipment
    const equipment1 = this.extractEquipment(protocol1);
    const equipment2 = this.extractEquipment(protocol2);
    const uniqueEquipment1 = equipment1.filter(e => !equipment2.includes(e));
    const uniqueEquipment2 = equipment2.filter(e => !equipment1.includes(e));

    uniqueEquipment1.forEach(eq => {
      differences.push({
        type: 'equipment',
        location: 'Equipment list',
        protocol1Value: eq,
        protocol2Value: null,
        severity: 'high',
        impact: `Protocol 1 requires "${eq}" which is not in Protocol 2`
      });
    });

    uniqueEquipment2.forEach(eq => {
      differences.push({
        type: 'equipment',
        location: 'Equipment list',
        protocol1Value: null,
        protocol2Value: eq,
        severity: 'high',
        impact: `Protocol 2 requires "${eq}" which is not in Protocol 1`
      });
    });

    return differences;
  }

  /**
   * Find missing steps
   */
  private static findMissingSteps(protocol1: any, protocol2: any): MissingStep[] {
    const missing: MissingStep[] = [];
    const steps1 = protocol1.procedure || [];
    const steps2 = protocol2.procedure || [];

    // Find steps in protocol2 that are not in protocol1
    steps2.forEach((step2: any, idx2: number) => {
      const similarStep = steps1.find((step1: any) => 
        this.calculateTextSimilarity(step1.title, step2.title) > 0.6 ||
        this.calculateTextSimilarity(step1.description || '', step2.description || '') > 0.6
      );

      if (!similarStep) {
        missing.push({
          step: step2,
          inProtocol: '2',
          suggestedPosition: idx2 + 1,
          reason: `This step is present in Protocol 2 but missing in Protocol 1. It may be important for success.`
        });
      }
    });

    // Find steps in protocol1 that are not in protocol2
    steps1.forEach((step1: any, idx1: number) => {
      const similarStep = steps2.find((step2: any) => 
        this.calculateTextSimilarity(step1.title, step2.title) > 0.6 ||
        this.calculateTextSimilarity(step1.description || '', step2.description || '') > 0.6
      );

      if (!similarStep) {
        missing.push({
          step: step1,
          inProtocol: '1',
          suggestedPosition: idx1 + 1,
          reason: `This step is present in Protocol 1 but missing in Protocol 2. Consider if it's necessary.`
        });
      }
    });

    return missing;
  }

  /**
   * Find missing materials
   */
  private static findMissingMaterials(protocol1: any, protocol2: any): MissingMaterial[] {
    const missing: MissingMaterial[] = [];
    const materials1 = this.extractMaterials(protocol1);
    const materials2 = this.extractMaterials(protocol2);

    materials2.forEach(material => {
      if (!materials1.includes(material)) {
        missing.push({
          material,
          inProtocol: '2',
          impact: `Missing "${material}" may cause protocol failure`,
          alternative: this.findAlternative(material, materials1)
        });
      }
    });

    materials1.forEach(material => {
      if (!materials2.includes(material)) {
        missing.push({
          material,
          inProtocol: '1',
          impact: `Your protocol uses "${material}" which others don't. Verify if it's necessary.`,
          alternative: this.findAlternative(material, materials2)
        });
      }
    });

    return missing;
  }

  /**
   * Generate AI-powered insights
   */
  private static async generateAIInsights(
    protocol1: any,
    protocol2: any,
    differences: Difference[],
    missingSteps: MissingStep[],
    missingMaterials: MissingMaterial[],
    userId?: string
  ): Promise<{ recommendations: string[]; troubleshooting: TroubleshootingInsight[] }> {
    try {
      if (!userId) {
        return {
          recommendations: this.generateBasicRecommendations(differences, missingSteps, missingMaterials),
          troubleshooting: []
        };
      }

      // Get AI API assignment
      const apiAssignment = await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          recommendations: this.generateBasicRecommendations(differences, missingSteps, missingMaterials),
          troubleshooting: []
        };
      }

      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);

      const prompt = `You are an expert research protocol analyst. Analyze these two protocols and provide insights:

PROTOCOL 1: ${protocol1.title}
- Steps: ${(protocol1.procedure || []).length}
- Success Rate: ${protocol1.success_rate || 0}%
- Usage Count: ${protocol1.usage_count || 0}

PROTOCOL 2: ${protocol2.title}
- Steps: ${(protocol2.procedure || []).length}
- Success Rate: ${protocol2.success_rate || 0}%
- Usage Count: ${protocol2.usage_count || 0}

KEY DIFFERENCES:
${differences.map(d => `- ${d.type}: ${d.impact}`).join('\n')}

MISSING STEPS:
${missingSteps.map(s => `- ${s.step.title} (in Protocol ${s.inProtocol})`).join('\n')}

MISSING MATERIALS:
${missingMaterials.map(m => `- ${m.material} (in Protocol ${m.inProtocol})`).join('\n')}

Provide:
1. 3-5 specific recommendations for improving Protocol 1
2. Troubleshooting insights for common issues that might occur due to these differences

Format as JSON:
{
  "recommendations": ["rec1", "rec2", ...],
  "troubleshooting": [
    {
      "issue": "issue description",
      "likelyCause": "cause",
      "solution": "solution",
      "relatedDifferences": ["diff1", "diff2"],
      "confidence": 0.8
    }
  ]
}`;

      const messages = [
        { role: 'system' as const, content: 'You are an expert research protocol analyst. Provide detailed, actionable insights.' },
        { role: 'user' as const, content: prompt }
      ];

      const response = await aiProvider.chat(messages, {
        apiKey: apiAssignment.apiKey,
        temperature: 0.7,
        maxTokens: 2000
      });

      const responseText = typeof response === 'string' ? response : (response as any).content || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          recommendations: parsed.recommendations || [],
          troubleshooting: parsed.troubleshooting || []
        };
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }

    return {
      recommendations: this.generateBasicRecommendations(differences, missingSteps, missingMaterials),
      troubleshooting: []
    };
  }

  /**
   * Generate basic recommendations without AI
   */
  private static generateBasicRecommendations(
    differences: Difference[],
    missingSteps: MissingStep[],
    missingMaterials: MissingMaterial[]
  ): string[] {
    const recommendations: string[] = [];

    if (missingSteps.length > 0) {
      recommendations.push(`Consider adding ${missingSteps.length} missing step(s) that are present in the compared protocol`);
    }

    if (missingMaterials.length > 0) {
      recommendations.push(`Review ${missingMaterials.length} material(s) that differ between protocols`);
    }

    const criticalDifferences = differences.filter(d => d.severity === 'critical' || d.severity === 'high');
    if (criticalDifferences.length > 0) {
      recommendations.push(`Address ${criticalDifferences.length} critical difference(s) that may affect protocol success`);
    }

    const equipmentDifferences = differences.filter(d => d.type === 'equipment');
    if (equipmentDifferences.length > 0) {
      recommendations.push(`Verify equipment requirements - ${equipmentDifferences.length} equipment difference(s) found`);
    }

    return recommendations;
  }

  /**
   * Calculate overall similarity score
   */
  private static calculateOverallScore(
    similarities: SimilarityMetric[],
    differences: Difference[]
  ): number {
    const avgSimilarity = similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length;
    const differencePenalty = Math.min(differences.length * 0.05, 0.3);
    return Math.max(0, Math.min(1, avgSimilarity - differencePenalty));
  }

  // Helper methods
  private static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  private static calculateSetSimilarity(set1: string[], set2: string[]): number {
    if (set1.length === 0 && set2.length === 0) return 1;
    const common = this.getCommonItems(set1, set2).length;
    const total = new Set([...set1, ...set2]).size;
    return total > 0 ? common / total : 0;
  }

  private static getCommonItems(set1: string[], set2: string[]): string[] {
    return set1.filter(item => set2.includes(item));
  }

  private static extractMaterials(protocol: any): string[] {
    if (Array.isArray(protocol.materials)) {
      return protocol.materials.map((m: any) => 
        typeof m === 'string' ? m : m.name || m
      );
    }
    return [];
  }

  private static extractEquipment(protocol: any): string[] {
    if (Array.isArray(protocol.equipment)) {
      return protocol.equipment.map((e: any) => 
        typeof e === 'string' ? e : e.name || e
      );
    }
    return [];
  }

  private static extractSafetyNotes(protocol: any): string[] {
    if (Array.isArray(protocol.safety_notes)) {
      return protocol.safety_notes;
    }
    if (typeof protocol.safety_notes === 'string') {
      return protocol.safety_notes.split('\n').filter((s: string) => s.trim());
    }
    return [];
  }

  private static calculateProcedureSimilarity(procedure1: any[], procedure2: any[]): number {
    if (procedure1.length === 0 && procedure2.length === 0) return 1;
    if (procedure1.length === 0 || procedure2.length === 0) return 0;

    let totalSimilarity = 0;
    const maxLength = Math.max(procedure1.length, procedure2.length);

    for (let i = 0; i < maxLength; i++) {
      const step1 = procedure1[i];
      const step2 = procedure2[i];

      if (step1 && step2) {
        const titleSim = this.calculateTextSimilarity(step1.title || '', step2.title || '');
        const descSim = this.calculateTextSimilarity(step1.description || '', step2.description || '');
        totalSimilarity += (titleSim + descSim) / 2;
      }
    }

    return totalSimilarity / maxLength;
  }

  private static findAlternative(material: string, availableMaterials: string[]): string | undefined {
    // Simple keyword matching for alternatives
    const keywords = material.toLowerCase().split(/\s+/);
    return availableMaterials.find(m => 
      keywords.some(k => m.toLowerCase().includes(k))
    );
  }
}

