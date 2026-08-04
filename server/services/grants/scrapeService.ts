import axios from 'axios';

interface GrantSource {
  id: string;
  name: string;
  base_url?: string | null;
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

const extractMatches = (html: string, selector: RegExp) => {
  const matches = html.match(selector);
  return matches ? matches[1].trim() : null;
};

export const scrapeGrantSource = async (source: GrantSource): Promise<GrantRecord[]> => {
  const config = source.config || {};
  const endpoint = config.endpoint || source.base_url;
  if (!endpoint) return [];

  const response = await axios.get(endpoint, { timeout: 20000 });
  const html = String(response.data || '');

  // Minimal scraper: use configured regex selectors for listing blocks.
  const itemPattern = config.item_pattern
    ? new RegExp(config.item_pattern, 'g')
    : /<article[\s\S]*?<\/article>/g;

  const items = html.match(itemPattern) || [];

  return items.map(item => ({
    external_id: extractMatches(item, config.id_pattern ? new RegExp(config.id_pattern) : /data-id="([^"]+)"/),
    title: extractMatches(item, config.title_pattern ? new RegExp(config.title_pattern) : /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/) || 'Untitled grant',
    summary: extractMatches(item, config.summary_pattern ? new RegExp(config.summary_pattern) : /<p[^>]*>([\s\S]*?)<\/p>/),
    sponsor: config.sponsor || source.name,
    funding_type: config.funding_type || 'grant',
    funding_currency: config.funding_currency || 'USD',
    deadline_date: extractMatches(item, config.deadline_pattern ? new RegExp(config.deadline_pattern) : /Deadline:\s*([^<]+)/),
    published_date: extractMatches(item, config.published_pattern ? new RegExp(config.published_pattern) : /Published:\s*([^<]+)/),
    status: config.status || 'open',
    url: extractMatches(item, config.url_pattern ? new RegExp(config.url_pattern) : /href="([^"]+)"/),
    region: config.region || null,
    country: config.country || null,
    disciplines: config.disciplines || [],
    keywords: config.keywords || [],
    eligibility: config.eligibility || {},
    requirements: config.requirements || {},
    raw_payload: { html: item }
  }));
};
