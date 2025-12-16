/**
 * ServiceRecommender - Service Marketplace recommendation system
 * 
 * Provides intelligent service recommendations based on:
 * - User's skills and expertise (from Scientist Passport)
 * - Service request requirements
 * - Provider ratings and success history
 * - Geographic proximity (if available)
 * - Lab compatibility
 */

import { pool } from '../../database/config';
import { RecommendationEngine, Recommendation, RecommendationContext } from './RecommendationEngine';

export class ServiceRecommender {
  /**
   * Get service recommendations for a user (as a provider)
   * Recommends services they might want to offer
   */
  static async getProviderRecommendations(
    userId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;
    const recommendations: Recommendation[] = [];

    try {
      // 1. Get user's skills from Scientist Passport
      const skillsResult = await pool.query(
        `SELECT skill_name, proficiency_level, category
         FROM scientist_skills
         WHERE user_id = $1 AND is_verified = true`,
        [userId]
      );

      const userSkills = skillsResult.rows.map(row => row.skill_name.toLowerCase());
      const skillCategories = [...new Set(skillsResult.rows.map(row => row.category))];

      // 2. Get user's research interests
      const userResult = await pool.query(
        `SELECT research_interests FROM users WHERE id = $1`,
        [userId]
      );
      const researchInterests = userResult.rows[0]?.research_interests || [];

      // 3. Get existing services user is already offering
      const existingServicesResult = await pool.query(
        `SELECT service_id FROM service_providers WHERE provider_id = $1`,
        [userId]
      );
      const existingServiceIds = existingServicesResult.rows.map(row => row.service_id);

      // 4. Find services matching user's skills
      if (userSkills.length > 0) {
        const skillBasedRecs = await this.getSkillBasedServiceRecommendations(
          userId,
          userSkills,
          skillCategories,
          existingServiceIds,
          limit
        );
        recommendations.push(...skillBasedRecs);
      }

      // 5. Research interest-based recommendations
      if (researchInterests.length > 0) {
        const interestRecs = await this.getInterestBasedServiceRecommendations(
          userId,
          researchInterests,
          existingServiceIds,
          limit
        );
        recommendations.push(...interestRecs);
      }

      // 6. Popular services in user's field
      const popularRecs = await this.getPopularServiceRecommendations(
        userId,
        skillCategories,
        researchInterests,
        existingServiceIds,
        limit - recommendations.length
      );
      recommendations.push(...popularRecs);

      // Remove duplicates and sort
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      return uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting provider service recommendations:', error);
      return [];
    }
  }

  /**
   * Get provider recommendations for a service request
   * Recommends providers who can fulfill a service request
   */
  static async getProviderRecommendationsForRequest(
    requestId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;
    const recommendations: Recommendation[] = [];

    try {
      // Get service request details
      const requestResult = await pool.query(
        `SELECT sr.*, u.research_interests
         FROM service_requests sr
         JOIN users u ON u.id = sr.requester_id
         WHERE sr.id = $1`,
        [requestId]
      );

      if (requestResult.rows.length === 0) {
        return [];
      }

      const request = requestResult.rows[0];
      const requiredSkills = request.required_skills || [];
      const serviceCategory = request.service_category;
      const budget = request.budget_range;

      // 1. Skill-based matching
      if (requiredSkills.length > 0) {
        const skillMatches = await this.findProvidersBySkills(
          requiredSkills,
          serviceCategory,
          budget,
          limit
        );
        recommendations.push(...skillMatches);
      }

      // 2. Category-based matching
      if (serviceCategory) {
        const categoryMatches = await this.findProvidersByCategory(
          serviceCategory,
          requiredSkills,
          budget,
          limit
        );
        recommendations.push(...categoryMatches);
      }

      // 3. Success history-based (providers with high ratings)
      const topRatedProviders = await this.findTopRatedProviders(
        serviceCategory,
        requiredSkills,
        limit
      );
      recommendations.push(...topRatedProviders);

      // Remove duplicates and sort
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      return uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting provider recommendations for request:', error);
      return [];
    }
  }

  /**
   * Get service recommendations for a user (as a requester)
   * Recommends services they might need
   */
  static async getServiceRecommendationsForRequester(
    userId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;
    const recommendations: Recommendation[] = [];

    try {
      // Get user's current projects and experiments
      const projectsResult = await pool.query(
        `SELECT DISTINCT p.id, p.title, p.description
         FROM projects p
         JOIN lab_members lm ON lm.lab_id = p.lab_id
         WHERE lm.user_id = $1 AND p.status = 'active'
         LIMIT 5`,
        [userId]
      );

      // Get user's research interests
      const userResult = await pool.query(
        `SELECT research_interests FROM users WHERE id = $1`,
        [userId]
      );
      const researchInterests = userResult.rows[0]?.research_interests || [];

      // Get user's past service requests
      const pastRequestsResult = await pool.query(
        `SELECT service_category, required_skills
         FROM service_requests
         WHERE requester_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
      );

      // 1. Project-based service recommendations
      if (projectsResult.rows.length > 0) {
        const projectRecs = await this.getProjectBasedServiceRecommendations(
          userId,
          projectsResult.rows,
          limit
        );
        recommendations.push(...projectRecs);
      }

      // 2. Research interest-based
      if (researchInterests.length > 0) {
        const interestRecs = await this.getInterestBasedServiceRecommendations(
          userId,
          researchInterests,
          [],
          limit
        );
        recommendations.push(...interestRecs);
      }

      // 3. Popular services in user's field
      const popularRecs = await this.getPopularServiceRecommendations(
        userId,
        [],
        researchInterests,
        [],
        limit - recommendations.length
      );
      recommendations.push(...popularRecs);

      // Remove duplicates and sort
      const uniqueRecs = this.deduplicateRecommendations(recommendations);
      return uniqueRecs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting service recommendations for requester:', error);
      return [];
    }
  }

  /**
   * Skill-based service recommendations for providers
   */
  private static async getSkillBasedServiceRecommendations(
    userId: string,
    userSkills: string[],
    skillCategories: string[],
    existingServiceIds: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      // Find services that match user's skills
      const servicesResult = await pool.query(
        `SELECT DISTINCT s.id, s.title, s.category, s.description,
                COUNT(DISTINCT sp.provider_id) as provider_count,
                AVG(sr.rating) as avg_rating
         FROM services s
         LEFT JOIN service_providers sp ON sp.service_id = s.id
         LEFT JOIN service_reviews sr ON sr.service_id = s.id
         WHERE s.status = 'active'
           AND (
             s.required_skills && $1
             OR s.category = ANY($2)
           )
           AND s.id != ALL($3)
         GROUP BY s.id, s.title, s.category, s.description
         ORDER BY avg_rating DESC NULLS LAST, provider_count DESC
         LIMIT $4`,
        [userSkills, skillCategories, existingServiceIds, limit]
      );

      return servicesResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'service',
        score: 0.85 - (index * 0.03),
        reason: `Matches your skills: ${userSkills.slice(0, 2).join(', ')}`,
        algorithm: 'skill_based',
        metadata: {
          title: row.title,
          category: row.category,
          avgRating: parseFloat(row.avg_rating) || 0,
          providerCount: parseInt(row.provider_count) || 0
        }
      }));
    } catch (error) {
      console.error('Error in skill-based service recommendations:', error);
      return [];
    }
  }

  /**
   * Find providers by required skills
   */
  private static async findProvidersBySkills(
    requiredSkills: string[],
    serviceCategory: string | null,
    budget: any,
    limit: number
  ): Promise<Recommendation[]> {
    try {
      let query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.username,
               sp.service_id, s.title as service_title,
               AVG(sr.rating) as avg_rating,
               COUNT(DISTINCT sr.id) as review_count,
               COUNT(DISTINCT spm.id) as completed_projects
         FROM users u
         JOIN scientist_skills ss ON ss.user_id = u.id
         JOIN service_providers sp ON sp.provider_id = u.id
         JOIN services s ON s.id = sp.service_id
         LEFT JOIN service_reviews sr ON sr.service_id = s.id AND sr.provider_id = u.id
         LEFT JOIN service_projects spm ON spm.provider_id = u.id AND spm.status = 'completed'
         WHERE ss.skill_name = ANY($1)
           AND ss.is_verified = true
           AND s.status = 'active'
      `;
      const params: any[] = [requiredSkills];
      let paramIndex = 2;

      if (serviceCategory) {
        query += ` AND s.category = $${paramIndex}`;
        params.push(serviceCategory);
        paramIndex++;
      }

      query += `
         GROUP BY u.id, u.first_name, u.last_name, u.username, sp.service_id, s.title
         ORDER BY avg_rating DESC NULLS LAST, completed_projects DESC, review_count DESC
         LIMIT $${paramIndex}
      `;
      params.push(limit);

      const result = await pool.query(query, params);

      return result.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'provider',
        score: 0.9 - (index * 0.02),
        reason: `Has required skills: ${requiredSkills.slice(0, 2).join(', ')}`,
        algorithm: 'skill_matching',
        metadata: {
          name: `${row.first_name} ${row.last_name}`,
          username: row.username,
          serviceTitle: row.service_title,
          avgRating: parseFloat(row.avg_rating) || 0,
          reviewCount: parseInt(row.review_count) || 0,
          completedProjects: parseInt(row.completed_projects) || 0
        }
      }));
    } catch (error) {
      console.error('Error finding providers by skills:', error);
      return [];
    }
  }

  /**
   * Find providers by service category
   */
  private static async findProvidersByCategory(
    category: string,
    requiredSkills: string[],
    budget: any,
    limit: number
  ): Promise<Recommendation[]> {
    try {
      const providersResult = await pool.query(
        `SELECT DISTINCT u.id, u.first_name, u.last_name, u.username,
                sp.service_id, s.title as service_title,
                AVG(sr.rating) as avg_rating,
                COUNT(DISTINCT sr.id) as review_count
         FROM users u
         JOIN service_providers sp ON sp.provider_id = u.id
         JOIN services s ON s.id = sp.service_id
         LEFT JOIN service_reviews sr ON sr.service_id = s.id AND sr.provider_id = u.id
         WHERE s.category = $1
           AND s.status = 'active'
         GROUP BY u.id, u.first_name, u.last_name, u.username, sp.service_id, s.title
         ORDER BY avg_rating DESC NULLS LAST, review_count DESC
         LIMIT $2`,
        [category, limit]
      );

      return providersResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'provider',
        score: 0.75 - (index * 0.02),
        reason: `Expert in ${category}`,
        algorithm: 'category_based',
        metadata: {
          name: `${row.first_name} ${row.last_name}`,
          username: row.username,
          serviceTitle: row.service_title,
          avgRating: parseFloat(row.avg_rating) || 0,
          reviewCount: parseInt(row.review_count) || 0
        }
      }));
    } catch (error) {
      console.error('Error finding providers by category:', error);
      return [];
    }
  }

  /**
   * Find top-rated providers
   */
  private static async findTopRatedProviders(
    category: string | null,
    requiredSkills: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      let query = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.username,
               AVG(sr.rating) as avg_rating,
               COUNT(DISTINCT sr.id) as review_count,
               COUNT(DISTINCT spm.id) as completed_projects
         FROM users u
         JOIN service_providers sp ON sp.provider_id = u.id
         JOIN services s ON s.id = sp.service_id
         LEFT JOIN service_reviews sr ON sr.provider_id = u.id
         LEFT JOIN service_projects spm ON spm.provider_id = u.id AND spm.status = 'completed'
         WHERE s.status = 'active'
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND s.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      query += `
         GROUP BY u.id, u.first_name, u.last_name, u.username
         HAVING COUNT(DISTINCT sr.id) >= 3
         ORDER BY avg_rating DESC, completed_projects DESC, review_count DESC
         LIMIT $${paramIndex}
      `;
      params.push(limit);

      const result = await pool.query(query, params);

      return result.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'provider',
        score: 0.8 - (index * 0.02),
        reason: `Highly rated provider (${parseFloat(row.avg_rating).toFixed(1)}/5.0)`,
        algorithm: 'top_rated',
        metadata: {
          name: `${row.first_name} ${row.last_name}`,
          username: row.username,
          avgRating: parseFloat(row.avg_rating) || 0,
          reviewCount: parseInt(row.review_count) || 0,
          completedProjects: parseInt(row.completed_projects) || 0
        }
      }));
    } catch (error) {
      console.error('Error finding top-rated providers:', error);
      return [];
    }
  }

  /**
   * Interest-based service recommendations
   */
  private static async getInterestBasedServiceRecommendations(
    userId: string,
    researchInterests: string[],
    existingServiceIds: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      const servicesResult = await pool.query(
        `SELECT DISTINCT s.id, s.title, s.category, s.description,
                COUNT(DISTINCT sp.provider_id) as provider_count,
                AVG(sr.rating) as avg_rating
         FROM services s
         LEFT JOIN service_providers sp ON sp.service_id = s.id
         LEFT JOIN service_reviews sr ON sr.service_id = s.id
         WHERE s.status = 'active'
           AND (
             s.category = ANY($1)
             OR s.description ILIKE ANY($2)
           )
           AND s.id != ALL($3)
         GROUP BY s.id, s.title, s.category, s.description
         ORDER BY avg_rating DESC NULLS LAST, provider_count DESC
         LIMIT $4`,
        [
          researchInterests,
          researchInterests.map(interest => `%${interest}%`),
          existingServiceIds,
          limit
        ]
      );

      return servicesResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'service',
        score: 0.7 - (index * 0.02),
        reason: `Relevant to your research interests: ${researchInterests.slice(0, 2).join(', ')}`,
        algorithm: 'interest_based',
        metadata: {
          title: row.title,
          category: row.category,
          avgRating: parseFloat(row.avg_rating) || 0,
          providerCount: parseInt(row.provider_count) || 0
        }
      }));
    } catch (error) {
      console.error('Error in interest-based service recommendations:', error);
      return [];
    }
  }

  /**
   * Project-based service recommendations
   */
  private static async getProjectBasedServiceRecommendations(
    userId: string,
    projects: any[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      // Extract keywords from projects
      const projectKeywords: string[] = [];
      projects.forEach(project => {
        const words = `${project.title} ${project.description || ''}`
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 4);
        projectKeywords.push(...words);
      });

      if (projectKeywords.length === 0) return [];

      const servicesResult = await pool.query(
        `SELECT DISTINCT s.id, s.title, s.category,
                ts_rank(
                  to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
                  plainto_tsquery('english', $1)
                ) as relevance
         FROM services s
         WHERE s.status = 'active'
           AND to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
               @@ plainto_tsquery('english', $1)
         ORDER BY relevance DESC
         LIMIT $2`,
        [projectKeywords.slice(0, 5).join(' & '), limit]
      );

      return servicesResult.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'service',
        score: 0.65 - (index * 0.02),
        reason: 'Relevant to your current projects',
        algorithm: 'project_based',
        metadata: {
          title: row.title,
          category: row.category,
          relevance: parseFloat(row.relevance) || 0
        }
      }));
    } catch (error) {
      console.error('Error in project-based service recommendations:', error);
      return [];
    }
  }

  /**
   * Popular services fallback
   */
  private static async getPopularServiceRecommendations(
    userId: string,
    skillCategories: string[],
    researchInterests: string[],
    existingServiceIds: string[],
    limit: number
  ): Promise<Recommendation[]> {
    try {
      let query = `
        SELECT DISTINCT s.id, s.title, s.category,
               COUNT(DISTINCT sr.id) as request_count,
               AVG(srv.rating) as avg_rating
         FROM services s
         LEFT JOIN service_requests sr ON sr.service_id = s.id
           AND sr.created_at >= CURRENT_TIMESTAMP - INTERVAL '90 days'
         LEFT JOIN service_reviews srv ON srv.service_id = s.id
         WHERE s.status = 'active'
           AND s.id != ALL($1)
      `;
      const params: any[] = [existingServiceIds];
      let paramIndex = 2;

      if (skillCategories.length > 0 || researchInterests.length > 0) {
        const categories = [...skillCategories, ...researchInterests];
        query += ` AND (s.category = ANY($${paramIndex}) OR s.description ILIKE ANY($${paramIndex + 1}))`;
        params.push(categories, categories.map(c => `%${c}%`));
        paramIndex += 2;
      }

      query += `
         GROUP BY s.id, s.title, s.category
         ORDER BY request_count DESC, avg_rating DESC NULLS LAST
         LIMIT $${paramIndex}
      `;
      params.push(limit);

      const result = await pool.query(query, params);

      return result.rows.map((row, index) => ({
        itemId: row.id,
        itemType: 'service',
        score: 0.5 - (index * 0.01),
        reason: 'Popular services in your field',
        algorithm: 'popularity',
        metadata: {
          title: row.title,
          category: row.category,
          requestCount: parseInt(row.request_count) || 0,
          avgRating: parseFloat(row.avg_rating) || 0
        }
      }));
    } catch (error) {
      console.error('Error getting popular services:', error);
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


