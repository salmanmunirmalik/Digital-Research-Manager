import crypto from 'crypto';
import pool from '../../../database/config.js';
import {
  parseInterestList,
  normalizeInterestList,
  computeOverlapScore,
} from '../../utils/interestOverlap.js';
import {
  cosineSimilarity,
  generateEmbedding,
  parseEmbedding,
  simpleHash,
} from '../../utils/embeddings.js';
import { buildResearcherProfile } from './fitGapService.js';

interface UserPreferences {
  keywords: string[];
  disciplines: string[];
  regions: string[];
  funding_types: string[];
  career_stage?: string | null;
  min_funding?: number | null;
  max_funding?: number | null;
}

interface GrantRow {
  id: string;
  title: string;
  summary?: string | null;
  keywords: string[];
  disciplines: string[];
  region?: string | null;
  country?: string | null;
  funding_type?: string | null;
  funding_min?: number | null;
  funding_max?: number | null;
  status?: string | null;
  deadline_date?: string | null;
  programme?: string | null;
  eligibility?: unknown;
  requirements?: unknown;
}

const parseJson = (value: unknown, fallback: unknown = []) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const regionMatches = (prefs: UserPreferences, grant: GrantRow) => {
  const regions = normalizeInterestList(prefs.regions || []);
  if (regions.length === 0) return false;
  const grantRegion = (grant.region || '').toLowerCase();
  const grantCountry = (grant.country || '').toLowerCase();
  return regions.some((region) => {
    if (!region) return false;
    if (grantRegion === region || grantCountry === region) return true;
    if (grantRegion.includes(region) || region.includes(grantRegion)) return true;
    if (grantCountry.includes(region) || region.includes(grantCountry)) return true;
    return false;
  });
};

const buildMatchReasons = (
  grant: GrantRow,
  prefs: UserPreferences,
  semanticScore?: number
) => {
  const reasons: string[] = [];
  const grantKeywords = normalizeInterestList(grant.keywords || []);
  const grantDisciplines = normalizeInterestList(grant.disciplines || []);
  const userKeywords = normalizeInterestList(prefs.keywords || []);
  const userDisciplines = normalizeInterestList(prefs.disciplines || []);

  if (computeOverlapScore(grantDisciplines, userDisciplines) > 0) {
    reasons.push('discipline_match');
  }
  if (computeOverlapScore(grantKeywords, userKeywords) > 0) {
    reasons.push('keyword_match');
  }
  if (regionMatches(prefs, grant)) {
    reasons.push('region_match');
  }
  if (
    prefs.funding_types?.length &&
    normalizeInterestList(prefs.funding_types).includes((grant.funding_type || '').toLowerCase())
  ) {
    reasons.push('funding_type_match');
  }
  if (prefs.career_stage && prefs.career_stage !== 'any') {
    reasons.push('career_stage_check');
  }
  if (semanticScore != null && semanticScore >= 0.55) {
    reasons.push('semantic_match');
  }

  return reasons;
};

const computeEligibility = (grant: GrantRow, prefs: UserPreferences) => {
  const minFunding = prefs.min_funding ?? null;
  const maxFunding = prefs.max_funding ?? null;
  const fundingMin = grant.funding_min != null ? Number(grant.funding_min) : null;
  const fundingMax = grant.funding_max != null ? Number(grant.funding_max) : null;

  if (minFunding != null && fundingMax != null && fundingMax < minFunding) return false;
  if (maxFunding != null && fundingMin != null && fundingMin > maxFunding) return false;

  return true;
};

const computeKeywordScore = (grant: GrantRow, prefs: UserPreferences) => {
  const grantKeywords = normalizeInterestList(grant.keywords || []);
  const grantDisciplines = normalizeInterestList(grant.disciplines || []);
  const userKeywords = normalizeInterestList(prefs.keywords || []);
  const userDisciplines = normalizeInterestList(prefs.disciplines || []);

  const keywordScore = computeOverlapScore(grantKeywords, userKeywords);
  const disciplineScore = computeOverlapScore(grantDisciplines, userDisciplines);
  const regionScore = prefs.regions?.length ? (regionMatches(prefs, grant) ? 1 : 0) : 0;
  const fundingTypeScore =
    prefs.funding_types?.length &&
    normalizeInterestList(prefs.funding_types).includes((grant.funding_type || '').toLowerCase())
      ? 1
      : 0;

  return Math.round((keywordScore * 40 + disciplineScore * 40 + regionScore * 10 + fundingTypeScore * 10) * 100) / 100;
};

const grantText = (grant: GrantRow) =>
  [
    grant.title,
    grant.summary,
    grant.programme,
    (grant.keywords || []).join(', '),
    (grant.disciplines || []).join(', '),
    typeof grant.eligibility === 'string'
      ? grant.eligibility
      : JSON.stringify(grant.eligibility || {}),
    typeof grant.requirements === 'string'
      ? grant.requirements
      : JSON.stringify(grant.requirements || {}),
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 6000);

async function ensureGrantEmbedding(
  grant: GrantRow,
  userId: string
): Promise<number[] | null> {
  const text = grantText(grant);
  if (!text.trim()) return null;
  const hash = simpleHash(text);

  const existing = await pool.query(
    `SELECT embedding, content_hash FROM grant_embeddings WHERE grant_id = $1`,
    [grant.id]
  );
  if (existing.rows[0] && existing.rows[0].content_hash === hash) {
    return parseEmbedding(existing.rows[0].embedding);
  }

  const generated = await generateEmbedding(text, userId);
  if (!generated?.embedding?.length) return null;

  await pool.query(
    `INSERT INTO grant_embeddings (
      grant_id, content_hash, embedding, embedding_model, embedding_provider
    ) VALUES ($1, $2, $3, $4, $5)
    ON DUPLICATE KEY UPDATE
      content_hash = VALUES(content_hash),
      embedding = VALUES(embedding),
      embedding_model = VALUES(embedding_model),
      embedding_provider = VALUES(embedding_provider),
      updated_at = CURRENT_TIMESTAMP`,
    [
      grant.id,
      hash,
      JSON.stringify(generated.embedding),
      generated.model,
      generated.provider,
    ]
  );

  return generated.embedding;
}

const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const prefResult = await pool.query(
    'SELECT * FROM user_grant_preferences WHERE user_id = $1',
    [userId]
  );

  if (prefResult.rows.length > 0) {
    const row = prefResult.rows[0];
    return {
      keywords: parseJson(row.keywords, []) as string[],
      disciplines: parseJson(row.disciplines, []) as string[],
      regions: parseJson(row.regions, []) as string[],
      funding_types: parseJson(row.funding_types, []) as string[],
      career_stage: row.career_stage || null,
      min_funding: row.min_funding != null ? Number(row.min_funding) : null,
      max_funding: row.max_funding != null ? Number(row.max_funding) : null,
    };
  }

  const userResult = await pool.query(
    'SELECT research_interests, specialization, expertise FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0] || {};
  const interests = parseInterestList(user.research_interests);
  const specialization = user.specialization ? [String(user.specialization)] : [];
  const expertise = parseInterestList(user.expertise);

  return {
    keywords: [...interests, ...expertise].filter(Boolean),
    disciplines: [...interests, ...specialization].filter(Boolean),
    regions: [],
    funding_types: [],
  };
};

const normalizeGrantRow = (row: any): GrantRow => ({
  ...row,
  keywords: parseJson(row.keywords, []) as string[],
  disciplines: parseJson(row.disciplines, []) as string[],
  eligibility: parseJson(row.eligibility, {}),
  requirements: parseJson(row.requirements, {}),
  funding_min: row.funding_min != null ? Number(row.funding_min) : null,
  funding_max: row.funding_max != null ? Number(row.funding_max) : null,
});

export const matchGrantsForUser = async (userId: string) => {
  const prefs = await getUserPreferences(userId);
  const grantsResult = await pool.query(
    `SELECT id, title, summary, keywords, disciplines, region, country, funding_type,
            funding_min, funding_max, status, deadline_date, programme, eligibility, requirements
     FROM grants
     WHERE status IN ('open', 'rolling')
     ORDER BY deadline_date IS NULL, deadline_date ASC, created_at DESC
     LIMIT 120`
  );

  let profileEmbedding: number[] | null = null;
  try {
    const profileText = await buildResearcherProfile(userId);
    const generated = await generateEmbedding(profileText, userId);
    profileEmbedding = generated?.embedding || null;
  } catch (error) {
    console.warn('Semantic grant profile embedding unavailable:', error);
  }

  const results = [];
  for (const raw of grantsResult.rows) {
    const grant = normalizeGrantRow(raw);
    const keywordScore = computeKeywordScore(grant, prefs);

    let semantic = 0;
    if (profileEmbedding) {
      const gEmb = await ensureGrantEmbedding(grant, userId);
      if (gEmb) semantic = cosineSimilarity(profileEmbedding, gEmb);
    }

    // Blend: semantic up to 55 pts, keyword/rules up to 45 pts
    const matchScore =
      profileEmbedding && semantic > 0
        ? Math.round((semantic * 55 + (keywordScore / 100) * 45) * 100) / 100
        : keywordScore;

    const reasons = buildMatchReasons(grant, prefs, semantic);
    const isEligible = computeEligibility(grant, prefs);
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO grant_matches (id, user_id, grant_id, match_score, reasons, is_eligible, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         match_score = VALUES(match_score),
         reasons = VALUES(reasons),
         is_eligible = VALUES(is_eligible),
         updated_at = CURRENT_TIMESTAMP`,
      [id, userId, grant.id, matchScore, JSON.stringify(reasons), isEligible ? 1 : 0]
    );
    results.push({
      grantId: grant.id,
      matchScore,
      isEligible,
      reasons,
      semanticScore: Math.round(semantic * 1000) / 1000,
    });
  }

  return results;
};

export const matchAllUsers = async () => {
  const users = await pool.query('SELECT id FROM users');
  const summaries = [];
  for (const user of users.rows) {
    const matches = await matchGrantsForUser(user.id);
    summaries.push({ userId: user.id, matchCount: matches.length });
  }
  return summaries;
};
