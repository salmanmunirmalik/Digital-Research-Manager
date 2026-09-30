/**
 * Collaborator recommendations from profile interest / expertise overlap.
 */

import pool from '../../../database/config.js';
import {
  parseInterestList,
  normalizeInterestList,
  computeOverlapScore,
} from '../../utils/interestOverlap.js';
import { Recommendation, RecommendationContext } from './RecommendationEngine.js';

function toList(value: unknown): string[] {
  return normalizeInterestList(parseInterestList(value));
}

export class CollaboratorRecommender {
  static async getRecommendations(
    userId: string,
    context: RecommendationContext = {}
  ): Promise<Recommendation[]> {
    const limit = context.limit || 10;

    try {
      const me = await pool.query(
        `SELECT research_interests, specialization, expertise
         FROM users WHERE id = $1`,
        [userId]
      );
      const row = me.rows[0] || {};
      const myInterests = [
        ...toList(row.research_interests),
        ...toList(row.expertise),
        ...toList(row.specialization),
      ];

      const candidates = await pool.query(
        `SELECT id, first_name, last_name, username, current_institution,
                research_interests, specialization, expertise
         FROM users
         WHERE id != $1
         ORDER BY created_at DESC
         LIMIT 120`,
        [userId]
      );

      const scored: Recommendation[] = [];
      for (const c of candidates.rows) {
        const theirs = [
          ...toList(c.research_interests),
          ...toList(c.expertise),
          ...toList(c.specialization),
        ];
        if (theirs.length === 0 && myInterests.length > 0) continue;

        const overlap = myInterests.length
          ? computeOverlapScore(myInterests, theirs)
          : theirs.length
            ? 0.15
            : 0;
        if (overlap <= 0 && myInterests.length > 0) continue;

        const name =
          [c.first_name, c.last_name].filter(Boolean).join(' ') ||
          c.username ||
          'Researcher';
        const shared = myInterests.filter((i) =>
          theirs.some((t) => t.includes(i) || i.includes(t))
        );

        scored.push({
          itemId: String(c.id),
          itemType: 'collaborator',
          score: Math.round(overlap * 1000) / 10,
          reason:
            shared.length > 0
              ? `Shared interests: ${shared.slice(0, 3).join(', ')}`
              : c.current_institution
                ? `Active researcher at ${c.current_institution}`
                : 'Potential collaborator based on profile',
          algorithm: 'interest_overlap',
          metadata: {
            title: name,
            name,
            institution: c.current_institution || null,
            expertise: theirs.slice(0, 6),
            category: 'collaborator',
          },
        });
      }

      return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error('CollaboratorRecommender error:', error);
      return [];
    }
  }
}
