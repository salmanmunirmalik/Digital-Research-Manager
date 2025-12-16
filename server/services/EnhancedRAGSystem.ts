/**
 * Enhanced RAG System
 * Task 15: Implement multi-source context retrieval with weighted scoring
 * 
 * Retrieves context from multiple sources with weighted relevance scoring
 */

import pool from "../../database/config.js";
import { UserContextRetriever } from './UserContextRetriever.js';
import { UserContext } from './UserContextRetriever.js';

export interface SourceWeight {
  sourceType: string;
  weight: number; // 0.0 to 1.0
  minRelevance?: number; // Minimum similarity score to include
}

export interface WeightedContextResult {
  source: string;
  content: string;
  relevanceScore: number;
  weightedScore: number;
  metadata: any;
}

export interface EnhancedContext {
  user: UserContext['user'];
  weightedResults: WeightedContextResult[];
  totalRelevance: number;
  sourcesUsed: string[];
}

export class EnhancedRAGSystem {
  // Default source weights (can be customized per user)
  private static defaultSourceWeights: SourceWeight[] = [
    { sourceType: 'user_ai_content', weight: 1.0, minRelevance: 0.3 },
    { sourceType: 'paper', weight: 0.9, minRelevance: 0.4 },
    { sourceType: 'lab_notebook_entry', weight: 0.8, minRelevance: 0.3 },
    { sourceType: 'protocol', weight: 0.7, minRelevance: 0.3 },
    { sourceType: 'experiment', weight: 0.8, minRelevance: 0.3 },
    { sourceType: 'research_data', weight: 0.7, minRelevance: 0.3 }
  ];

  /**
   * Retrieve enhanced context with weighted scoring
   * Task 15: Multi-source context retrieval with weighted scoring
   */
  static async retrieveEnhancedContext(
    userId: string,
    query: string,
    customWeights?: SourceWeight[],
    limit: number = 20
  ): Promise<EnhancedContext> {
    try {
      const weights = customWeights || this.defaultSourceWeights;
      const baseContext = await UserContextRetriever.retrieveContext(userId, query, limit * 2);

      // Build weighted results from all sources
      const weightedResults: WeightedContextResult[] = [];

      // 1. Process user_ai_content (semantic search results)
      if (baseContext.relevantContent && baseContext.relevantContent.length > 0) {
        const weight = weights.find(w => w.sourceType === 'user_ai_content')?.weight || 1.0;
        const minRelevance = weights.find(w => w.sourceType === 'user_ai_content')?.minRelevance || 0.3;

        baseContext.relevantContent
          .filter(item => item.similarity >= minRelevance)
          .forEach(item => {
            weightedResults.push({
              source: item.type,
              content: item.content,
              relevanceScore: item.similarity,
              weightedScore: item.similarity * weight,
              metadata: {
                id: item.id,
                title: item.title,
                type: item.type
              }
            });
          });
      }

      // 2. Process papers
      if (baseContext.papers && baseContext.papers.length > 0) {
        const weight = weights.find(w => w.sourceType === 'paper')?.weight || 0.9;
        baseContext.papers.forEach(paper => {
          const relevance = this.calculateRelevance(query, paper.abstract || paper.title || '');
          if (relevance >= (weights.find(w => w.sourceType === 'paper')?.minRelevance || 0.4)) {
            weightedResults.push({
              source: 'paper',
              content: paper.abstract || '',
              relevanceScore: relevance,
              weightedScore: relevance * weight,
              metadata: {
                id: paper.id,
                title: paper.title,
                journal: paper.journal,
                year: paper.year
              }
            });
          }
        });
      }

      // 3. Process Personal NoteBook entries
      if (baseContext.notebooks && baseContext.notebooks.length > 0) {
        const weight = weights.find(w => w.sourceType === 'lab_notebook_entry')?.weight || 0.8;
        baseContext.notebooks.forEach(notebook => {
          const content = [
            notebook.content,
            notebook.methodology,
            notebook.results,
            notebook.conclusions
          ].filter(Boolean).join('\n\n');
          
          const relevance = this.calculateRelevance(query, content);
          if (relevance >= (weights.find(w => w.sourceType === 'lab_notebook_entry')?.minRelevance || 0.3)) {
            weightedResults.push({
              source: 'lab_notebook_entry',
              content: content.substring(0, 500),
              relevanceScore: relevance,
              weightedScore: relevance * weight,
              metadata: {
                id: notebook.id,
                title: notebook.title
              }
            });
          }
        });
      }

      // 4. Process protocols
      if (baseContext.protocols && baseContext.protocols.length > 0) {
        const weight = weights.find(w => w.sourceType === 'protocol')?.weight || 0.7;
        baseContext.protocols.forEach(protocol => {
          const content = [protocol.description, protocol.content].filter(Boolean).join('\n\n');
          const relevance = this.calculateRelevance(query, content);
          if (relevance >= (weights.find(w => w.sourceType === 'protocol')?.minRelevance || 0.3)) {
            weightedResults.push({
              source: 'protocol',
              content: content.substring(0, 500),
              relevanceScore: relevance,
              weightedScore: relevance * weight,
              metadata: {
                id: protocol.id,
                title: protocol.title
              }
            });
          }
        });
      }

      // 5. Process experiments
      if (baseContext.experiments && baseContext.experiments.length > 0) {
        const weight = weights.find(w => w.sourceType === 'experiment')?.weight || 0.8;
        baseContext.experiments.forEach(experiment => {
          const content = [
            experiment.description,
            experiment.methodology,
            experiment.results
          ].filter(Boolean).join('\n\n');
          
          const relevance = this.calculateRelevance(query, content);
          if (relevance >= (weights.find(w => w.sourceType === 'experiment')?.minRelevance || 0.3)) {
            weightedResults.push({
              source: 'experiment',
              content: content.substring(0, 500),
              relevanceScore: relevance,
              weightedScore: relevance * weight,
              metadata: {
                id: experiment.id,
                title: experiment.title
              }
            });
          }
        });
      }

      // Sort by weighted score and limit results
      weightedResults.sort((a, b) => b.weightedScore - a.weightedScore);
      const topResults = weightedResults.slice(0, limit);

      // Calculate total relevance
      const totalRelevance = topResults.reduce((sum, result) => sum + result.weightedScore, 0) / topResults.length;

      // Get unique sources
      const sourcesUsed = [...new Set(topResults.map(r => r.source))];

      return {
        user: baseContext.user,
        weightedResults: topResults,
        totalRelevance,
        sourcesUsed
      };
    } catch (error) {
      console.error('Error retrieving enhanced context:', error);
      return {
        user: null,
        weightedResults: [],
        totalRelevance: 0,
        sourcesUsed: []
      };
    }
  }

  /**
   * Calculate simple relevance score (keyword-based)
   * Can be enhanced with semantic similarity
   */
  private static calculateRelevance(query: string, content: string): number {
    if (!query || !content) return 0;

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        matches++;
      }
    });

    // Normalize to 0-1 scale
    return Math.min(matches / queryWords.length, 1.0);
  }

  /**
   * Get user-specific source weights (from preferences)
   */
  static async getUserSourceWeights(userId: string): Promise<SourceWeight[]> {
    try {
      const result = await pool.query(
        `SELECT preference_value 
         FROM user_ai_preferences 
         WHERE user_id = $1 AND preference_type = 'source_weights'`,
        [userId]
      );

      if (result.rows.length > 0 && result.rows[0].preference_value) {
        return result.rows[0].preference_value as SourceWeight[];
      }

      return this.defaultSourceWeights;
    } catch (error) {
      console.error('Error getting user source weights:', error);
      return this.defaultSourceWeights;
    }
  }

  /**
   * Update user source weights based on feedback
   */
  static async updateUserSourceWeights(
    userId: string,
    weights: SourceWeight[]
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO user_ai_preferences (user_id, preference_type, preference_value, weight, last_updated)
         VALUES ($1, 'source_weights', $2, 1.0, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, preference_type)
         DO UPDATE SET 
           preference_value = EXCLUDED.preference_value,
           last_updated = CURRENT_TIMESTAMP`,
        [userId, JSON.stringify(weights)]
      );
    } catch (error) {
      console.error('Error updating user source weights:', error);
    }
  }
}

