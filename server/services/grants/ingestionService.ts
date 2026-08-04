import axios from 'axios';
import crypto from 'crypto';
import pool from '../../../database/config.js';
import { scrapeGrantSource } from './scrapeService.js';

interface GrantSource {
  id: string;
  name: string;
  source_type: 'api' | 'scrape' | 'rss';
  base_url?: string | null;
  auth_type?: string | null;
  auth_config?: Record<string, any> | null;
  config?: Record<string, any> | null;
}

interface GrantRecord {
  external_id?: string | null;
  title: string;
  summary?: string | null;
  sponsor?: string | null;
  funding_type?: string | null;
  funding_min?: number | null;
  funding_max?: number | null;
  funding_currency?: string | null;
  deadline_date?: string | null;
  published_date?: string | null;
  status?: string | null;
  url?: string | null;
  region?: string | null;
  country?: string | null;
  disciplines?: string[] | null;
  keywords?: string[] | null;
  eligibility?: Record<string, any>;
  requirements?: Record<string, any>;
  raw_payload?: Record<string, any>;
}

const normalizeKeywords = (input: string[] = []) => {
  return Array.from(
    new Set(
      input
        .map(word => word.trim().toLowerCase())
        .filter(Boolean)
    )
  );
};

const buildKeywords = (record: GrantRecord) => {
  const base = [
    ...(record.keywords || []),
    ...(record.disciplines || [])
  ];

  const text = `${record.title} ${record.summary || ''}`.toLowerCase();
  const extra = text.split(/[^a-z0-9]+/).filter(token => token.length > 3);
  return normalizeKeywords([...base, ...extra]);
};

const upsertGrant = async (sourceId: string, record: GrantRecord) => {
  const keywords = buildKeywords(record);
  const id = crypto.randomUUID();
  const disciplines = JSON.stringify(record.disciplines || []);
  const keywordsJson = JSON.stringify(keywords);
  const eligibility = JSON.stringify(record.eligibility || {});
  const requirements = JSON.stringify(record.requirements || {});
  const rawPayload = JSON.stringify(record.raw_payload || {});

  // MySQL upsert on unique (source_id, external_id)
  await pool.query(
    `INSERT INTO grants (
      id, source_id, external_id, title, summary, sponsor, funding_type, funding_min, funding_max,
      funding_currency, deadline_date, published_date, status, url, region, country, disciplines,
      keywords, eligibility, requirements, raw_payload
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      summary = VALUES(summary),
      sponsor = VALUES(sponsor),
      funding_type = VALUES(funding_type),
      funding_min = VALUES(funding_min),
      funding_max = VALUES(funding_max),
      funding_currency = VALUES(funding_currency),
      deadline_date = VALUES(deadline_date),
      published_date = VALUES(published_date),
      status = VALUES(status),
      url = VALUES(url),
      region = VALUES(region),
      country = VALUES(country),
      disciplines = VALUES(disciplines),
      keywords = VALUES(keywords),
      eligibility = VALUES(eligibility),
      requirements = VALUES(requirements),
      raw_payload = VALUES(raw_payload),
      updated_at = CURRENT_TIMESTAMP`,
    [
      id,
      sourceId,
      record.external_id || null,
      record.title,
      record.summary || null,
      record.sponsor || null,
      record.funding_type || null,
      record.funding_min || null,
      record.funding_max || null,
      record.funding_currency || 'USD',
      record.deadline_date || null,
      record.published_date || null,
      record.status || 'open',
      record.url || null,
      record.region || null,
      record.country || null,
      disciplines,
      keywordsJson,
      eligibility,
      requirements,
      rawPayload,
    ]
  );
};

const extractFromPath = (payload: any, path: string) => {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), payload);
};

const mapApiRecord = (record: any, mapping: Record<string, string>): GrantRecord => {
  return {
    external_id: mapping.external_id ? record[mapping.external_id] : record.id,
    title: record[mapping.title] || record.title,
    summary: record[mapping.summary] || record.summary,
    sponsor: record[mapping.sponsor] || record.sponsor,
    funding_type: record[mapping.funding_type] || record.funding_type,
    funding_min: record[mapping.funding_min] || null,
    funding_max: record[mapping.funding_max] || null,
    funding_currency: record[mapping.funding_currency] || 'USD',
    deadline_date: record[mapping.deadline_date] || record.deadline_date,
    published_date: record[mapping.published_date] || record.published_date,
    status: record[mapping.status] || record.status || 'open',
    url: record[mapping.url] || record.url,
    region: record[mapping.region] || record.region,
    country: record[mapping.country] || record.country,
    disciplines: record[mapping.disciplines] || record.disciplines || [],
    keywords: record[mapping.keywords] || record.keywords || [],
    eligibility: record[mapping.eligibility] || record.eligibility || {},
    requirements: record[mapping.requirements] || record.requirements || {},
    raw_payload: record
  };
};

const ingestApiSource = async (source: GrantSource) => {
  const config = source.config || {};
  const endpoint = config.endpoint;
  if (!endpoint) {
    return [];
  }

  const headers: Record<string, string> = {};
  if (source.auth_type === 'api_key' && source.auth_config?.key) {
    headers[source.auth_config.header || 'Authorization'] = source.auth_config.key;
  }

  const response = await axios.get(endpoint, {
    headers,
    params: config.params || {},
    timeout: 20000
  });

  const records = config.data_path
    ? extractFromPath(response.data, config.data_path)
    : response.data;

  const items: any[] = Array.isArray(records) ? records : [];
  const mapping = config.mapping || {};

  const normalized: GrantRecord[] = items.map(item => mapApiRecord(item, mapping));
  return normalized;
};

const ingestRssSource = async (source: GrantSource) => {
  const config = source.config || {};
  const endpoint = config.endpoint || source.base_url;
  if (!endpoint) return [];

  const response = await axios.get(endpoint, { timeout: 20000 });
  const xml = String(response.data || '');
  const items = xml.split('<item>').slice(1);

  return items.map(item => {
    const getTag = (tag: string) => {
      const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return match ? match[1].trim() : null;
    };

    return {
      external_id: getTag('guid') || getTag('link'),
      title: getTag('title') || 'Untitled grant',
      summary: getTag('description'),
      sponsor: config.sponsor || source.name,
      funding_type: config.funding_type || 'grant',
      deadline_date: config.deadline_date || null,
      published_date: getTag('pubDate'),
      status: 'open',
      url: getTag('link'),
      region: config.region || null,
      country: config.country || null,
      disciplines: config.disciplines || [],
      keywords: config.keywords || [],
      eligibility: {},
      requirements: {},
      raw_payload: { xml: item }
    } as GrantRecord;
  });
};

export const ingestGrantSources = async () => {
  const sourcesResult = await pool.query(
    `SELECT * FROM grant_sources WHERE is_active = true ORDER BY created_at ASC`
  );
  const sources: GrantSource[] = sourcesResult.rows;
  const ingested: { sourceId: string; count: number }[] = [];

  for (const source of sources) {
    try {
      let records: GrantRecord[] = [];

      if (source.source_type === 'api') {
        records = await ingestApiSource(source);
      } else if (source.source_type === 'rss') {
        records = await ingestRssSource(source);
      } else if (source.source_type === 'scrape') {
        records = await scrapeGrantSource(source);
      }

      for (const record of records) {
        await upsertGrant(source.id, record);
      }

      await pool.query(
        `UPDATE grant_sources SET last_run_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [source.id]
      );

      ingested.push({ sourceId: source.id, count: records.length });
    } catch (error: any) {
      console.error(`Grant ingestion failed for ${source.name}:`, error.message);
      ingested.push({ sourceId: source.id, count: 0 });
    }
  }

  return ingested;
};
