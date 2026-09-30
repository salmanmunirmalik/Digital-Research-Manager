import express, { type Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { ingestGrantSources } from '../services/grants/ingestionService.js';
import { fetchHorizonEuropeTopics } from '../services/grants/horizonEuropeService.js';
import { matchGrantsForUser, matchAllUsers } from '../services/grants/matchingService.js';
import { notifyMatchesForUser } from '../services/grants/notificationService.js';
import { analyzeGrantFitGap } from '../services/grants/fitGapService.js';
import { POSTED_BY_SQL, userDisplayName, nameFromAuthUser } from '../utils/postedBy.js';

const router: Router = express.Router();

const parseJson = (value: unknown, fallback: unknown = []) => {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toDateOnly = (value: unknown): string | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // mysql2 maps MySQL DATE to a Date at local midnight; use local Y-M-D.
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value);
};

const mapGrant = (row: any) => ({
  ...row,
  disciplines: parseJson(row.disciplines, []),
  keywords: parseJson(row.keywords, []),
  eligibility: parseJson(row.eligibility, {}),
  requirements: parseJson(row.requirements, {}),
  deadline_date: toDateOnly(row.deadline_date),
  published_date: toDateOnly(row.published_date),
  opening_date: toDateOnly(row.opening_date),
  programme: row.programme || null,
  programme_period: row.programme_period || null,
  pillar: row.pillar || null,
  call_identifier: row.call_identifier || null,
  topic_identifier: row.topic_identifier || row.external_id || null,
  action_type: row.action_type || null,
  deadline_model: row.deadline_model || null,
  call_budget: row.call_budget != null ? Number(row.call_budget) : null,
  source_name: row.source_name || null,
  createdBy: row.created_by || null,
  postedByName: row.created_by
    ? userDisplayName({
        posted_by_name: row.posted_by_name,
        first_name: row.first_name,
        last_name: row.last_name,
        username: row.username,
      })
    : row.posted_by_name || row.sponsor || 'ResearchLab directory',
});

const toJson = (value: unknown) => JSON.stringify(value ?? null);

// List grants (must be before /:id)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      status = 'open',
      region,
      country,
      fundingType,
      minFunding,
      maxFunding,
      discipline,
      deadlineFrom,
      deadlineTo,
      limit = '50',
      offset = '0',
    } = req.query as Record<string, string>;

    const filters: string[] = [];
    const params: any[] = [];

    if (status) {
      if (status === 'open') {
        filters.push(`g.status IN ('open', 'forthcoming')`);
      } else {
        params.push(status);
        filters.push(`g.status = $${params.length}`);
      }
    }
    if (region) {
      params.push(region);
      filters.push(`g.region = $${params.length}`);
    }
    if (country) {
      params.push(country);
      filters.push(`g.country = $${params.length}`);
    }
    if (fundingType) {
      params.push(fundingType);
      filters.push(`g.funding_type = $${params.length}`);
    }
    if (minFunding) {
      params.push(Number(minFunding));
      filters.push(`(g.funding_max IS NULL OR g.funding_max >= $${params.length})`);
    }
    if (maxFunding) {
      params.push(Number(maxFunding));
      filters.push(`(g.funding_min IS NULL OR g.funding_min <= $${params.length})`);
    }
    if (discipline) {
      params.push(`%${discipline}%`);
      filters.push(`CAST(g.disciplines AS CHAR) LIKE $${params.length}`);
    }
    if (deadlineFrom) {
      params.push(deadlineFrom);
      filters.push(`g.deadline_date >= $${params.length}`);
    }
    if (deadlineTo) {
      params.push(deadlineTo);
      filters.push(`g.deadline_date <= $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      filters.push(
        `(g.title LIKE $${params.length} OR g.summary LIKE $${params.length} OR g.sponsor LIKE $${params.length} OR g.programme LIKE $${params.length} OR g.call_identifier LIKE $${params.length} OR g.topic_identifier LIKE $${params.length} OR g.external_id LIKE $${params.length})`
      );
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const limitVal = Number(limit) || 50;
    const offsetVal = Number(offset) || 0;
    params.push(limitVal, offsetVal);

    const result = await pool.query(
      `SELECT g.*,
        COALESCE(NULLIF(g.posted_by_name, ''), NULLIF(${POSTED_BY_SQL}, ''), u.username) AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM grants g
       LEFT JOIN users u ON u.id = g.created_by
       ${where}
       ORDER BY g.deadline_date IS NULL, g.deadline_date ASC, g.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, grants: result.rows.map(mapGrant) });
  } catch (error) {
    console.error('Error fetching grants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch grants' });
  }
});

router.get('/matches/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const matches = await matchGrantsForUser(userId);
    const detailed = await pool.query(
      `SELECT gm.match_score, gm.is_eligible, gm.reasons, g.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM grant_matches gm
       JOIN grants g ON g.id = gm.grant_id
       LEFT JOIN users u ON u.id = g.created_by
       WHERE gm.user_id = $1
       ORDER BY gm.match_score DESC`,
      [userId]
    );

    await notifyMatchesForUser(userId);

    res.json({
      success: true,
      matches: detailed.rows.map((row: any) => ({
        ...mapGrant(row),
        match_score: row.match_score,
        is_eligible: Boolean(row.is_eligible),
        reasons: parseJson(row.reasons, []),
      })),
      summary: matches,
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

router.get('/preferences/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM user_grant_preferences WHERE user_id = $1',
      [userId]
    );
    const row = result.rows[0];
    if (!row) {
      return res.json({ success: true, preferences: null });
    }
    res.json({
      success: true,
      preferences: {
        ...row,
        keywords: parseJson(row.keywords, []),
        disciplines: parseJson(row.disciplines, []),
        regions: parseJson(row.regions, []),
        funding_types: parseJson(row.funding_types, []),
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
  }
});

router.post('/preferences', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      keywords = [],
      disciplines = [],
      regions = [],
      fundingTypes = [],
      careerStage,
      notifyInApp = true,
      notifyEmail = true,
      minFunding,
      maxFunding,
    } = req.body;

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_grant_preferences (
        id, user_id, keywords, disciplines, regions, funding_types, career_stage,
        notify_in_app, notify_email, min_funding, max_funding
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON DUPLICATE KEY UPDATE
        keywords = VALUES(keywords),
        disciplines = VALUES(disciplines),
        regions = VALUES(regions),
        funding_types = VALUES(funding_types),
        career_stage = VALUES(career_stage),
        notify_in_app = VALUES(notify_in_app),
        notify_email = VALUES(notify_email),
        min_funding = VALUES(min_funding),
        max_funding = VALUES(max_funding),
        updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        userId,
        toJson(keywords),
        toJson(disciplines),
        toJson(regions),
        toJson(fundingTypes),
        careerStage || null,
        notifyInApp ? 1 : 0,
        notifyEmail ? 1 : 0,
        minFunding ?? null,
        maxFunding ?? null,
      ]
    );

    const result = await pool.query(
      'SELECT * FROM user_grant_preferences WHERE user_id = $1',
      [userId]
    );
    const row = result.rows[0];
    const matched = await matchGrantsForUser(userId);
    await notifyMatchesForUser(userId);

    res.json({
      success: true,
      preferences: row
        ? {
            ...row,
            keywords: parseJson(row.keywords, []),
            disciplines: parseJson(row.disciplines, []),
            regions: parseJson(row.regions, []),
            funding_types: parseJson(row.funding_types, []),
          }
        : null,
      matchCount: matched.filter((m) => m.matchScore > 0).length,
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ success: false, error: 'Failed to save preferences' });
  }
});

/** User-posted public funding opportunity */
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      summary,
      sponsor,
      fundingType,
      fundingMin,
      fundingMax,
      fundingCurrency,
      deadlineDate,
      url,
      region,
      country,
      disciplines,
      keywords,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const id = crypto.randomUUID();
    const posterName = nameFromAuthUser(req.user);
    await pool.query(
      `INSERT INTO grants (
        id, created_by, posted_by_name, title, summary, sponsor, funding_type, funding_min, funding_max,
        funding_currency, deadline_date, published_date, status, url, region, country,
        disciplines, keywords, eligibility, requirements, raw_payload
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,CURRENT_DATE,'open',$12,$13,$14,$15,$16,$17,$18,$19
      )`,
      [
        id,
        userId,
        posterName,
        String(title).trim(),
        summary || null,
        sponsor || null,
        fundingType || null,
        fundingMin != null ? Number(fundingMin) : null,
        fundingMax != null ? Number(fundingMax) : null,
        fundingCurrency || 'USD',
        deadlineDate || null,
        url || null,
        region || null,
        country || null,
        toJson(disciplines || []),
        toJson(keywords || []),
        toJson({}),
        toJson({}),
        toJson({ source: 'user_post' }),
      ]
    );

    const result = await pool.query(
      `SELECT g.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM grants g
       LEFT JOIN users u ON u.id = g.created_by
       WHERE g.id = $1`,
      [id]
    );

    res.status(201).json({ success: true, grant: mapGrant(result.rows[0]) });
  } catch (error) {
    console.error('Error creating grant:', error);
    res.status(500).json({ success: false, error: 'Failed to create grant' });
  }
});

const mapWriteup = (row: any) => ({
  ...row,
  content: parseJson(row.content, {}),
  metadata: parseJson(row.metadata, {}),
  status: row.status || 'draft',
});

// Grant writing drafts (must be before /:id)
router.get('/writeups', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, user_id, grant_id, title, template_type, status, content, metadata, created_at, updated_at
       FROM grant_writeups
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 100`,
      [userId]
    );
    res.json({ success: true, writeups: result.rows.map(mapWriteup) });
  } catch (error: any) {
    console.error('Error listing grant writeups:', error);
    const missing = String(error?.message || '').includes("doesn't exist") || error?.code === 'ER_NO_SUCH_TABLE';
    res.status(500).json({
      success: false,
      error: missing
        ? 'Draft storage is not installed. Run database/migrations/mysql_grant_writeups.sql'
        : 'Failed to list grant drafts',
    });
  }
});

router.get('/writeups/:writeupId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { writeupId } = req.params;
    const result = await pool.query(
      `SELECT id, user_id, grant_id, title, template_type, status, content, metadata, created_at, updated_at
       FROM grant_writeups WHERE id = $1 AND user_id = $2`,
      [writeupId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }
    res.json({ success: true, writeup: mapWriteup(result.rows[0]) });
  } catch (error) {
    console.error('Error fetching grant writeup:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch grant draft' });
  }
});

router.post('/writeups', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { title, templateType, grantId, content, metadata, status } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO grant_writeups
        (id, user_id, grant_id, title, template_type, status, content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        userId,
        grantId || null,
        title.trim().slice(0, 500),
        templateType || 'generic',
        status || 'draft',
        toJson(content ?? {}),
        toJson(metadata ?? {}),
      ]
    );
    const result = await pool.query(
      `SELECT id, user_id, grant_id, title, template_type, status, content, metadata, created_at, updated_at
       FROM grant_writeups WHERE id = $1`,
      [id]
    );
    res.status(201).json({ success: true, writeup: mapWriteup(result.rows[0]) });
  } catch (error: any) {
    console.error('Error creating grant writeup:', error);
    const missing = String(error?.message || '').includes("doesn't exist") || error?.code === 'ER_NO_SUCH_TABLE';
    res.status(500).json({
      success: false,
      error: missing
        ? 'Draft storage is not installed. Run database/migrations/mysql_grant_writeups.sql'
        : 'Failed to create grant draft',
    });
  }
});

router.put('/writeups/:writeupId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { writeupId } = req.params;
    const existing = await pool.query(
      `SELECT id FROM grant_writeups WHERE id = $1 AND user_id = $2`,
      [writeupId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }
    const { title, templateType, grantId, content, metadata, status } = req.body || {};
    await pool.query(
      `UPDATE grant_writeups SET
        title = COALESCE($1, title),
        template_type = COALESCE($2, template_type),
        grant_id = COALESCE($3, grant_id),
        content = COALESCE($4, content),
        metadata = COALESCE($5, metadata),
        status = COALESCE($6, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8`,
      [
        title != null ? String(title).trim().slice(0, 500) : null,
        templateType ?? null,
        grantId === undefined ? null : grantId,
        content != null ? toJson(content) : null,
        metadata != null ? toJson(metadata) : null,
        status ?? null,
        writeupId,
        userId,
      ]
    );
    const result = await pool.query(
      `SELECT id, user_id, grant_id, title, template_type, status, content, metadata, created_at, updated_at
       FROM grant_writeups WHERE id = $1`,
      [writeupId]
    );
    res.json({ success: true, writeup: mapWriteup(result.rows[0]) });
  } catch (error) {
    console.error('Error updating grant writeup:', error);
    res.status(500).json({ success: false, error: 'Failed to update grant draft' });
  }
});

router.delete('/writeups/:writeupId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { writeupId } = req.params;
    const existing = await pool.query(
      `SELECT id FROM grant_writeups WHERE id = $1 AND user_id = $2`,
      [writeupId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Draft not found' });
    }
    await pool.query(`DELETE FROM grant_writeups WHERE id = $1 AND user_id = $2`, [
      writeupId,
      userId,
    ]);
    res.json({ success: true, message: 'Draft deleted' });
  } catch (error) {
    console.error('Error deleting grant writeup:', error);
    res.status(500).json({ success: false, error: 'Failed to delete grant draft' });
  }
});

router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM grants WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Grant not found' });
    }
    if (existing.rows[0].created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the poster can update this grant' });
    }

    const b = req.body;
    await pool.query(
      `UPDATE grants SET
        title = COALESCE($1, title),
        summary = COALESCE($2, summary),
        sponsor = COALESCE($3, sponsor),
        funding_type = COALESCE($4, funding_type),
        funding_min = COALESCE($5, funding_min),
        funding_max = COALESCE($6, funding_max),
        funding_currency = COALESCE($7, funding_currency),
        deadline_date = COALESCE($8, deadline_date),
        url = COALESCE($9, url),
        region = COALESCE($10, region),
        country = COALESCE($11, country),
        disciplines = COALESCE($12, disciplines),
        keywords = COALESCE($13, keywords),
        status = COALESCE($14, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $15`,
      [
        b.title ?? null,
        b.summary ?? null,
        b.sponsor ?? null,
        b.fundingType ?? b.funding_type ?? null,
        b.fundingMin != null ? Number(b.fundingMin) : b.funding_min ?? null,
        b.fundingMax != null ? Number(b.fundingMax) : b.funding_max ?? null,
        b.fundingCurrency ?? b.funding_currency ?? null,
        b.deadlineDate ?? b.deadline_date ?? null,
        b.url ?? null,
        b.region ?? null,
        b.country ?? null,
        b.disciplines != null ? toJson(b.disciplines) : null,
        b.keywords != null ? toJson(b.keywords) : null,
        b.status ?? null,
        id,
      ]
    );

    const result = await pool.query(
      `SELECT g.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM grants g
       LEFT JOIN users u ON u.id = g.created_by
       WHERE g.id = $1`,
      [id]
    );
    res.json({ success: true, grant: mapGrant(result.rows[0]) });
  } catch (error) {
    console.error('Error updating grant:', error);
    res.status(500).json({ success: false, error: 'Failed to update grant' });
  }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM grants WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Grant not found' });
    }
    if (existing.rows[0].created_by !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the poster can delete this grant' });
    }
    await pool.query(`DELETE FROM grant_matches WHERE grant_id = $1`, [id]);
    await pool.query(`DELETE FROM grant_writeups WHERE grant_id = $1`, [id]);
    await pool.query(`DELETE FROM grant_embeddings WHERE grant_id = $1`, [id]);
    await pool.query(`DELETE FROM grants WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Grant deleted' });
  } catch (error) {
    console.error('Error deleting grant:', error);
    res.status(500).json({ success: false, error: 'Failed to delete grant' });
  }
});

/**
 * Fit-gap analysis for a grant vs researcher profile
 * POST /api/grants/:id/fit-gap
 */
router.post('/:id/fit-gap', authenticateToken, async (req: any, res) => {
  try {
    const analysis = await analyzeGrantFitGap(req.user.id, req.params.id);
    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Fit-gap analysis error:', error);
    const status = /not found/i.test(error?.message || '') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error?.message || 'Failed to analyze fit gap',
    });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.*,
        NULLIF(${POSTED_BY_SQL}, '') AS posted_by_name,
        u.first_name, u.last_name, u.username
       FROM grants g
       LEFT JOIN users u ON u.id = g.created_by
       WHERE g.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Grant not found' });
    }
    res.json({ success: true, grant: mapGrant(result.rows[0]) });
  } catch (error) {
    console.error('Error fetching grant:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch grant' });
  }
});

router.post('/ingest', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const SOURCE_ID = 'src-horizon-europe-sedia';
    const { totalReported, topics } = await fetchHorizonEuropeTopics({ maxPages: 12 });

    for (const topic of topics) {
      await pool.query(
        `INSERT INTO grants (
          id, created_by, source_id, source_name, external_id, call_identifier, topic_identifier,
          title, summary, sponsor, programme, programme_period, pillar, funding_type, action_type,
          funding_min, funding_max, funding_currency, call_budget, deadline_date, deadline_model,
          published_date, opening_date, status, url, region, country, disciplines, keywords,
          eligibility, requirements, raw_payload, posted_by_name
        ) VALUES (
          $1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
        )
        ON DUPLICATE KEY UPDATE
          source_name = VALUES(source_name),
          call_identifier = VALUES(call_identifier),
          topic_identifier = VALUES(topic_identifier),
          title = VALUES(title),
          summary = VALUES(summary),
          sponsor = VALUES(sponsor),
          programme = VALUES(programme),
          programme_period = VALUES(programme_period),
          pillar = VALUES(pillar),
          funding_type = VALUES(funding_type),
          action_type = VALUES(action_type),
          funding_currency = VALUES(funding_currency),
          deadline_date = VALUES(deadline_date),
          deadline_model = VALUES(deadline_model),
          published_date = VALUES(published_date),
          opening_date = VALUES(opening_date),
          status = VALUES(status),
          url = VALUES(url),
          region = VALUES(region),
          disciplines = VALUES(disciplines),
          keywords = VALUES(keywords),
          eligibility = VALUES(eligibility),
          requirements = VALUES(requirements),
          raw_payload = VALUES(raw_payload),
          posted_by_name = VALUES(posted_by_name),
          updated_at = CURRENT_TIMESTAMP`,
        [
          crypto.randomUUID(),
          SOURCE_ID,
          topic.source_name,
          topic.external_id,
          topic.call_identifier,
          topic.topic_identifier,
          topic.title,
          topic.summary,
          topic.sponsor,
          topic.programme,
          topic.programme_period,
          topic.pillar,
          topic.funding_type,
          topic.action_type,
          topic.funding_min,
          topic.funding_max,
          topic.funding_currency,
          topic.call_budget,
          topic.deadline_date,
          topic.deadline_model,
          topic.published_date,
          topic.opening_date,
          topic.status,
          topic.url,
          topic.region,
          topic.country,
          JSON.stringify(topic.disciplines),
          JSON.stringify(topic.keywords),
          JSON.stringify(topic.eligibility),
          JSON.stringify(topic.requirements),
          JSON.stringify(topic.raw_payload),
          topic.posted_by_name,
        ]
      );
    }

    await pool.query(
      `UPDATE grant_sources SET last_run_at = CURRENT_TIMESTAMP, last_status = $1, last_error = NULL WHERE id = $2`,
      [`ok:${topics.length}/${totalReported}`, SOURCE_ID]
    );

    const ingested = await ingestGrantSources();
    const matched = await matchAllUsers();
    for (const entry of matched) {
      await notifyMatchesForUser(entry.userId);
    }
    res.json({
      success: true,
      horizon: { totalReported, upserted: topics.length },
      ingested,
      matched,
    });
  } catch (error) {
    console.error('Error ingesting grants:', error);
    res.status(500).json({ success: false, error: 'Failed to ingest grants' });
  }
});

export default router;
