/**
 * Apply Horizon schema migration and ingest upcoming Horizon Europe topics
 * from the official SEDIA Funding & Tenders search API.
 *
 * Usage: node scripts/grants/ingest-horizon-europe.cjs
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const FormData = require('form-data');
const axios = require('axios');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'researchlab',
    multipleStatements: true,
  });

  const migrationPath = path.join(
    __dirname,
    '../../database/migrations/mysql_grants_horizon_alignment.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('Applying migration mysql_grants_horizon_alignment.sql …');
  await connection.query(sql);
  console.log('Migration applied.');

  // Inline SEDIA fetch (mirror of horizonEuropeService) so this .cjs script is self-contained
  const SEDIA_URL = 'https://api.tech.ec.europa.eu/search-api/prod/rest/search';
  const FRAMEWORK = '43108390';
  const STATUS_OPEN = '31094502';
  const STATUS_FORTHCOMING = '31094501';
  const PORTAL = 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/';
  const SOURCE_ID = 'src-horizon-europe-sedia';

  const first = (meta, key) => {
    const v = meta?.[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };
  const asString = (v) => (v == null ? null : typeof v === 'string' ? v : String(v));
  const toDateOnly = (v) => {
    const s = asString(v);
    if (!s) return null;
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  };

  const parseKeywords = (raw) => {
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    const out = [];
    for (const item of list) {
      const s = asString(item);
      if (!s) continue;
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          out.push(...parsed.map(String).filter(Boolean));
          continue;
        }
      } catch {
        /* plain */
      }
      if (s !== '[]') out.push(s.replace(/^\[|\]$/g, '').replace(/"/g, ''));
    }
    return [...new Set(out.map((k) => k.trim()).filter(Boolean))];
  };

  const inferPillar = (identifier) => {
    const id = identifier.toUpperCase();
    if (id.includes('ERC') || id.includes('MSCA') || id.includes('INFRA')) return 'Pillar I — Excellent Science';
    if (/-CL[1-6]-/.test(id) || id.includes('MISS-')) return 'Pillar II — Global Challenges & European Industrial Competitiveness';
    if (id.includes('EIC') || id.includes('EIE') || id.includes('EIT')) return 'Pillar III — Innovative Europe';
    if (id.includes('WIDERA') || id.includes('WIDENING')) return 'Widening participation & ERA';
    return 'Horizon Europe';
  };

  const inferDisciplines = (identifier, title, keywords) => {
    const id = identifier.toUpperCase();
    const found = new Set();
    if (id.includes('-CL1-') || /health|cancer|disease/i.test(title)) found.add('Health');
    if (id.includes('-CL2-') || /heritage|culture|society/i.test(title)) found.add('Culture & society');
    if (id.includes('-CL3-') || /security|cyber/i.test(title)) found.add('Civil security');
    if (id.includes('-CL4-') || /digital|space|ai|industry|quantum|internet/i.test(title)) found.add('Digital, industry & space');
    if (id.includes('-CL5-') || /climate|energy|mobility|hydropower/i.test(title)) found.add('Climate, energy & mobility');
    if (id.includes('-CL6-') || /biodiversity|food|bioeconomy|soil|ocean|agriculture/i.test(title)) found.add('Food, bioeconomy & environment');
    if (id.includes('ERC')) found.add('Frontier research');
    if (id.includes('MSCA')) found.add('Researcher mobility');
    if (id.includes('EIC')) found.add('Deep-tech innovation');
    if (id.includes('WIDERA')) found.add('Research & innovation policy');
    keywords.slice(0, 4).forEach((k) => found.add(k));
    if (!found.size) found.add('Research & innovation');
    return [...found].slice(0, 8);
  };

  const mapFundingType = (actions, identifier) => {
    const blob = `${actions.join(' ')} ${identifier}`.toUpperCase();
    if (blob.includes('MSCA') || blob.includes('FELLOW')) return 'fellowship';
    if (blob.includes('ERC')) return 'research_grant';
    if (blob.includes('ACCELERATOR') || blob.includes('SEED')) return 'seed';
    if (blob.includes('CSA') || blob.includes('COORDINATION')) return 'other';
    return 'research_grant';
  };

  const collectDeadlines = (meta) => {
    const dates = [];
    const push = (v) => {
      const s = asString(v);
      if (!s) return;
      const d = new Date(s);
      if (!Number.isNaN(+d)) dates.push(d);
    };
    push(first(meta, 'deadlineDate'));
    const multi = meta.deadlineDates;
    if (Array.isArray(multi)) {
      for (const entry of multi) {
        if (typeof entry === 'string') push(entry);
        else if (entry && typeof entry === 'object') push(entry.deadlineDate);
      }
    }
    return dates;
  };

  async function searchPage(pageNumber, pageSize) {
    const query = {
      bool: {
        must: [
          { terms: { type: ['1', '2', '8'] } },
          { terms: { status: [STATUS_OPEN, STATUS_FORTHCOMING] } },
          { terms: { frameworkProgramme: [FRAMEWORK] } },
        ],
      },
    };
    const form = new FormData();
    form.append('query', Buffer.from(JSON.stringify(query)), { contentType: 'application/json', filename: 'blob' });
    form.append('languages', Buffer.from(JSON.stringify(['en'])), { contentType: 'application/json', filename: 'blob' });
    form.append('sort', Buffer.from(JSON.stringify({ order: 'DESC', field: 'startDate' })), { contentType: 'application/json', filename: 'blob' });
    form.append(
      'displayFields',
      Buffer.from(
        JSON.stringify([
          'identifier', 'title', 'status', 'startDate', 'deadlineDate', 'deadlineDates', 'deadlineModel',
          'typesOfAction', 'programmePeriod', 'callIdentifier', 'keywords', 'url', 'frameworkProgramme',
        ])
      ),
      { contentType: 'application/json', filename: 'blob' }
    );
    const { data } = await axios.post(SEDIA_URL, form, {
      params: { apiKey: 'SEDIA', text: '***', pageSize, pageNumber },
      headers: { ...form.getHeaders(), Accept: 'application/json', 'User-Agent': 'ResearchLab-HorizonIngest/1.0' },
      timeout: 60000,
    });
    return data;
  }

  const now = new Date();
  const byId = new Map();
  let totalReported = 0;
  const maxPages = Number(process.env.HORIZON_MAX_PAGES || 12);

  console.log(`Fetching Horizon Europe topics from SEDIA (up to ${maxPages} pages)…`);
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await searchPage(page, 50);
    totalReported = data.totalResults || totalReported;
    const results = data.results || [];
    console.log(`  page ${page}: ${results.length} results (portal total ${totalReported})`);
    if (!results.length) break;

    for (const result of results) {
      const meta = result.metadata || {};
      const identifier = asString(first(meta, 'identifier')) || asString(first(meta, 'reference'));
      if (!identifier) continue;
      const deadlines = collectDeadlines(meta).sort((a, b) => +a - +b);
      const nextDeadline = deadlines.find((d) => d >= now) || null;
      if (!nextDeadline) continue;

      const title = asString(first(meta, 'title')) || asString(result.content) || identifier;
      const actions = Array.isArray(meta.typesOfAction) ? meta.typesOfAction.map(String) : [];
      const actionType = actions[0] || null;
      const callIdentifier = asString(first(meta, 'callIdentifier'));
      const programmePeriod = asString(first(meta, 'programmePeriod'));
      const deadlineModel = asString(first(meta, 'deadlineModel'));
      const statusCode = asString(first(meta, 'status'));
      const status = statusCode === STATUS_FORTHCOMING ? 'forthcoming' : 'open';
      const keywords = parseKeywords(meta.keywords);
      const pillar = inferPillar(identifier);
      const disciplines = inferDisciplines(identifier, title, keywords);
      const opening = toDateOnly(first(meta, 'startDate'));
      const detailUrl = asString(result.url) || asString(first(meta, 'url'));
      const url =
        detailUrl && detailUrl.includes('funding-tenders')
          ? detailUrl
          : `${PORTAL}${encodeURIComponent(identifier)}`;

      const summary = [
        'Horizon Europe funding opportunity listed on the EU Funding & Tenders Portal.',
        callIdentifier ? `Call: ${callIdentifier}.` : null,
        actionType ? `Type of action: ${actionType}.` : null,
        deadlineModel ? `Deadline model: ${deadlineModel}.` : null,
        pillar ? `Programme part: ${pillar}.` : null,
        programmePeriod ? `Programme period: ${programmePeriod}.` : null,
        'Applications must be submitted via the Funding & Tenders Portal. Legal entities from EU Member States and associated countries may participate subject to the call conditions.',
      ]
        .filter(Boolean)
        .join(' ');

      const topic = {
        external_id: identifier,
        title,
        summary,
        sponsor: 'European Commission — Horizon Europe',
        funding_type: mapFundingType(actions, identifier),
        funding_min: null,
        funding_max: null,
        funding_currency: 'EUR',
        call_budget: null,
        deadline_date: toDateOnly(nextDeadline.toISOString()),
        published_date: opening,
        opening_date: opening,
        status,
        url,
        region: 'Europe',
        country: null,
        disciplines,
        keywords: [...new Set(['Horizon Europe', 'EU', identifier, callIdentifier, ...keywords].filter(Boolean))].slice(0, 16),
        programme: 'Horizon Europe',
        programme_period: programmePeriod,
        pillar,
        call_identifier: callIdentifier,
        topic_identifier: identifier,
        action_type: actionType,
        deadline_model: deadlineModel,
        eligibility: {
          geography: 'EU Member States and Horizon Europe associated countries (see call conditions)',
          apply_via: 'EU Funding & Tenders Portal',
        },
        requirements: { deadline_model: deadlineModel, types_of_action: actions },
        raw_payload: {
          provider: 'sedia',
          frameworkProgramme: FRAMEWORK,
          statusCode,
          metadata: meta,
          resultUrl: detailUrl,
          ingested_from:
            'https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
          ingested_at: new Date().toISOString(),
        },
        source_name: 'Horizon Europe (SEDIA)',
        posted_by_name: 'Horizon Europe directory',
      };

      const existing = byId.get(identifier);
      if (!existing || (topic.deadline_date && existing.deadline_date && topic.deadline_date < existing.deadline_date)) {
        byId.set(identifier, topic);
      }
    }
    if (results.length < 50) break;
  }

  const topics = [...byId.values()].sort((a, b) => String(a.deadline_date).localeCompare(String(b.deadline_date)));
  console.log(`Normalized upcoming topics: ${topics.length}`);

  let upserted = 0;
  for (const g of topics) {
    const [rows] = await connection.query(
      'SELECT id FROM grants WHERE source_id = ? AND external_id = ? LIMIT 1',
      [SOURCE_ID, g.external_id]
    );
    const id = rows[0]?.id || crypto.randomUUID();

    await connection.query(
      `INSERT INTO grants (
        id, created_by, source_id, source_name, external_id, call_identifier, topic_identifier,
        title, summary, sponsor, programme, programme_period, pillar, funding_type, action_type,
        funding_min, funding_max, funding_currency, call_budget, deadline_date, deadline_model,
        published_date, opening_date, status, url, region, country, disciplines, keywords,
        eligibility, requirements, raw_payload, posted_by_name
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        call_budget = VALUES(call_budget),
        deadline_date = VALUES(deadline_date),
        deadline_model = VALUES(deadline_model),
        published_date = VALUES(published_date),
        opening_date = VALUES(opening_date),
        status = VALUES(status),
        url = VALUES(url),
        region = VALUES(region),
        country = VALUES(country),
        disciplines = VALUES(disciplines),
        keywords = VALUES(keywords),
        eligibility = VALUES(eligibility),
        requirements = VALUES(requirements),
        raw_payload = VALUES(raw_payload),
        posted_by_name = VALUES(posted_by_name),
        updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        SOURCE_ID,
        g.source_name,
        g.external_id,
        g.call_identifier,
        g.topic_identifier,
        g.title,
        g.summary,
        g.sponsor,
        g.programme,
        g.programme_period,
        g.pillar,
        g.funding_type,
        g.action_type,
        g.funding_min,
        g.funding_max,
        g.funding_currency,
        g.call_budget,
        g.deadline_date,
        g.deadline_model,
        g.published_date,
        g.opening_date,
        g.status,
        g.url,
        g.region,
        g.country,
        JSON.stringify(g.disciplines),
        JSON.stringify(g.keywords),
        JSON.stringify(g.eligibility),
        JSON.stringify(g.requirements),
        JSON.stringify(g.raw_payload),
        g.posted_by_name,
      ]
    );
    upserted += 1;
  }

  await connection.query('UPDATE grant_sources SET last_run_at = CURRENT_TIMESTAMP, last_status = ?, last_error = NULL WHERE id = ?', [
    `ok:${upserted}`,
    SOURCE_ID,
  ]);

  const [countOpen] = await connection.query(
    `SELECT COUNT(*) AS c FROM grants WHERE programme = 'Horizon Europe' AND status IN ('open','forthcoming')`
  );
  const [sample] = await connection.query(
    `SELECT topic_identifier, title, deadline_date, call_identifier, pillar
     FROM grants WHERE programme = 'Horizon Europe' AND status IN ('open','forthcoming')
     ORDER BY deadline_date ASC LIMIT 8`
  );

  console.log(`\nUpserted ${upserted} Horizon Europe topics.`);
  console.log(`Horizon rows open/forthcoming: ${countOpen[0].c}`);
  console.table(sample);
  await connection.end();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
