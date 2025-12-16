/**
 * Continuous Learning Engine
 * Task 20: Implement ContinuousLearningEngine
 * 
 * Automatically learns from user interactions, content updates, and AI responses
 * to continuously improve AI context and personalization
 */

import pool from "../../database/config.js";
import { UserAIContentProcessor } from './UserAIContentProcessor.js';
import { UserContextRetriever } from './UserContextRetriever.js';

export interface LearningEvent {
  type: 'content_created' | 'content_updated' | 'interaction' | 'feedback' | 'failure';
  userId: string;
  sourceType: string;
  sourceId: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LearningResult {
  success: boolean;
  contentProcessed: boolean;
  embeddingUpdated: boolean;
  contextEnriched: boolean;
  error?: string;
}

export class ContinuousLearningEngine {
  /**
   * Process a learning event
   */
  static async processLearningEvent(event: LearningEvent): Promise<LearningResult> {
    try {
      let contentProcessed = false;
      let embeddingUpdated = false;
      let contextEnriched = false;

      switch (event.type) {
        case 'content_created':
        case 'content_updated':
          // Process content for AI-ready format
          const content = this.extractContentFromEvent(event);
          if (content && content.length > 50) {
            await UserAIContentProcessor.processContent(
              event.userId,
              event.sourceType,
              event.sourceId,
              content.title || 'Untitled',
              content.text,
              { ...event.metadata, timestamp: event.timestamp }
            );
            contentProcessed = true;
            embeddingUpdated = true;
          }
          break;

        case 'interaction':
          // Learn from user interactions (queries, responses)
          await this.learnFromInteraction(event);
          contextEnriched = true;
          break;

        case 'feedback':
          // Learn from user feedback (positive/negative)
          await this.learnFromFeedback(event);
          contextEnriched = true;
          break;

        case 'failure':
          // Learn from failures (Task 21)
          await this.learnFromFailure(event);
          contextEnriched = true;
          break;
      }

      // Update learning statistics
      await this.updateLearningStats(event.userId, event.type);

      return {
        success: true,
        contentProcessed,
        embeddingUpdated,
        contextEnriched
      };
    } catch (error: any) {
      console.error('Error processing learning event:', error);
      return {
        success: false,
        contentProcessed: false,
        embeddingUpdated: false,
        contextEnriched: false,
        error: error.message
      };
    }
  }

  /**
   * Extract content from learning event
   */
  private static extractContentFromEvent(event: LearningEvent): { title: string; text: string } | null {
    const data = event.data;

    switch (event.sourceType) {
      case 'lab_notebook_entry':
        return {
          title: data.title || 'Personal NoteBook Entry',
          text: [
            data.objectives,
            data.methodology,
            data.results,
            data.conclusions
          ].filter(Boolean).join('\n\n')
        };

      case 'protocol':
        return {
          title: data.title || 'Protocol',
          text: [data.description, data.content].filter(Boolean).join('\n\n')
        };

      case 'paper':
        return {
          title: data.title || 'Paper',
          text: [data.abstract, data.ai_summary].filter(Boolean).join('\n\n')
        };

      case 'experiment':
        return {
          title: data.title || 'Experiment',
          text: [data.description, data.methodology, data.results].filter(Boolean).join('\n\n')
        };

      case 'research_data':
        return {
          title: data.title || 'Research Data',
          text: [data.description, data.methodology, data.results].filter(Boolean).join('\n\n')
        };

      default:
        return data.title && data.content
          ? { title: data.title, text: data.content }
          : null;
    }
  }

  /**
   * Learn from user interactions
   */
  private static async learnFromInteraction(event: LearningEvent): Promise<void> {
    try {
      const { query, response, context } = event.data;

      // Store interaction pattern
      await pool.query(
        `INSERT INTO user_ai_interactions (
          user_id, query, response, context, interaction_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING`,
        [
          event.userId,
          query,
          response,
          JSON.stringify(context),
          event.sourceType,
          event.timestamp
        ]
      );

      // Extract key topics from interaction
      if (query && query.length > 20) {
        await this.extractAndStoreTopics(event.userId, query, 'query');
      }
    } catch (error) {
      console.error('Error learning from interaction:', error);
    }
  }

  /**
   * Learn from user feedback (Task 22: User model update)
   */
  private static async learnFromFeedback(event: LearningEvent): Promise<void> {
    try {
      const { feedback, rating, context } = event.data;

      // Store feedback
      await pool.query(
        `INSERT INTO user_ai_feedback (
          user_id, feedback_type, rating, feedback_text, context, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          event.userId,
          feedback || 'general',
          rating || 0,
          event.data.feedback || '',
          JSON.stringify(context),
          event.timestamp
        ]
      );

      // Update user preferences based on feedback
      if (rating !== undefined) {
        await this.updateUserPreferences(event.userId, rating, context);
      }
    } catch (error) {
      console.error('Error learning from feedback:', error);
    }
  }

  /**
   * Learn from failures (Task 21: Failure learning mechanism)
   */
  private static async learnFromFailure(event: LearningEvent): Promise<void> {
    try {
      const { error, task, context, correction } = event.data;

      // Store failure pattern
      await pool.query(
        `INSERT INTO user_ai_failures (
          user_id, task_type, error_message, context, correction, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          event.userId,
          task || event.sourceType,
          error || 'Unknown error',
          JSON.stringify(context),
          correction || null,
          event.timestamp
        ]
      );

      // Update failure patterns to avoid repeating mistakes
      await this.updateFailurePatterns(event.userId, task, error, correction);
    } catch (error) {
      console.error('Error learning from failure:', error);
    }
  }

  /**
   * Extract and store topics from text
   */
  private static async extractAndStoreTopics(
    userId: string,
    text: string,
    source: string
  ): Promise<void> {
    try {
      // Simple keyword extraction (can be enhanced with NLP)
      const keywords = text
        .toLowerCase()
        .match(/\b[a-z]{4,}\b/g)
        ?.filter(word => !['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would'].includes(word))
        .slice(0, 10) || [];

      if (keywords.length > 0) {
        await pool.query(
          `INSERT INTO user_ai_topics (user_id, topic, source, frequency, last_seen)
           VALUES ${keywords.map((_, i) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, 1, $${i * 4 + 4})`).join(', ')}
           ON CONFLICT (user_id, topic) 
           DO UPDATE SET frequency = user_ai_topics.frequency + 1, last_seen = EXCLUDED.last_seen`,
          [userId, ...keywords.flatMap(k => [k, source, new Date()])]
        );
      }
    } catch (error) {
      console.error('Error extracting topics:', error);
    }
  }

  /**
   * Update user preferences based on feedback
   */
  private static async updateUserPreferences(
    userId: string,
    rating: number,
    context: any
  ): Promise<void> {
    try {
      // Update preference weights based on feedback
      if (rating >= 4) {
        // Positive feedback - reinforce preferences
        await pool.query(
          `UPDATE user_ai_preferences 
           SET weight = LEAST(weight + 0.1, 1.0), last_updated = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND preference_type = $2`,
          [userId, context?.preferenceType || 'general']
        );
      } else if (rating <= 2) {
        // Negative feedback - adjust preferences
        await pool.query(
          `UPDATE user_ai_preferences 
           SET weight = GREATEST(weight - 0.1, 0.0), last_updated = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND preference_type = $2`,
          [userId, context?.preferenceType || 'general']
        );
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Update failure patterns to avoid repeating mistakes
   */
  private static async updateFailurePatterns(
    userId: string,
    task: string,
    error: string,
    correction?: string
  ): Promise<void> {
    try {
      // Store failure pattern
      await pool.query(
        `INSERT INTO user_ai_failure_patterns (
          user_id, task_type, error_pattern, correction, occurrence_count, last_occurrence
        ) VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, task_type, error_pattern)
        DO UPDATE SET 
          occurrence_count = user_ai_failure_patterns.occurrence_count + 1,
          last_occurrence = CURRENT_TIMESTAMP,
          correction = COALESCE(EXCLUDED.correction, user_ai_failure_patterns.correction)`,
        [userId, task, error.substring(0, 200), correction]
      );
    } catch (error) {
      console.error('Error updating failure patterns:', error);
    }
  }

  /**
   * Update learning statistics
   */
  private static async updateLearningStats(
    userId: string,
    eventType: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO user_ai_learning_stats (
          user_id, event_type, count, last_updated
        ) VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, event_type)
        DO UPDATE SET 
          count = user_ai_learning_stats.count + 1,
          last_updated = CURRENT_TIMESTAMP`,
        [userId, eventType]
      );
    } catch (error) {
      console.error('Error updating learning stats:', error);
    }
  }

  /**
   * Get user learning summary
   */
  static async getUserLearningSummary(userId: string): Promise<any> {
    try {
      const [stats, topics, failures] = await Promise.all([
        pool.query(
          `SELECT event_type, count, last_updated 
           FROM user_ai_learning_stats 
           WHERE user_id = $1`,
          [userId]
        ),
        pool.query(
          `SELECT topic, frequency, last_seen 
           FROM user_ai_topics 
           WHERE user_id = $1 
           ORDER BY frequency DESC 
           LIMIT 20`,
          [userId]
        ),
        pool.query(
          `SELECT task_type, error_pattern, occurrence_count 
           FROM user_ai_failure_patterns 
           WHERE user_id = $1 
           ORDER BY occurrence_count DESC 
           LIMIT 10`,
          [userId]
        )
      ]);

      return {
        stats: stats.rows,
        topTopics: topics.rows,
        commonFailures: failures.rows
      };
    } catch (error) {
      console.error('Error getting learning summary:', error);
      return { stats: [], topTopics: [], commonFailures: [] };
    }
  }

  /**
   * Trigger real-time content update (Task 16)
   */
  static async updateContentInRealTime(
    userId: string,
    sourceType: string,
    sourceId: string,
    content: any
  ): Promise<void> {
    try {
      // Process immediately (not in background)
      const extracted = this.extractContentFromEvent({
        type: 'content_updated',
        userId,
        sourceType,
        sourceId,
        data: content,
        timestamp: new Date()
      });

      if (extracted && extracted.text.length > 50) {
        await UserAIContentProcessor.processContent(
          userId,
          sourceType,
          sourceId,
          extracted.title,
          extracted.text,
          {}
        );

        console.log(`✅ Real-time update: ${sourceType} ${sourceId}`);
      }
    } catch (error) {
      console.error('Error in real-time content update:', error);
    }
  }
}

