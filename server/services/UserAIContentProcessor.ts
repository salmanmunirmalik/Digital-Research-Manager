/**
 * User AI Content Processor
 * Task 57: Create User Profile AI-Ready Content System
 * 
 * Processes user content (papers, notebooks, protocols) into AI-ready format
 * with embeddings, summaries, and structured metadata
 */

import pool from "../../database/config.js";
import { AIProviderFactory } from './AIProviderFactory.js';
import { getUserDefaultProvider, getUserApiKey, getApiKeyWithFallback, getPlatformGeminiKey } from '../routes/aiProviderKeys.js';

export interface ProcessedContent {
  id: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  summary?: string;
  keywords: string[];
  embedding: number[];
  metadata: any;
}

export class UserAIContentProcessor {
  /**
   * Process content into AI-ready format
   * @param userId User ID
   * @param sourceType Type of content ('paper', 'notebook', 'protocol', 'experiment')
   * @param sourceId ID of the source record
   * @param title Content title
   * @param content Content text
   * @param metadata Additional metadata
   */
  static async processContent(
    userId: string,
    sourceType: string,
    sourceId: string,
    title: string,
    content: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      // Check if already processed
      const existing = await pool.query(
        `SELECT id, processed FROM user_ai_content 
         WHERE user_id = $1 AND source_type = $2 AND source_id = $3`,
        [userId, sourceType, sourceId]
      );
      
      if (existing.rows.length > 0 && existing.rows[0].processed) {
        // Update if content changed
        await this.updateContent(existing.rows[0].id, title, content, metadata);
        return;
      }
      
      // Generate summary
      const summary = await this.generateSummary(content, userId);
      
      // Extract keywords
      const keywords = await this.extractKeywords(content, title, userId);
      
      // Generate embedding
      const embedding = await this.generateEmbedding(content, userId);
      
      // Store processed content
      if (existing.rows.length > 0) {
        // Update existing
        await pool.query(
          `UPDATE user_ai_content SET
            title = $1,
            content = $2,
            summary = $3,
            keywords = $4,
            embedding = $5::vector,
            embedding_model = $6,
            embedding_provider = $7,
            metadata = $8,
            processed = true,
            processed_at = CURRENT_TIMESTAMP,
            last_updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [
            title,
            content,
            summary,
            keywords,
            JSON.stringify(embedding),
            metadata.embeddingModel || 'text-embedding-3-small',
            metadata.embeddingProvider || 'openai',
            JSON.stringify(metadata),
            existing.rows[0].id
          ]
        );
      } else {
        // Insert new
        await pool.query(
          `INSERT INTO user_ai_content (
            user_id, source_type, source_id, title, content, summary, 
            keywords, embedding, embedding_model, embedding_provider, metadata, processed, processed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9, $10, $11, true, CURRENT_TIMESTAMP)`,
          [
            userId,
            sourceType,
            sourceId,
            title,
            content,
            summary,
            keywords,
            JSON.stringify(embedding),
            metadata.embeddingModel || 'text-embedding-3-small',
            metadata.embeddingProvider || 'openai',
            JSON.stringify(metadata)
          ]
        );
      }
      
      console.log(`✅ Processed ${sourceType} content for user ${userId}`);
    } catch (error) {
      console.error(`Error processing content for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate summary of content
   */
  private static async generateSummary(
    content: string,
    userId: string
  ): Promise<string | null> {
    try {
      // Get user's default provider for content writing (default to Gemini for basic features)
      const provider = await getUserDefaultProvider(userId, 'chat') || 'google_gemini';
      const apiKey = await getApiKeyWithFallback(userId, provider, true);
      
      if (!apiKey) return null;
      
      const aiProvider = AIProviderFactory.createProvider(provider, apiKey);
      
      const summaryPrompt = `Summarize the following research content in 2-3 sentences:\n\n${content.substring(0, 2000)}`;
      
      const response = await aiProvider.chat([
        { role: 'user', content: summaryPrompt }
      ], { apiKey: apiKey, maxTokens: 200 });
      
      return response.content;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }
  
  /**
   * Extract keywords from content
   */
  private static async extractKeywords(
    content: string,
    title: string,
    userId: string
  ): Promise<string[]> {
    try {
      // Simple keyword extraction (can be enhanced with NLP)
      const text = `${title} ${content}`.toLowerCase();
      
      // Common research keywords
      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
      
      // Extract words (3+ characters, not common words)
      const words = text.match(/\b[a-z]{3,}\b/g) || [];
      const wordFreq: Record<string, number> = {};
      
      words.forEach(word => {
        if (!commonWords.has(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      
      // Get top 10 keywords
      return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
    } catch (error) {
      console.error('Error extracting keywords:', error);
      return [];
    }
  }
  
  /**
   * Generate embedding for content
   */
  private static async generateEmbedding(
    content: string,
    userId: string
  ): Promise<number[]> {
    try {
      // Get user's default embedding provider (default to Gemini for basic features)
      const provider = await getUserDefaultProvider(userId, 'embedding') || 'google_gemini';
      const apiKey = await getApiKeyWithFallback(userId, provider, true);
      
      if (!apiKey) {
        throw new Error('No API key available for embeddings');
      }
      
      const aiProvider = AIProviderFactory.createProvider(provider, apiKey);
      
      if (!aiProvider.supportsEmbeddings()) {
        throw new Error(`Provider ${provider} does not support embeddings`);
      }
      
      const embeddingResponse = await aiProvider.embed(content);
      return embeddingResponse.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }
  
  /**
   * Update existing content
   */
  private static async updateContent(
    contentId: string,
    title: string,
    content: string,
    metadata: any
  ): Promise<void> {
    try {
      // Regenerate summary and embedding if content changed significantly
      const summary = await this.generateSummary(content, metadata.userId || '');
      const embedding = await this.generateEmbedding(content, metadata.userId || '');
      const keywords = await this.extractKeywords(content, title, metadata.userId || '');
      
      await pool.query(
        `UPDATE user_ai_content SET
          title = $1,
          content = $2,
          summary = $3,
          keywords = $4,
          embedding = $5::vector,
          last_updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [
          title,
          content,
          summary,
          keywords,
          JSON.stringify(embedding),
          contentId
        ]
      );
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }
  
  /**
   * Process all user content (batch processing)
   */
  static async processAllUserContent(userId: string): Promise<void> {
    try {
      // Process papers
      const papers = await pool.query(
        'SELECT id, title, abstract FROM papers WHERE user_id = $1',
        [userId]
      );
      
      for (const paper of papers.rows) {
        await this.processContent(
          userId,
          'paper',
          paper.id,
          paper.title || 'Untitled Paper',
          paper.abstract || '',
          { journal: paper.journal, year: paper.year }
        );
      }
      
      // Process notebooks
      const notebooks = await pool.query(
        'SELECT id, title, content FROM lab_notebook_entries WHERE user_id = $1',
        [userId]
      );
      
      for (const notebook of notebooks.rows) {
        await this.processContent(
          userId,
          'notebook',
          notebook.id,
          notebook.title || 'Untitled Entry',
          notebook.content || '',
          {}
        );
      }
      
      // Process protocols
      const protocols = await pool.query(
        'SELECT id, title, description, content FROM protocols WHERE user_id = $1',
        [userId]
      );
      
      for (const protocol of protocols.rows) {
        await this.processContent(
          userId,
          'protocol',
          protocol.id,
          protocol.title || 'Untitled Protocol',
          `${protocol.description || ''} ${protocol.content || ''}`,
          {}
        );
      }
      
      console.log(`✅ Processed all content for user ${userId}`);
    } catch (error) {
      console.error(`Error processing all content for user ${userId}:`, error);
      throw error;
    }
  }
}

