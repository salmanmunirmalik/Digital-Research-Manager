/**
 * RecommendationEngine - Core recommendation system
 * 
 * Provides base functionality for generating personalized recommendations
 * using collaborative filtering, content-based filtering, and hybrid approaches.
 */

import pool from '../../../database/config.js';

export interface RecommendationContext {
  currentItemId?: string;
  currentItemType?: string;
  userActivity?: string[];
  filters?: Record<string, any>;
  limit?: number;
}

export interface Recommendation {
  itemId: string;
  itemType: string;
  score: number;
  reason: string;
  algorithm: string;
  metadata?: Record<string, any>;
}

export interface UserBehaviorEvent {
  userId: string;
  eventType: string;
  itemType: string;
  itemId: string;
  metadata?: Record<string, any>;
}

export class RecommendationEngine {
  /**
   * Track user behavior event
   */
  static async trackEvent(event: UserBehaviorEvent): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO user_behavior_events 
         (user_id, event_type, item_type, item_id, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          event.userId,
          event.eventType,
          event.itemType,
          event.itemId,
          JSON.stringify(event.metadata || {})
        ]
      );
    } catch (error) {
      console.error('Error tracking user behavior event:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  }

  /**
   * Get user's interaction history
   */
  static async getUserInteractions(
    userId: string,
    itemType?: string,
    eventTypes?: string[],
    limit: number = 100
  ): Promise<any[]> {
    try {
      let query = `
        SELECT event_type, item_type, item_id, metadata, created_at
        FROM user_behavior_events
        WHERE user_id = $1
      `;
      const params: any[] = [userId];
      let paramIndex = 2;

      if (itemType) {
        query += ` AND item_type = $${paramIndex}`;
        params.push(itemType);
        paramIndex++;
      }

      if (eventTypes && eventTypes.length > 0) {
        query += ` AND event_type = ANY($${paramIndex})`;
        params.push(eventTypes);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting user interactions:', error);
      return [];
    }
  }

  /**
   * Store recommendation for user
   */
  static async storeRecommendation(
    userId: string,
    recommendation: Recommendation,
    position?: number
  ): Promise<string> {
    try {
      const result = await pool.query(
        `INSERT INTO user_recommendations 
         (user_id, item_type, item_id, recommendation_score, recommendation_reason, 
          algorithm_used, context, position, shown_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          userId,
          recommendation.itemType,
          recommendation.itemId,
          recommendation.score,
          recommendation.reason,
          recommendation.algorithm,
          JSON.stringify(recommendation.metadata || {}),
          position
        ]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error('Error storing recommendation:', error);
      throw error;
    }
  }

  /**
   * Record recommendation feedback
   */
  static async recordFeedback(
    recommendationId: string,
    feedback: 'positive' | 'negative' | 'neutral' | 'dismissed',
    clicked: boolean = false,
    notes?: string
  ): Promise<void> {
    try {
      await pool.query(
        `UPDATE user_recommendations 
         SET feedback = $1, 
             clicked_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE clicked_at END,
             feedback_notes = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [feedback, clicked, notes || null, recommendationId]
      );
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }

  /**
   * Get items similar to a given item (collaborative filtering)
   */
  static async getSimilarItems(
    itemType: string,
    itemId: string,
    limit: number = 10,
    minSimilarity: number = 0.1
  ): Promise<Array<{ itemId: string; similarity: number }>> {
    try {
      const result = await pool.query(
        `SELECT 
          CASE 
            WHEN item_id_1 = $2 THEN item_id_2 
            ELSE item_id_1 
          END as item_id,
          similarity_score as similarity
        FROM item_similarities
        WHERE item_type = $1 
          AND (item_id_1 = $2 OR item_id_2 = $2)
          AND similarity_score >= $3
        ORDER BY similarity_score DESC
        LIMIT $4`,
        [itemType, itemId, minSimilarity, limit]
      );

      return result.rows.map(row => ({
        itemId: row.item_id,
        similarity: parseFloat(row.similarity)
      }));
    } catch (error) {
      console.error('Error getting similar items:', error);
      return [];
    }
  }

  /**
   * Calculate and store item similarities (for collaborative filtering)
   * This is typically run as a background job
   */
  static async calculateItemSimilarities(
    itemType: string,
    minCommonUsers: number = 3
  ): Promise<void> {
    try {
      // Get all items of this type
      const itemsResult = await pool.query(
        `SELECT DISTINCT item_id 
         FROM user_behavior_events 
         WHERE item_type = $1`,
        [itemType]
      );

      const items = itemsResult.rows.map(row => row.item_id);
      console.log(`Calculating similarities for ${items.length} ${itemType} items...`);

      // For each pair of items, calculate similarity
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const item1 = items[i];
          const item2 = items[j];

          // Get users who interacted with both items
          const commonUsersResult = await pool.query(
            `SELECT DISTINCT user_id
             FROM user_behavior_events
             WHERE item_type = $1 AND item_id = $2
             INTERSECT
             SELECT DISTINCT user_id
             FROM user_behavior_events
             WHERE item_type = $1 AND item_id = $3`,
            [itemType, item1, item2]
          );

          const commonUsers = commonUsersResult.rows.length;

          if (commonUsers >= minCommonUsers) {
            // Calculate Jaccard similarity (simple but effective)
            const similarity = this.calculateJaccardSimilarity(
              itemType,
              item1,
              item2,
              commonUsers
            );

            if (similarity > 0.1) {
              // Store similarity (upsert)
              await pool.query(
                `INSERT INTO item_similarities 
                 (item_type, item_id_1, item_id_2, similarity_score, calculation_method, 
                  sample_size, last_calculated)
                 VALUES ($1, $2, $3, $4, 'jaccard', $5, CURRENT_TIMESTAMP)
                 ON CONFLICT (item_type, item_id_1, item_id_2) 
                 DO UPDATE SET 
                   similarity_score = EXCLUDED.similarity_score,
                   last_calculated = EXCLUDED.last_calculated,
                   sample_size = EXCLUDED.sample_size`,
                [itemType, item1, item2, similarity, commonUsers]
              );
            }
          }
        }
      }

      console.log(`Similarity calculation complete for ${itemType}`);
    } catch (error) {
      console.error('Error calculating item similarities:', error);
      throw error;
    }
  }

  /**
   * Calculate Jaccard similarity between two items
   * Jaccard = |A ∩ B| / |A ∪ B|
   */
  private static async calculateJaccardSimilarity(
    itemType: string,
    itemId1: string,
    itemId2: string,
    commonUsers: number
  ): Promise<number> {
    try {
      // Get total unique users for each item
      const item1UsersResult = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM user_behavior_events
         WHERE item_type = $1 AND item_id = $2`,
        [itemType, itemId1]
      );

      const item2UsersResult = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM user_behavior_events
         WHERE item_type = $1 AND item_id = $2`,
        [itemType, itemId2]
      );

      const item1Users = parseInt(item1UsersResult.rows[0].count);
      const item2Users = parseInt(item2UsersResult.rows[0].count);
      const unionUsers = item1Users + item2Users - commonUsers;

      if (unionUsers === 0) return 0;

      return commonUsers / unionUsers;
    } catch (error) {
      console.error('Error calculating Jaccard similarity:', error);
      return 0;
    }
  }

  /**
   * Get popular items (fallback when no user history)
   */
  static async getPopularItems(
    itemType: string,
    limit: number = 10,
    timeWindow?: number // days
  ): Promise<Array<{ itemId: string; popularity: number }>> {
    try {
      let query = `
        SELECT item_id, COUNT(*) as popularity
        FROM user_behavior_events
        WHERE item_type = $1
      `;
      const params: any[] = [itemType];

      if (timeWindow) {
        query += ` AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${timeWindow} days'`;
      }

      query += `
        GROUP BY item_id
        ORDER BY popularity DESC
        LIMIT $2
      `;
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows.map(row => ({
        itemId: row.item_id,
        popularity: parseInt(row.popularity)
      }));
    } catch (error) {
      console.error('Error getting popular items:', error);
      return [];
    }
  }

  /**
   * Filter out items user has already interacted with
   */
  static async filterUserInteractions(
    userId: string,
    itemType: string,
    itemIds: string[]
  ): Promise<string[]> {
    if (itemIds.length === 0) return [];

    try {
      const result = await pool.query(
        `SELECT DISTINCT item_id
         FROM user_behavior_events
         WHERE user_id = $1 
           AND item_type = $2 
           AND item_id = ANY($3)`,
        [userId, itemType, itemIds]
      );

      const interactedIds = new Set(result.rows.map(row => row.item_id));
      return itemIds.filter(id => !interactedIds.has(id));
    } catch (error) {
      console.error('Error filtering user interactions:', error);
      return itemIds; // Return all if error
    }
  }
}


