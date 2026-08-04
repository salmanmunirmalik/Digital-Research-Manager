import crypto from 'crypto';
import pool from '../../../database/config.js';

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
  keywords: string[];
  disciplines: string[];
  region?: string | null;
  country?: string | null;
  funding_type?: string | null;
  funding_min?: number | null;
  funding_max?: number | null;
  status?: string | null;
  deadline_date?: string | null;
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

const normalizeList = (items: string[] = []) =>
  items.map((item) => item.trim().toLowerCase()).filter(Boolean);

const computeOverlapScore = (grantValues: string[], userValues: string[]) => {
  if (grantValues.length === 0 || userValues.length === 0) return 0;
  const set = new Set(grantValues);
  const matches = userValues.filter((value) => set.has(value));
  return matches.length / Math.max(grantValues.length, userValues.length);
};

const regionMatches = (prefs: UserPreferences, grant: GrantRow) => {
  const regions = normalizeList(prefs.regions || []);
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

const buildMatchReasons = (grant: GrantRow, prefs: UserPreferences) => {
  const reasons: string[] = [];
  const grantKeywords = normalizeList(grant.keywords || []);
  const grantDisciplines = normalizeList(grant.disciplines || []);
  const userKeywords = normalizeList(prefs.keywords || []);
  const userDisciplines = normalizeList(prefs.disciplines || []);

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
    normalizeList(prefs.funding_types).includes((grant.funding_type || '').toLowerCase())
  ) {
    reasons.push('funding_type_match');
  }
  if (prefs.career_stage && prefs.career_stage !== 'any') {
    reasons.push('career_stage_check');
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

const computeMatchScore = (grant: GrantRow, prefs: UserPreferences) => {
  const grantKeywords = normalizeList(grant.keywords || []);
  const grantDisciplines = normalizeList(grant.disciplines || []);
  const userKeywords = normalizeList(prefs.keywords || []);
  const userDisciplines = normalizeList(prefs.disciplines || []);

  const keywordScore = computeOverlapScore(grantKeywords, userKeywords);
  const disciplineScore = computeOverlapScore(grantDisciplines, userDisciplines);
  const regionScore = prefs.regions?.length ? (regionMatches(prefs, grant) ? 1 : 0) : 0;
  const fundingTypeScore =
    prefs.funding_types?.length &&
    normalizeList(prefs.funding_types).includes((grant.funding_type || '').toLowerCase())
      ? 1
      : 0;

  return Math.round((keywordScore * 40 + disciplineScore * 40 + regionScore * 10 + fundingTypeScore * 10) * 100) / 100;
};

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
  const interests = parseJson(user.research_interests, []) as string[];
  const specialization = user.specialization ? [String(user.specialization)] : [];
  const expertise = parseJson(user.expertise, []) as string[];

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
  funding_min: row.funding_min != null ? Number(row.funding_min) : null,
  funding_max: row.funding_max != null ? Number(row.funding_max) : null,
});

export const matchGrantsForUser = async (userId: string) => {
  const prefs = await getUserPreferences(userId);
  const grantsResult = await pool.query(
    `SELECT id, title, keywords, disciplines, region, country, funding_type, funding_min, funding_max, status, deadline_date
     FROM grants
     WHERE status IN ('open', 'rolling')
     ORDER BY deadline_date IS NULL, deadline_date ASC, created_at DESC`
  );

  const results = [];
  for (const raw of grantsResult.rows) {
    const grant = normalizeGrantRow(raw);
    const matchScore = computeMatchScore(grant, prefs);
    const reasons = buildMatchReasons(grant, prefs);
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
    results.push({ grantId: grant.id, matchScore, isEligible, reasons });
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
