/**
 * Horizon Europe ingest via the public EU Funding & Tenders SEDIA search API.
 * Programme overview: https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en
 * Apply: Funding & Tenders Portal
 */
import axios from 'axios';
import FormData from 'form-data';

const SEDIA_URL = 'https://api.tech.ec.europa.eu/search-api/prod/rest/search';
const FRAMEWORK_HORIZON_EUROPE = '43108390';
const STATUS_OPEN = '31094502';
const STATUS_FORTHCOMING = '31094501';
const PORTAL_TOPIC = 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/';

export type HorizonTopic = {
  external_id: string;
  title: string;
  summary: string;
  sponsor: string;
  funding_type: string;
  funding_min: number | null;
  funding_max: number | null;
  funding_currency: string;
  call_budget: number | null;
  deadline_date: string | null;
  published_date: string | null;
  opening_date: string | null;
  status: string;
  url: string;
  region: string;
  country: string | null;
  disciplines: string[];
  keywords: string[];
  programme: string;
  programme_period: string | null;
  pillar: string | null;
  call_identifier: string | null;
  topic_identifier: string;
  action_type: string | null;
  deadline_model: string | null;
  eligibility: Record<string, unknown>;
  requirements: Record<string, unknown>;
  raw_payload: Record<string, unknown>;
  source_name: string;
  posted_by_name: string;
};

const first = (meta: Record<string, unknown>, key: string): unknown => {
  const value = meta[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const asString = (value: unknown): string | null => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const toDateOnly = (value: unknown): string | null => {
  const s = asString(value);
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

const parseKeywords = (raw: unknown): string[] => {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
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
      // plain string
    }
    if (s !== '[]') out.push(s.replace(/^\[|\]$/g, '').replace(/"/g, ''));
  }
  return Array.from(new Set(out.map((k) => k.trim()).filter(Boolean)));
};

const inferPillar = (identifier: string): string | null => {
  const id = identifier.toUpperCase();
  if (id.includes('ERC') || id.includes('MSCA') || id.includes('INFRA')) return 'Pillar I — Excellent Science';
  if (id.includes('-CL1-') || id.includes('-CL2-') || id.includes('-CL3-') || id.includes('-CL4-') || id.includes('-CL5-') || id.includes('-CL6-') || id.includes('MISS-')) {
    return 'Pillar II — Global Challenges & European Industrial Competitiveness';
  }
  if (id.includes('EIC') || id.includes('EIE') || id.includes('EIT')) return 'Pillar III — Innovative Europe';
  if (id.includes('WIDERA') || id.includes('WIDENING')) return 'Widening participation & ERA';
  if (id.includes('EURATOM')) return 'Euratom';
  return 'Horizon Europe';
};

const inferDisciplines = (identifier: string, title: string, keywords: string[]): string[] => {
  const id = identifier.toUpperCase();
  const found = new Set<string>();
  if (id.includes('-CL1-') || /health|cancer|disease/i.test(title)) found.add('Health');
  if (id.includes('-CL2-') || /heritage|culture|society/i.test(title)) found.add('Culture & society');
  if (id.includes('-CL3-') || /security|cyber/i.test(title)) found.add('Civil security');
  if (id.includes('-CL4-') || /digital|space|ai|industry|quantum|internet/i.test(title)) {
    found.add('Digital, industry & space');
  }
  if (id.includes('-CL5-') || /climate|energy|mobility|hydropower/i.test(title)) {
    found.add('Climate, energy & mobility');
  }
  if (id.includes('-CL6-') || /biodiversity|food|bioeconomy|soil|ocean|agriculture/i.test(title)) {
    found.add('Food, bioeconomy & environment');
  }
  if (id.includes('ERC')) found.add('Frontier research');
  if (id.includes('MSCA')) found.add('Researcher mobility');
  if (id.includes('EIC')) found.add('Deep-tech innovation');
  if (id.includes('WIDERA')) found.add('Research & innovation policy');
  keywords.slice(0, 4).forEach((k) => found.add(k));
  if (!found.size) found.add('Research & innovation');
  return Array.from(found).slice(0, 8);
};

const mapFundingType = (actions: string[], identifier: string): string => {
  const blob = `${actions.join(' ')} ${identifier}`.toUpperCase();
  if (blob.includes('MSCA') || blob.includes('FELLOW')) return 'fellowship';
  if (blob.includes('ERC')) return 'research_grant';
  if (blob.includes('ACCELERATOR') || blob.includes('SEED')) return 'seed';
  if (blob.includes('CSA') || blob.includes('COORDINATION')) return 'other';
  if (blob.includes('TRAVEL')) return 'travel';
  return 'research_grant';
};

const collectDeadlines = (meta: Record<string, unknown>): Date[] => {
  const dates: Date[] = [];
  const push = (v: unknown) => {
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
      else if (entry && typeof entry === 'object') {
        push((entry as { deadlineDate?: string }).deadlineDate);
      }
    }
  }
  return dates;
};

const pickNextDeadline = (meta: Record<string, unknown>, now: Date): Date | null => {
  const dates = collectDeadlines(meta).sort((a, b) => +a - +b);
  const future = dates.filter((d) => d >= now);
  return future[0] || null;
};

const portalUrl = (identifier: string, fallback?: string | null) => {
  if (fallback && fallback.includes('funding-tenders')) return fallback;
  return `${PORTAL_TOPIC}${encodeURIComponent(identifier)}`;
};

const buildSummary = (item: {
  title: string;
  callIdentifier: string | null;
  actionType: string | null;
  deadlineModel: string | null;
  programmePeriod: string | null;
  pillar: string | null;
}) => {
  const parts = [
    'Horizon Europe funding opportunity listed on the EU Funding & Tenders Portal.',
    item.callIdentifier ? `Call: ${item.callIdentifier}.` : null,
    item.actionType ? `Type of action: ${item.actionType}.` : null,
    item.deadlineModel ? `Deadline model: ${item.deadlineModel}.` : null,
    item.pillar ? `Programme part: ${item.pillar}.` : null,
    item.programmePeriod ? `Programme period: ${item.programmePeriod}.` : null,
    'Applications must be submitted via the Funding & Tenders Portal. Legal entities from EU Member States and associated countries may participate subject to the call conditions.',
  ];
  return parts.filter(Boolean).join(' ');
};

async function searchPage(pageNumber: number, pageSize: number) {
  const query = {
    bool: {
      must: [
        { terms: { type: ['1', '2', '8'] } },
        { terms: { status: [STATUS_OPEN, STATUS_FORTHCOMING] } },
        { terms: { frameworkProgramme: [FRAMEWORK_HORIZON_EUROPE] } },
      ],
    },
  };

  const form = new FormData();
  form.append('query', Buffer.from(JSON.stringify(query)), {
    contentType: 'application/json',
    filename: 'blob',
  });
  form.append('languages', Buffer.from(JSON.stringify(['en'])), {
    contentType: 'application/json',
    filename: 'blob',
  });
  form.append('sort', Buffer.from(JSON.stringify({ order: 'DESC', field: 'startDate' })), {
    contentType: 'application/json',
    filename: 'blob',
  });
  form.append(
    'displayFields',
    Buffer.from(
      JSON.stringify([
        'identifier',
        'title',
        'status',
        'startDate',
        'deadlineDate',
        'deadlineDates',
        'deadlineModel',
        'typesOfAction',
        'programmePeriod',
        'callIdentifier',
        'keywords',
        'url',
        'frameworkProgramme',
      ])
    ),
    { contentType: 'application/json', filename: 'blob' }
  );

  const { data } = await axios.post(SEDIA_URL, form, {
    params: { apiKey: 'SEDIA', text: '***', pageSize, pageNumber },
    headers: {
      ...form.getHeaders(),
      Accept: 'application/json',
      'User-Agent': 'ResearchLab-HorizonIngest/1.0',
    },
    timeout: 60000,
  });

  return data as { totalResults?: number; results?: Array<Record<string, unknown>> };
}

const mapResult = (result: Record<string, unknown>, now: Date): HorizonTopic | null => {
  const meta = (result.metadata || {}) as Record<string, unknown>;
  const identifier = asString(first(meta, 'identifier')) || asString(first(meta, 'reference'));
  if (!identifier) return null;

  const nextDeadline = pickNextDeadline(meta, now);
  // Keep forthcoming topics that open soon even if deadline not yet set,
  // but require a future deadline for ingest into the open directory.
  if (!nextDeadline) return null;

  const title = asString(first(meta, 'title')) || asString(result.content) || identifier;
  const actionsRaw = meta.typesOfAction;
  const actions = Array.isArray(actionsRaw) ? actionsRaw.map(String) : [];
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

  return {
    external_id: identifier,
    title,
    summary: buildSummary({
      title,
      callIdentifier,
      actionType,
      deadlineModel,
      programmePeriod,
      pillar,
    }),
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
    url: portalUrl(identifier, detailUrl),
    region: 'Europe',
    country: null,
    disciplines,
    keywords: Array.from(
      new Set(['Horizon Europe', 'EU', identifier, callIdentifier, ...keywords].filter(Boolean) as string[])
    ).slice(0, 16),
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
    requirements: {
      deadline_model: deadlineModel,
      types_of_action: actions,
    },
    raw_payload: {
      provider: 'sedia',
      frameworkProgramme: FRAMEWORK_HORIZON_EUROPE,
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
};

export type FetchHorizonOptions = {
  maxPages?: number;
  pageSize?: number;
  asOf?: Date;
};

export async function fetchHorizonEuropeTopics(
  options: FetchHorizonOptions = {}
): Promise<{ totalReported: number; topics: HorizonTopic[] }> {
  const maxPages = options.maxPages ?? 10;
  const pageSize = options.pageSize ?? 50;
  const now = options.asOf ?? new Date();
  const byId = new Map<string, HorizonTopic>();
  let totalReported = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const data = await searchPage(page, pageSize);
    totalReported = data.totalResults || totalReported;
    const results = data.results || [];
    if (!results.length) break;

    for (const result of results) {
      const mapped = mapResult(result, now);
      if (!mapped) continue;
      const existing = byId.get(mapped.external_id);
      if (!existing) {
        byId.set(mapped.external_id, mapped);
        continue;
      }
      // Prefer the sooner upcoming deadline if duplicates appear
      if (
        mapped.deadline_date &&
        existing.deadline_date &&
        mapped.deadline_date < existing.deadline_date
      ) {
        byId.set(mapped.external_id, mapped);
      }
    }

    if (results.length < pageSize) break;
  }

  const topics = Array.from(byId.values()).sort((a, b) =>
    String(a.deadline_date).localeCompare(String(b.deadline_date))
  );

  return { totalReported, topics };
}
