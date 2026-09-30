/**
 * Negative-result recommendations — surface similar failed approaches.
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

export class NegativeResultRecommender {
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
        `SELECT id, experiment_title, research_field, research_domain, keywords,
                failure_type, primary_reason, lessons_learned, tags,
                helpful_votes, views_count, created_at
         FROM negative_results
         WHERE COALESCE(is_publicly_searchable, 1) = 1
           AND (researcher_id IS NULL OR researcher_id != $1)
         ORDER BY COALESCE(helpful_votes, 0) DESC, created_at DESC
         LIMIT 80`,
        [userId]
      );

      const scored: Recommendation[] = [];
      for (const row of result.rows) {
        const tags = [
          ...toList(row.keywords),
          ...toList(row.tags),
          ...toList(row.research_field),
          ...toList(row.research_domain),
          ...toList(row.failure_type),
        ];
        const overlap = interests.length ? computeOverlapScore(interests, tags) : 0;
        const popularBoost = Math.min(0.25, (Number(row.helpful_votes) || 0) / 40);
        const score = interests.length
          ? Math.round((overlap * 0.85 + popularBoost) * 1000) / 10
          : Math.round((0.3 + popularBoost) * 100);

        if (interests.length && overlap < 0.05 && popularBoost < 0.1) continue;

        const matched = interests.filter((i) => tags.some((t) => tagsLooselyMatch(i, t)));

        scored.push({
          itemId: String(row.id),
          itemType: 'negative_result',
          score,
          reason:
            matched.length > 0
              ? `Related failure in ${matched.slice(0, 2).join(', ')} — review before repeating`
              : row.failure_type
                ? `${row.failure_type}: ${String(row.primary_reason || '').slice(0, 100)}`
                : 'Publicly shared negative result in your network',
          algorithm: interests.length ? 'field_overlap' : 'popular_negative',
          metadata: {
            title: row.experiment_title,
            name: row.experiment_title,
            category: row.research_field || row.research_domain || 'negative_result',
            failure_type: row.failure_type,
            lessons: String(row.lessons_learned || '').slice(0, 160),
            helpful_votes: row.helpful_votes,
          },
        });
      }

      return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error('NegativeResultRecommender error:', error);
      return [];
    }
  }
}
