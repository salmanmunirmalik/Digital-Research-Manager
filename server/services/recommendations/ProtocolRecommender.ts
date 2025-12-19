/**
 * ProtocolRecommender - Protocol-specific recommendation system
 * 
 * Provides intelligent protocol recommendations based on:
 * - User's protocol usage history
 * - Similar protocols (content-based)
 * - Popular protocols in user's research area
 * - Protocols used by similar users (collaborative filtering)
 */

import pool from '../../../database/config.js';
import { RecommendationEngine, Recommendation, RecommendationContext } from './RecommendationEngine';

export class ProtocolRecommender {
  /**
   * Get protocol recommendations for a user
   */
  static async getRecommendations(
    userId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;
    const recommendations: Recommendation[] = [];

    try {
      // 1. Get user's research interests
      const userResult = await pool.query(
        `SELECT research_interests FROM users WHERE id = $1`,
        [userId]
      );
      const researchInterests = userResult.rows[0]?.research_interests || [];

      // 2. Get user's protocol interaction history
      const userInteractions = await RecommendationEngine.getUserInteractions(
        userId,
        'protocol',
        ['view', 'fork', 'share', 'complete'],
        50
      );

      // 3. Collaborative Filtering: Based on similar users
      if (userInteractions.length > 0) {
        const collaborativeRecs = await this.getCollaborativeRecommendations(
          userId,
          userInteractions,
          limit
        );
        recommendations.push(...collaborativeRecs);
      }

      // 4. Content-Based: Based on research interests and protocol tags
      const contentBasedRecs = await this.getContentBasedRecommendations(
        userId,
        researchInterests,
        limit
      );
      recommendations.push(...contentBasedRecs);

      // 5. Popular Protocols: Fallback for new users
      if (recommendations.length < limit) {
        const popularRecs = await this.getPopularProtocolRecommendations(
          userId,
          researchInterests,
          limit - recommendations.length
        );
        recommendations.push(...popularRecs);
      }

      // 6. Remove duplicates and sort by score
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      const sortedRecs = uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return sortedRecs;
    } catch (error) {
      console.error('Error getting protocol recommendations:', error);
      // Fallback to popular protocols
      return await this.getPopularProtocolRecommendations(userId, [], limit);
    }
  }

  /**
   * Collaborative filtering: Find protocols used by users with similar behavior
   */
  private static async getCollaborativeRecommendations(
    userId: string,
    userInteractions: any[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      const interactedProtocolIds = userInteractions.map(i => i.item_id);

      // Find users who interacted with same protocols
      const similarUsersResult = await pool.query(
        `SELECT DISTINCT user_id, COUNT(*) as common_count
         FROM user_behavior_events
         WHERE item_type = 'protocol'
           AND item_id = ANY($1)
           AND user_id != $2
         GROUP BY user_id
         HAVING COUNT(*) >= 2
         ORDER BY common_count DESC
         LIMIT 20`,
        [interactedProtocolIds, userId]
      );

      if (similarUsersResult.rows.length === 0) {
        return [];
      }

      const similarUserIds = similarUsersResult.rows.map(row => row.user_id);

      // Get protocols these similar users interacted with (that current user hasn't)
      const recommendationsResult = await pool.query(
        `SELECT DISTINCT ube.item_id, COUNT(*) as popularity
         FROM user_behavior_events ube
         WHERE ube.item_type = 'protocol'
           AND ube.user_id = ANY($1)
           AND ube.item_id != ALL($2)
           AND ube.event_type IN ('view', 'fork', 'share', 'complete')
         GROUP BY ube.item_id
         ORDER BY popularity DESC
         LIMIT $3`,
        [similarUserIds, interactedProtocolIds, limit]
      );

      return recommendationsResult.rows.map((row, index) => ({
        itemId: row.item_id,
        itemType: 'protocol',
        score: 0.7 - (index * 0.05), // Decreasing score
        reason: 'Recommended by researchers with similar interests',
        algorithm: 'collaborative',
        metadata: { popularity: parseInt(row.popularity) }
      }));
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }

  /**
   * Content-based: Based on research interests and protocol tags
   */
  private static async getContentBasedRecommendations(
    userId: string,
    researchInterests: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      if (researchInterests.length === 0) {
        return [];
      }

      // Get protocols that match research interests
      const protocolsResult = await pool.query(
        `SELECT DISTINCT p.id, p.title, p.tags, p.research_area,
                COUNT(DISTINCT ube.user_id) as usage_count
         FROM protocols p
         LEFT JOIN user_behavior_events ube ON ube.item_id = p.id::text AND ube.item_type = 'protocol'
         WHERE p.is_approved = true
           AND (
             p.research_area = ANY($1)
             OR EXISTS (
               SELECT 1 FROM unnest(p.tags) tag
               WHERE tag = ANY($1)
             )
           )
           AND NOT EXISTS (
             SELECT 1 FROM user_behavior_events
             WHERE user_id = $2
               AND item_type = 'protocol'
               AND item_id = p.id::text
           )
         GROUP BY p.id, p.title, p.tags, p.research_area
         ORDER BY usage_count DESC, p.created_at DESC
         LIMIT $3`,
        [researchInterests, userId, limit]
      );

      return protocolsResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'protocol',
        score: 0.8 - (index * 0.03),
        reason: `Matches your research interests: ${researchInterests.slice(0, 2).join(', ')}`,
        algorithm: 'content_based',
        metadata: {
          title: row.title,
          usageCount: parseInt(row.usage_count) || 0
        }
      }));
    } catch (error) {
      console.error('Error in content-based filtering:', error);
      return [];
    }
  }

  /**
   * Popular protocols in user's research area
   */
  private static async getPopularProtocolRecommendations(
    userId: string,
    researchInterests: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      let query = `
        SELECT p.id, p.title, p.research_area,
               COUNT(DISTINCT ube.user_id) as popularity
        FROM protocols p
        LEFT JOIN user_behavior_events ube ON ube.item_id = p.id::text 
          AND ube.item_type = 'protocol'
          AND ube.created_at >= CURRENT_TIMESTAMP - INTERVAL '90 days'
        WHERE p.is_approved = true
      `;
      const params: any[] = [];
      let paramIndex = 1;

      // Filter by research interests if available
      if (researchInterests.length > 0) {
        query += ` AND (
          p.research_area = ANY($${paramIndex})
          OR EXISTS (
            SELECT 1 FROM unnest(p.tags) tag
            WHERE tag = ANY($${paramIndex})
          )
        )`;
        params.push(researchInterests);
        paramIndex++;
      }

      query += `
        AND NOT EXISTS (
          SELECT 1 FROM user_behavior_events
          WHERE user_id = $${paramIndex}
            AND item_type = 'protocol'
            AND item_id = p.id::text
        )
        GROUP BY p.id, p.title, p.research_area
        ORDER BY popularity DESC, p.created_at DESC
        LIMIT $${paramIndex + 1}
      `;
      params.push(userId, limit);

      const result = await pool.query(query, params);

      return result.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'protocol',
        score: 0.6 - (index * 0.02),
        reason: researchInterests.length > 0
          ? 'Popular in your research area'
          : 'Popular protocols you might find useful',
        algorithm: 'popularity',
        metadata: {
          title: row.title,
          popularity: parseInt(row.popularity) || 0
        }
      }));
    } catch (error) {
      console.error('Error getting popular protocols:', error);
      return [];
    }
  }

  /**
   * Get protocols similar to a specific protocol
   */
  static async getSimilarProtocols(
    protocolId: string,
    limit: number = 5
  ): Promise<Recommendation[]> {
    try {
      // Get protocol details
      const protocolResult = await pool.query(
        `SELECT tags, research_area, techniques FROM protocols WHERE id = $1`,
        [protocolId]
      );

      if (protocolResult.rows.length === 0) {
        return [];
      }

      const protocol = protocolResult.rows[0];
      const tags = protocol.tags || [];
      const researchArea = protocol.research_area;
      const techniques = protocol.techniques || [];

      // Find similar protocols
      const similarResult = await pool.query(
        `SELECT id, title, tags, research_area,
                (
                  CASE WHEN research_area = $1 THEN 3 ELSE 0 END +
                  (SELECT COUNT(*) FROM unnest(tags) tag WHERE tag = ANY($2)) * 2 +
                  (SELECT COUNT(*) FROM unnest(techniques) tech WHERE tech = ANY($3))
                ) as similarity_score
         FROM protocols
         WHERE id != $4
           AND is_approved = true
         ORDER BY similarity_score DESC
         LIMIT $5`,
        [researchArea, tags, techniques, protocolId, limit]
      );

      return similarResult.rows.map(row => ({
        itemId: row.id,
        itemType: 'protocol',
        score: Math.min(0.9, 0.5 + (parseInt(row.similarity_score) / 10)),
        reason: 'Similar techniques and research area',
        algorithm: 'content_similarity',
        metadata: { title: row.title }
      }));
    } catch (error) {
      console.error('Error getting similar protocols:', error);
      return [];
    }
  }

  /**
   * Remove duplicate recommendations, keeping highest score
   */
  private static deduplicateRecommendations(
    recommendations: Recommendation[]
  ): Recommendation[] {
    const seen = new Map<string, Recommendation>();

    for (const rec of recommendations) {
      const key = `${rec.itemType}:${rec.itemId}`;
      const existing = seen.get(key);

      if (!existing || rec.score > existing.score) {
        seen.set(key, rec);
      }
    }

    return Array.from(seen.values());
  }
}


