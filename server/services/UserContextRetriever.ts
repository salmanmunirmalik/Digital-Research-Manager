/**
 * User Context Retriever - Enhanced
 * Task 75: Create UserContextRetriever for AI context
 * 
 * Retrieves relevant user profile content for AI context using semantic search
 */

import pool from "../../database/config.js";
import { AIProviderFactory } from './AIProviderFactory.js';
// Cosine similarity function (moved from aiResearchAgent)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export interface UserContext {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    current_institution?: string;
    research_interests?: string[];
  } | null;
  papers: any[];
  notebooks: any[];
  protocols: any[];
  experiments: any[];
  relevantContent: Array<{
    type: string;
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>;
}

export class UserContextRetriever {
  /**
   * Retrieve user context with semantic search
   * @param userId User ID
   * @param query Search query
   * @param limit Maximum number of results
   * @returns User context with relevant content
   */
  static async retrieveContext(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<UserContext> {
    try {
      // Get basic user info
      const userResult = await pool.query(
        `SELECT 
          id, 
          first_name, 
          last_name, 
          current_institution, 
          research_interests 
        FROM users 
        WHERE id = $1`,
        [userId]
      );
      
      const user = userResult.rows[0] || null;
      
      // Generate embedding for query
      const queryEmbedding = await this.generateQueryEmbedding(query, userId);
      
      // Retrieve relevant content using semantic search
      const relevantContent = queryEmbedding
        ? await this.semanticSearch(userId, queryEmbedding, limit)
        : await this.keywordSearch(userId, query, limit);
      
      // Get user's recent papers
      const papers = await this.getRecentPapers(userId, 10);
      
      // Get user's recent Personal NoteBook entries
      const notebooks = await this.getRecentNotebooks(userId, 10);
      
      // Get user's protocols
      const protocols = await this.getRecentProtocols(userId, 10);
      
      // Get user's experiments
      const experiments = await this.getRecentExperiments(userId, 10);
      
      return {
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          current_institution: user.current_institution,
          research_interests: user.research_interests || []
        } : null,
        papers,
        notebooks,
        protocols,
        experiments,
        relevantContent: relevantContent.filter(c => c.similarity > 0.3) // Only highly relevant
      };
    } catch (error) {
      console.error('Error retrieving user context:', error);
      return {
        user: null,
        papers: [],
        notebooks: [],
        protocols: [],
        experiments: [],
        relevantContent: []
      };
    }
  }
  
  /**
   * Generate embedding for query
   */
  private static async generateQueryEmbedding(
    query: string,
    userId?: string
  ): Promise<number[] | null> {
    try {
      // Get user's default embedding provider
      const { getUserDefaultProvider, getApiKeyWithFallback, getPlatformGeminiKey } = await import('../routes/aiProviderKeys.js');
      
      let provider = 'google_gemini';
      let apiKey: string | null = null;
      
      if (userId) {
        try {
          provider = await getUserDefaultProvider(userId, 'embedding') || 'google_gemini';
          apiKey = await getApiKeyWithFallback(userId, provider, true);
        } catch (error) {
          console.log('Using platform default embedding provider (Gemini)');
          apiKey = getPlatformGeminiKey();
        }
      } else {
        // No user ID, use platform Gemini key
        apiKey = getPlatformGeminiKey();
      }
      
      if (!apiKey) {
        return null;
      }
      
      const aiProvider = AIProviderFactory.createProvider(provider, apiKey);
      
      if (!aiProvider.supportsEmbeddings()) {
        return null;
      }
      
      const embeddingResponse = await aiProvider.embed(query);
      return embeddingResponse.embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      return null;
    }
  }
  
  /**
   * Semantic search using embeddings
   */
  private static async semanticSearch(
    userId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<Array<{ type: string; id: string; title: string; content: string; similarity: number }>> {
    try {
      // Get all processed content with embeddings
      const result = await pool.query(
        `SELECT 
          id,
          source_type,
          source_id,
          title,
          content,
          embedding
        FROM user_ai_content
        WHERE user_id = $1 
          AND processed = true
          AND embedding IS NOT NULL
        LIMIT 100`,
        [userId]
      );
      
      // Calculate cosine similarity for each result
      const similarities = result.rows
        .map(row => {
          try {
            let storedEmbedding: number[];
            
            if (typeof row.embedding === 'string') {
              storedEmbedding = JSON.parse(row.embedding);
            } else if (Array.isArray(row.embedding)) {
              storedEmbedding = row.embedding;
            } else {
              return null;
            }
            
            const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);
            
            return {
              type: row.source_type,
              id: row.source_id,
              title: row.title || 'Untitled',
              content: row.content?.substring(0, 500) || '',
              similarity
            };
          } catch (error) {
            return null;
          }
        })
        .filter((item): item is any => item !== null && item.similarity > 0.3);
      
      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }
  
  /**
   * Keyword search fallback
   */
  private static async keywordSearch(
    userId: string,
    query: string,
    limit: number
  ): Promise<Array<{ type: string; id: string; title: string; content: string; similarity: number }>> {
    try {
      const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      
      const result = await pool.query(
        `SELECT 
          id,
          source_type,
          source_id,
          title,
          content,
          keywords
        FROM user_ai_content
        WHERE user_id = $1 
          AND processed = true
          AND (
            LOWER(title) LIKE ANY(ARRAY[${keywords.map((_, i) => `$${i + 2}`).join(', ')}])
            OR keywords && ARRAY[${keywords.map((_, i) => `$${keywords.length + i + 2}`).join(', ')}]
          )
        LIMIT $1`,
        [limit, ...keywords.map(k => `%${k}%`), ...keywords]
      );
      
      return result.rows.map(row => ({
        type: row.source_type,
        id: row.source_id,
        title: row.title || 'Untitled',
        content: row.content?.substring(0, 500) || '',
        similarity: 0.5 // Default similarity for keyword matches
      }));
    } catch (error) {
      console.error('Error in keyword search:', error);
      return [];
    }
  }
  
  /**
   * Get recent papers
   */
  private static async getRecentPapers(userId: string, limit: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, title, abstract, journal, year 
         FROM papers 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching papers:', error);
      return [];
    }
  }
  
  /**
   * Get recent Personal NoteBook entries
   */
  private static async getRecentNotebooks(userId: string, limit: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, title, content, methodology, results, conclusions
         FROM lab_notebook_entries 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching notebooks:', error);
      return [];
    }
  }
  
  /**
   * Get recent protocols
   */
  private static async getRecentProtocols(userId: string, limit: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, title, description, content
         FROM protocols 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching protocols:', error);
      return [];
    }
  }
  
  /**
   * Get recent experiments
   */
  private static async getRecentExperiments(userId: string, limit: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, title, description, status, results
         FROM experiments 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching experiments:', error);
      return [];
    }
  }
}

