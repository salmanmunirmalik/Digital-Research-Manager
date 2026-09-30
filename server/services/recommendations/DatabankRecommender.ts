/**
 * Databank offer recommendations from researcher interests vs offer focus.
 */

import pool from '../../../database/config.js';
import {
  parseInterestList,
  normalizeInterestList,
  computeOverlapScore,
  tagsLooselyMatch,
} from '../../utils/interestOverlap.js';
import { Recommendation, RecommendationContext } from './RecommendationEngine.js';

function toList(value: unknown): string[] {
  return normalizeInterestList(parseInterestList(value));
}

export class DatabankRecommender {
  static async getRecommendations(
    userId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;

    try {
      const me = await pool.query(
        `SELECT research_interests, specialization, expertise FROM users WHERE id = $1`,
        [userId]
      );
      const interests = [
        ...toList(me.rows[0]?.research_interests),
        ...toList(me.rows[0]?.expertise),
        ...toList(me.rows[0]?.specialization),
      ];

      const result = await pool.query(
        `SELECT o.id, o.title, o.description, o.data_type, o.disease_focus,
                o.population_type, o.sample_size, o.geographic_coverage, o.access_level,
                o.request_count, org.name as organization_name, org.country
         FROM databank_data_offers o
         JOIN databank_organizations org ON org.id = o.organization_id
         ORDER BY COALESCE(o.request_count, 0) DESC, o.updated_at DESC
         LIMIT 80`
      );

      const scored: Recommendation[] = [];
      for (const row of result.rows) {
        const tags = [
          ...toList(row.data_type),
          ...toList(row.disease_focus),
          ...toList(row.population_type),
          ...toList(row.geographic_coverage),
          ...normalizeInterestList(
            String(row.title || '')
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 4)
          ),
        ];
        const overlap = interests.length ? computeOverlapScore(interests, tags) : 0;
        const demandBoost = Math.min(0.2, (Number(row.request_count) || 0) / 50);
        const score = interests.length
          ? Math.round((overlap * 0.9 + demandBoost) * 1000) / 10
          : Math.round((0.25 + demandBoost) * 100);

        if (interests.length && overlap < 0.04 && demandBoost < 0.08) continue;

        const matched = interests.filter((i) => tags.some((t) => tagsLooselyMatch(i, t)));

        scored.push({
          itemId: String(row.id),
          itemType: 'databank_offer',
          score,
          reason:
            matched.length > 0
              ? `Matches your focus on ${matched.slice(0, 2).join(', ')}`
              : row.organization_name
                ? `Dataset from ${row.organization_name}`
                : 'Relevant databank offer',
          algorithm: interests.length ? 'focus_overlap' : 'popular_offer',
          metadata: {
            title: row.title,
            name: row.title,
            category: row.data_type || 'dataset',
            organization: row.organization_name,
            disease_focus: row.disease_focus,
            sample_size: row.sample_size,
            access_level: row.access_level,
            country: row.country,
            description: String(row.description || '').slice(0, 160),
          },
        });
      }

      return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error('DatabankRecommender error:', error);
      return [];
    }
  }
}
