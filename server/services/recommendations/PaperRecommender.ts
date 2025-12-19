/**
 * PaperRecommender - Paper and literature recommendation system
 * 
 * Provides intelligent paper recommendations based on:
 * - User's research interests
 * - Papers in user's journal preferences
 * - Papers related to user's current projects/experiments
 * - Papers cited by similar researchers
 * - AI agent query patterns
 */

import pool from '../../../database/config.js';
import { RecommendationEngine, Recommendation, RecommendationContext } from './RecommendationEngine';

export class PaperRecommender {
  /**
   * Get paper recommendations for a user
   */
  static async getRecommendations(
    userId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;
    const recommendations: Recommendation[] = [];

    try {
      // 1. Get user's research interests and journal preferences
      const userResult = await pool.query(
        `SELECT research_interests FROM users WHERE id = $1`,
        [userId]
      );
      const researchInterests = userResult.rows[0]?.research_interests || [];

      const journalPrefsResult = await pool.query(
        `SELECT journal_id, preference_type, rating
         FROM user_journal_preferences
         WHERE user_id = $1 AND preference_type IN ('favorite', 'recommended')`,
        [userId]
      );

      // 2. Get user's AI query patterns (from AI Research Agent)
      const aiQueriesResult = await pool.query(
        `SELECT DISTINCT query, context
         FROM user_ai_interactions
         WHERE user_id = $1
           AND interaction_type IN ('paper_finding', 'literature_review')
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      // 3. Get user's current projects/experiments
      const projectsResult = await pool.query(
        `SELECT DISTINCT p.id, p.title, p.description
         FROM projects p
         JOIN lab_members lm ON lm.lab_id = p.lab_id
         WHERE lm.user_id = $1 AND p.status = 'active'
         LIMIT 5`,
        [userId]
      );

      // 4. Journal-based recommendations
      if (journalPrefsResult.rows.length > 0) {
        const journalRecs = await this.getJournalBasedRecommendations(
          userId,
          journalPrefsResult.rows,
          limit
        );
        recommendations.push(...journalRecs);
      }

      // 5. Research interest-based recommendations
      if (researchInterests.length > 0) {
        const interestRecs = await this.getInterestBasedRecommendations(
          userId,
          researchInterests,
          limit
        );
        recommendations.push(...interestRecs);
      }

      // 6. Project-based recommendations
      if (projectsResult.rows.length > 0) {
        const projectRecs = await this.getProjectBasedRecommendations(
          userId,
          projectsResult.rows,
          limit
        );
        recommendations.push(...projectRecs);
      }

      // 7. AI query-based recommendations
      if (aiQueriesResult.rows.length > 0) {
        const queryRecs = await this.getAIQueryBasedRecommendations(
          userId,
          aiQueriesResult.rows,
          limit
        );
        recommendations.push(...queryRecs);
      }

      // 8. Popular papers fallback
      if (recommendations.length < limit) {
        const popularRecs = await this.getPopularPaperRecommendations(
          userId,
          researchInterests,
          limit - recommendations.length
        );
        recommendations.push(...popularRecs);
      }

      // Remove duplicates and sort
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      return uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting paper recommendations:', error);
      return await this.getPopularPaperRecommendations(userId, [], limit);
    }
  }

  /**
   * Recommendations based on user's favorite journals
   */
  private static async getJournalBasedRecommendations(
    userId: string,
    journalPreferences: any[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      const journalIds = journalPreferences.map(jp => jp.journal_id);
      const avgRating = journalPreferences.reduce((sum, jp) => sum + (jp.rating || 3), 0) / journalPreferences.length;

      // Get papers from preferred journals
      // Note: This assumes a papers table exists. If not, this would integrate with external APIs
      const papersResult = await pool.query(
        `SELECT DISTINCT p.id, p.title, p.journal_id, j.name as journal_name,
                ujp.rating as journal_rating
         FROM papers p
         JOIN journals j ON j.id = p.journal_id
         JOIN user_journal_preferences ujp ON ujp.journal_id = p.journal_id
         WHERE p.journal_id = ANY($1)
           AND ujp.user_id = $2
           AND NOT EXISTS (
             SELECT 1 FROM user_behavior_events
             WHERE user_id = $2
               AND item_type = 'paper'
               AND item_id = p.id::text
           )
         ORDER BY ujp.rating DESC, p.published_date DESC
         LIMIT $3`,
        [journalIds, userId, limit]
      );

      return papersResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'paper',
        score: 0.85 - (index * 0.03),
        reason: `From your preferred journal: ${row.journal_name}`,
        algorithm: 'journal_preference',
        metadata: {
          title: row.title,
          journalName: row.journal_name,
          journalRating: row.journal_rating
        }
      }));
    } catch (error) {
      console.error('Error in journal-based recommendations:', error);
      return [];
    }
  }

  /**
   * Recommendations based on research interests
   */
  private static async getInterestBasedRecommendations(
    userId: string,
    researchInterests: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      // This would typically query an external paper database or internal paper library
      // For now, we'll use a placeholder that matches research interests
      const papersResult = await pool.query(
        `SELECT DISTINCT p.id, p.title, p.keywords, p.abstract,
                COUNT(DISTINCT ube.user_id) as view_count
         FROM papers p
         LEFT JOIN user_behavior_events ube ON ube.item_id = p.id::text 
           AND ube.item_type = 'paper'
         WHERE (
           p.keywords && $1
           OR p.research_area = ANY($1)
         )
           AND NOT EXISTS (
             SELECT 1 FROM user_behavior_events
             WHERE user_id = $2
               AND item_type = 'paper'
               AND item_id = p.id::text
           )
         GROUP BY p.id, p.title, p.keywords, p.abstract
         ORDER BY view_count DESC, p.published_date DESC
         LIMIT $3`,
        [researchInterests, userId, limit]
      );

      return papersResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'paper',
        score: 0.75 - (index * 0.02),
        reason: `Matches your research interests: ${researchInterests.slice(0, 2).join(', ')}`,
        algorithm: 'research_interest',
        metadata: {
          title: row.title,
          viewCount: parseInt(row.view_count) || 0
        }
      }));
    } catch (error) {
      console.error('Error in interest-based recommendations:', error);
      return [];
    }
  }

  /**
   * Recommendations based on current projects
   */
  private static async getProjectBasedRecommendations(
    userId: string,
    projects: any[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      // Extract keywords from project titles and descriptions
      const projectKeywords: string[] = [];
      projects.forEach(project => {
        const words = `${project.title} ${project.description || ''}`
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 4);
        projectKeywords.push(...words);
      });

      if (projectKeywords.length === 0) return [];

      const papersResult = await pool.query(
        `SELECT DISTINCT p.id, p.title, p.abstract,
                ts_rank(
                  to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.abstract, '')),
                  plainto_tsquery('english', $1)
                ) as relevance
         FROM papers p
         WHERE to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.abstract, ''))
               @@ plainto_tsquery('english', $1)
           AND NOT EXISTS (
             SELECT 1 FROM user_behavior_events
             WHERE user_id = $2
               AND item_type = 'paper'
               AND item_id = p.id::text
           )
         ORDER BY relevance DESC
         LIMIT $3`,
        [projectKeywords.slice(0, 5).join(' & '), userId, limit]
      );

      return papersResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'paper',
        score: 0.7 - (index * 0.02),
        reason: 'Relevant to your current projects',
        algorithm: 'project_based',
        metadata: {
          title: row.title,
          relevance: parseFloat(row.relevance) || 0
        }
      }));
    } catch (error) {
      console.error('Error in project-based recommendations:', error);
      return [];
    }
  }

  /**
   * Recommendations based on AI agent queries
   */
  private static async getAIQueryBasedRecommendations(
    userId: string,
    aiQueries: any[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      // Extract topics from AI queries
      const topics: string[] = [];
      aiQueries.forEach(query => {
        const words = query.query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
        topics.push(...words.slice(0, 5));
      });

      if (topics.length === 0) return [];

      const papersResult = await pool.query(
        `SELECT DISTINCT p.id, p.title,
                ts_rank(
                  to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.abstract, '')),
                  plainto_tsquery('english', $1)
                ) as relevance
         FROM papers p
         WHERE to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.abstract, ''))
               @@ plainto_tsquery('english', $1)
           AND NOT EXISTS (
             SELECT 1 FROM user_behavior_events
             WHERE user_id = $2
               AND item_type = 'paper'
               AND item_id = p.id::text
           )
         ORDER BY relevance DESC
         LIMIT $3`,
        [topics.slice(0, 5).join(' & '), userId, limit]
      );

      return papersResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'paper',
        score: 0.65 - (index * 0.02),
        reason: 'Based on your recent research queries',
        algorithm: 'ai_query_based',
        metadata: {
          title: row.title,
          relevance: parseFloat(row.relevance) || 0
        }
      }));
    } catch (error) {
      console.error('Error in AI query-based recommendations:', error);
      return [];
    }
  }

  /**
   * Popular papers as fallback
   */
  private static async getPopularPaperRecommendations(
    userId: string,
    researchInterests: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      let query = `
        SELECT p.id, p.title, p.journal_id,
               COUNT(DISTINCT ube.user_id) as popularity
        FROM papers p
        LEFT JOIN user_behavior_events ube ON ube.item_id = p.id::text 
          AND ube.item_type = 'paper'
          AND ube.created_at >= CURRENT_TIMESTAMP - INTERVAL '90 days'
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (researchInterests.length > 0) {
        query += ` AND (p.keywords && $${paramIndex} OR p.research_area = ANY($${paramIndex}))`;
        params.push(researchInterests);
        paramIndex++;
      }

      query += `
        AND NOT EXISTS (
          SELECT 1 FROM user_behavior_events
          WHERE user_id = $${paramIndex}
            AND item_type = 'paper'
            AND item_id = p.id::text
        )
        GROUP BY p.id, p.title, p.journal_id
        ORDER BY popularity DESC, p.published_date DESC
        LIMIT $${paramIndex + 1}
      `;
      params.push(userId, limit);

      const result = await pool.query(query, params);

      return result.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'paper',
        score: 0.5 - (index * 0.01),
        reason: 'Popular papers in your field',
        algorithm: 'popularity',
        metadata: {
          title: row.title,
          popularity: parseInt(row.popularity) || 0
        }
      }));
    } catch (error) {
      console.error('Error getting popular papers:', error);
      return [];
    }
  }

  /**
   * Remove duplicate recommendations
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


