/**
 * Scholar Sidekick — citation format, fabrication verify, retraction, export.
 * Docs: https://scholar-sidekick.com/docs
 *
 * Works anonymously (rate-limited). Optional SCHOLAR_SIDEKICK_API_KEY (ssk_…) raises limits.
 * Always falls back to local CSL when Sidekick is unavailable.
 */

import { CanonicalPaper, authorsToStrings } from './types.js';
import type { CslStyleId } from './cslFormat.js';
import { buildBibliographyFromIds, formatBibliographyCsl } from './cslFormat.js';

const BASE_URL = (
  process.env.SCHOLAR_SIDEKICK_BASE_URL || 'https://scholar-sidekick.com'
).replace(/\/$/, '');

export type SidekickCslItem = {
  id?: string;
  type?: string;
  title?: string;
  author?: Array<{ family?: string; given?: string; literal?: string }>;
  issued?: { 'date-parts'?: number[][] };
  DOI?: string;
  DOI_URL?: string;
  'container-title'?: string;
  volume?: string;
  issue?: string;
  page?: string;
  URL?: string;
  abstract?: string;
  PMID?: string;
  PMCID?: string;
};

export type SidekickVerifyVerdict = 'matched' | 'mismatch' | 'ambiguous' | 'not_found';

export type SidekickVerifyResult = {
  ok: boolean;
  verdict: SidekickVerifyVerdict;
  confidence: 'high' | 'medium' | 'low';
  matched?: { title?: string; DOI?: string; type?: string };
  mismatches?: Array<{
    field: string;
    claimed: string;
    resolved: string;
    similarity?: number;
  }>;
  error?: string;
};

export type SidekickRetractionResult = {
  ok: boolean;
  doi?: string | null;
  isRetracted: boolean;
  hasCorrections: boolean;
  hasConcern: boolean;
  notices: unknown[];
  title?: string;
  error?: string;
};

export type SidekickOaResult = {
  ok: boolean;
  doi?: string | null;
  isOa: boolean;
  oaStatus?: string | null;
  bestUrl?: string | null;
  license?: string | null;
  title?: string;
  error?: string;
};

export type SidekickIntegrity = {
  verifyVerdict?: SidekickVerifyVerdict;
  verifyConfidence?: string;
  isRetracted?: boolean;
  hasConcern?: boolean;
  isOa?: boolean;
  oaStatus?: string | null;
  oaUrl?: string | null;
  provider: 'scholar-sidekick' | 'skipped';
};

export type SidekickAuditEntry = {
  index: number;
  status?: string;
  verdict?: SidekickVerifyVerdict;
  confidence?: string;
  retraction?: {
    checked?: boolean;
    doi?: string;
    isRetracted?: boolean;
    notices?: unknown[];
  };
  matched?: { title?: string; DOI?: string };
};

export type SidekickAuditResult = {
  ok: boolean;
  entries: SidekickAuditEntry[];
  summary?: {
    total: number;
    matched: number;
    mismatch: number;
    ambiguous: number;
    not_found: number;
    errored: number;
    retracted: number;
  };
  truncated?: number;
  error?: string;
  provider: 'scholar-sidekick' | 'unavailable';
};

/** Map Writing Studio / local CSL ids → Sidekick style ids */
export function mapStyleToSidekick(style: CslStyleId | string): string {
  const s = String(style || 'apa').toLowerCase();
  const map: Record<string, string> = {
    apa: 'apa',
    vancouver: 'vancouver',
    harvard: 'harvard-cite-them-right',
    ieee: 'ieee',
    chicago: 'chicago-author-date',
    ama: 'ama',
    nature: 'nature',
    mla: 'modern-language-association',
    science: 'science',
  };
  return map[s] || s;
}

function splitAuthorName(name: string): { family?: string; given?: string; literal?: string } {
  const cleaned = name.trim();
  if (!cleaned) return { literal: 'Unknown' };
  if (cleaned.includes(',')) {
    const [family, ...rest] = cleaned.split(',');
    return { family: family.trim(), given: rest.join(',').trim() || undefined };
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { family: parts[0] };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') };
}

export function paperToCslItem(paper: CanonicalPaper, id?: string): SidekickCslItem {
  const authors = authorsToStrings(paper.authors || []);
  const year = paper.publicationYear || undefined;
  return {
    id: id || paper.id || paper.doi || undefined,
    type: 'article-journal',
    title: paper.title,
    author: authors.map(splitAuthorName),
    issued: year ? { 'date-parts': [[year]] } : undefined,
    DOI: paper.doi || undefined,
    'container-title': paper.journalName || undefined,
    volume: paper.volume || undefined,
    issue: paper.issue || undefined,
    page: paper.pages || undefined,
    URL: paper.sourceUrl || paper.openAccessUrl || paper.pdfUrl || undefined,
    abstract: paper.abstract || undefined,
    PMID: paper.pmid || undefined,
    PMCID: paper.pmcid || undefined,
  };
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const key = (process.env.SCHOLAR_SIDEKICK_API_KEY || '').trim();
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function postJson<T>(
  path: string,
  body: unknown,
  opts?: { timeoutMs?: number; expectText?: boolean }
): Promise<{ ok: boolean; status: number; data?: T; text?: string; error?: string }> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), opts?.timeoutMs ?? 12_000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (opts?.expectText) {
      const text = await res.text();
      if (!res.ok) {
        return { ok: false, status: res.status, error: text.slice(0, 300) || res.statusText };
      }
      return { ok: true, status: res.status, text };
    }
    const data = (await res.json().catch(() => null)) as T | null;
    if (!res.ok) {
      const errObj = data as { error?: string; code?: string } | null;
      return {
        ok: false,
        status: res.status,
        error: errObj?.error || errObj?.code || res.statusText,
      };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Sidekick request failed';
    return { ok: false, status: 0, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

function identifierLine(paper: CanonicalPaper): string | null {
  if (paper.doi) return paper.doi;
  if (paper.pmid) return `PMID:${paper.pmid}`;
  if (paper.pmcid) return paper.pmcid.startsWith('PMC') ? paper.pmcid : `PMC${paper.pmcid}`;
  return null;
}

export class ScholarSidekickService {
  static isConfigured(): boolean {
    return Boolean((process.env.SCHOLAR_SIDEKICK_API_KEY || '').trim());
  }

  /** Format bibliography via Sidekick; falls back to local CSL. */
  static async formatBibliography(
    papers: CanonicalPaper[],
    style: CslStyleId | string,
    orderedIds?: string[]
  ): Promise<{ bibliography: string; provider: 'scholar-sidekick' | 'local'; styleUsed: string }> {
    const ids = orderedIds?.length
      ? orderedIds
      : papers.map((p) => p.id).filter(Boolean) as string[];
    const byId: Record<string, CanonicalPaper> = {};
    for (const p of papers) {
      if (p.id) byId[p.id] = p;
    }

    const withIds = ids.map((id) => byId[id]).filter(Boolean);
    if (!withIds.length && papers.length) {
      // no ordered ids — use papers as-is
      withIds.push(...papers);
    }

    const sidekickStyle = mapStyleToSidekick(style);

    // Prefer format by identifiers (highest quality resolution)
    const idLines = withIds.map(identifierLine).filter(Boolean) as string[];
    if (idLines.length && idLines.length === withIds.length) {
      const res = await postJson<{
        ok?: boolean;
        text?: string;
        styleUsed?: string;
      }>('/api/format', {
        text: idLines.join('\n'),
        style: sidekickStyle,
        output: 'text',
      });
      if (res.ok && res.data?.text?.trim()) {
        return {
          bibliography: res.data.text.trim(),
          provider: 'scholar-sidekick',
          styleUsed: res.data.styleUsed || sidekickStyle,
        };
      }
    }

    // Format already-resolved CSL items (covers papers without DOI)
    const items = withIds.map((p, i) => paperToCslItem(p, p.id || `ref-${i}`));
    if (items.length) {
      const res = await postJson<{
        ok?: boolean;
        text?: string;
        styleUsed?: string;
      }>('/api/format-items', {
        items,
        style: sidekickStyle,
        output: 'text',
      });
      if (res.ok && res.data?.text?.trim()) {
        return {
          bibliography: res.data.text.trim(),
          provider: 'scholar-sidekick',
          styleUsed: res.data.styleUsed || sidekickStyle,
        };
      }
    }

    // Local fallback
    if (ids.length && Object.keys(byId).length) {
      return {
        bibliography: buildBibliographyFromIds(ids, byId, style),
        provider: 'local',
        styleUsed: String(style),
      };
    }
    return {
      bibliography: papers
        .map((p, i) => formatBibliographyCsl(p, style, i))
        .filter(Boolean)
        .join('\n'),
      provider: 'local',
      styleUsed: String(style),
    };
  }

  /** Fabrication check: claimed title/metadata vs resolved identifier record. */
  static async verifyClaimedPaper(paper: {
    title: string;
    doi?: string | null;
    pmid?: string | null;
    pmcid?: string | null;
    authors?: string[];
    year?: number | null;
    journal?: string | null;
  }): Promise<SidekickVerifyResult> {
    if (!paper.title?.trim()) {
      return { ok: false, verdict: 'not_found', confidence: 'low', error: 'Missing title' };
    }
    const claimed: Record<string, unknown> = {
      title: paper.title.trim(),
    };
    if (paper.doi) claimed.doi = paper.doi;
    else if (paper.pmid) claimed.pmid = String(paper.pmid).replace(/^PMID:\s*/i, '');
    else if (paper.pmcid) claimed.pmcid = paper.pmcid;
    if (paper.year) claimed.year = paper.year;
    if (paper.journal) claimed.container = paper.journal;
    if (paper.authors?.length) {
      claimed.authors = paper.authors.slice(0, 5).map(splitAuthorName);
    }

    const res = await postJson<SidekickVerifyResult>('/api/verify', { claimed });
    if (!res.ok || !res.data) {
      return {
        ok: false,
        verdict: 'not_found',
        confidence: 'low',
        error: res.error || 'Verify unavailable',
      };
    }
    return { ...res.data, ok: true };
  }

  static async checkRetraction(id: string): Promise<SidekickRetractionResult> {
    const res = await postJson<{
      ok?: boolean;
      doi?: string;
      result?: {
        isRetracted?: boolean;
        hasCorrections?: boolean;
        hasConcern?: boolean;
        notices?: unknown[];
        title?: string;
      } | null;
      reason?: string;
    }>('/api/retraction-check', { id });
    if (!res.ok || !res.data) {
      return {
        ok: false,
        isRetracted: false,
        hasCorrections: false,
        hasConcern: false,
        notices: [],
        error: res.error || 'Retraction check unavailable',
      };
    }
    const r = res.data.result;
    if (!r) {
      return {
        ok: true,
        doi: res.data.doi,
        isRetracted: false,
        hasCorrections: false,
        hasConcern: false,
        notices: [],
      };
    }
    return {
      ok: true,
      doi: res.data.doi,
      isRetracted: Boolean(r.isRetracted),
      hasCorrections: Boolean(r.hasCorrections),
      hasConcern: Boolean(r.hasConcern),
      notices: r.notices || [],
      title: r.title,
    };
  }

  /** Unpaywall OA status via Sidekick. */
  static async checkOpenAccess(id: string): Promise<SidekickOaResult> {
    const res = await postJson<{
      ok?: boolean;
      doi?: string;
      result?: {
        isOa?: boolean;
        oaStatus?: string;
        title?: string;
        bestLocation?: {
          url?: string;
          license?: string;
          hostType?: string;
          version?: string;
        } | null;
      } | null;
    }>('/api/oa-check', { id });
    if (!res.ok || !res.data) {
      return {
        ok: false,
        isOa: false,
        error: res.error || 'OA check unavailable',
      };
    }
    const r = res.data.result;
    if (!r) {
      return { ok: true, doi: res.data.doi, isOa: false, oaStatus: null };
    }
    return {
      ok: true,
      doi: res.data.doi,
      isOa: Boolean(r.isOa),
      oaStatus: r.oaStatus || null,
      bestUrl: r.bestLocation?.url || null,
      license: r.bestLocation?.license || null,
      title: r.title,
    };
  }

  /** Enrich candidates with Sidekick integrity (verify + retraction + OA). Best-effort. */
  static async enrichCandidatesIntegrity<
    T extends {
      title: string;
      doi?: string | null;
      pmid?: string | null;
      authors?: string[];
      year?: number | null;
      journal?: string | null;
    },
  >(
    candidates: T[],
    opts?: { limit?: number }
  ): Promise<Array<T & { integrity?: SidekickIntegrity }>> {
    const out: Array<T & { integrity?: SidekickIntegrity }> = [];
    const limit = Math.min(Math.max(opts?.limit ?? 8, 1), 12);

    // Cap concurrent Sidekick calls to stay within anonymous burst limits
    for (const c of candidates.slice(0, limit)) {
      const pmid = c.pmid ? String(c.pmid).replace(/^PMID:\s*/i, '') : null;
      const id =
        (c.doi && String(c.doi).trim()) ||
        (pmid ? `PMID:${pmid}` : null);
      if (!id) {
        out.push({ ...c, integrity: { provider: 'skipped' } });
        continue;
      }
      try {
        const [verify, retraction, oa] = await Promise.all([
          this.verifyClaimedPaper({
            title: c.title,
            doi: c.doi,
            pmid: c.pmid,
            authors: c.authors,
            year: c.year,
            journal: c.journal,
          }),
          this.checkRetraction(id),
          this.checkOpenAccess(id),
        ]);
        out.push({
          ...c,
          integrity: {
            verifyVerdict: verify.ok ? verify.verdict : undefined,
            verifyConfidence: verify.ok ? verify.confidence : undefined,
            isRetracted: retraction.ok ? retraction.isRetracted : undefined,
            hasConcern: retraction.ok
              ? retraction.hasConcern || retraction.hasCorrections
              : undefined,
            isOa: oa.ok ? oa.isOa : undefined,
            oaStatus: oa.ok ? oa.oaStatus : undefined,
            oaUrl: oa.ok ? oa.bestUrl : undefined,
            provider: 'scholar-sidekick',
          },
        });
      } catch {
        out.push({ ...c, integrity: { provider: 'skipped' } });
      }
    }
    for (const c of candidates.slice(limit)) {
      out.push({ ...c, integrity: { provider: 'skipped' } });
    }
    return out;
  }

  /**
   * Audit claims in chunks of 25 (Sidekick hard cap). Merges entries + summary.
   */
  static async auditClaims(
    claims: Array<{
      title: string;
      doi?: string | null;
      pmid?: string | null;
      year?: number | null;
      journal?: string | null;
    }>
  ): Promise<SidekickAuditResult> {
    const payloadClaims = claims
      .filter((c) => c.title && (c.doi || c.pmid))
      .map((c) => {
        const row: Record<string, unknown> = { title: c.title };
        if (c.doi) row.doi = c.doi;
        else if (c.pmid) row.pmid = String(c.pmid).replace(/^PMID:\s*/i, '');
        if (c.year) row.year = c.year;
        if (c.journal) row.container = c.journal;
        return row;
      });

    if (!payloadClaims.length) {
      return {
        ok: false,
        entries: [],
        error: 'No references with DOI/PMID to audit',
        provider: 'unavailable',
      };
    }

    const CHUNK = 25;
    const allEntries: SidekickAuditEntry[] = [];
    let anyOk = false;
    let lastError: string | undefined;
    const summary = {
      total: 0,
      matched: 0,
      mismatch: 0,
      ambiguous: 0,
      not_found: 0,
      errored: 0,
      retracted: 0,
    };

    for (let i = 0; i < payloadClaims.length; i += CHUNK) {
      const chunk = payloadClaims.slice(i, i + CHUNK);
      const res = await postJson<{
        ok?: boolean;
        entries?: SidekickAuditEntry[];
        summary?: SidekickAuditResult['summary'];
        truncated?: number;
      }>('/api/audit', {
        claims: chunk,
        options: { checks: ['retraction'] },
      });

      if (!res.ok || !res.data) {
        lastError = res.error || 'Audit unavailable';
        summary.errored += chunk.length;
        continue;
      }
      anyOk = true;
      const entries = (res.data.entries || []).map((e, idx) => ({
        ...e,
        index: (e.index ?? idx + 1) + i,
      }));
      allEntries.push(...entries);
      const s = res.data.summary;
      if (s) {
        summary.total += s.total || 0;
        summary.matched += s.matched || 0;
        summary.mismatch += s.mismatch || 0;
        summary.ambiguous += s.ambiguous || 0;
        summary.not_found += s.not_found || 0;
        summary.errored += s.errored || 0;
        summary.retracted += s.retracted || 0;
      } else {
        summary.total += entries.length;
      }
    }

    if (!anyOk) {
      return {
        ok: false,
        entries: [],
        error: lastError || 'Audit unavailable',
        provider: 'unavailable',
      };
    }

    return {
      ok: true,
      entries: allEntries,
      summary,
      truncated: 0,
      provider: 'scholar-sidekick',
    };
  }

  static async exportCitations(
    papers: CanonicalPaper[],
    format:
      | 'bibtex'
      | 'ris'
      | 'csl-json'
      | 'nbib'
      | 'csv'
      | 'txt'
      | 'endnote-xml'
      | 'refworks'
      | 'rdf' = 'bibtex',
    style?: string
  ): Promise<{ content: string; provider: 'scholar-sidekick' | 'local'; format: string }> {
    const idLines = papers.map(identifierLine).filter(Boolean) as string[];
    if (idLines.length) {
      const res = await postJson<never>(
        '/api/export',
        {
          text: idLines.join('\n'),
          format,
          ...(style ? { style: mapStyleToSidekick(style) } : {}),
        },
        { expectText: true, timeoutMs: 20_000 }
      );
      if (res.ok && res.text?.trim()) {
        return { content: res.text.trim(), provider: 'scholar-sidekick', format };
      }
    }

    const items = papers.map((p, i) => paperToCslItem(p, p.id || `ref-${i}`));
    if (items.length) {
      const res = await postJson<never>(
        '/api/export',
        {
          items,
          format,
          ...(style ? { style: mapStyleToSidekick(style) } : {}),
        },
        { expectText: true, timeoutMs: 20_000 }
      );
      if (res.ok && res.text?.trim()) {
        return { content: res.text.trim(), provider: 'scholar-sidekick', format };
      }
    }

    // Minimal local BibTeX fallback
    if (format === 'bibtex') {
      const blocks = papers.map((p, i) => {
        const authors = authorsToStrings(p.authors || []).join(' and ') || 'Unknown';
        const key =
          `${(authors.split(/\s+/).pop() || 'ref').replace(/[^a-zA-Z0-9]/g, '')}${p.publicationYear || i}`.slice(
            0,
            40
          );
        const fields = [
          `  title = {${p.title}}`,
          `  author = {${authors}}`,
          p.publicationYear ? `  year = {${p.publicationYear}}` : null,
          p.journalName ? `  journal = {${p.journalName}}` : null,
          p.volume ? `  volume = {${p.volume}}` : null,
          p.issue ? `  number = {${p.issue}}` : null,
          p.pages ? `  pages = {${p.pages}}` : null,
          p.doi ? `  doi = {${p.doi}}` : null,
        ].filter(Boolean);
        return `@article{${key},\n${fields.join(',\n')}\n}`;
      });
      return { content: blocks.join('\n\n'), provider: 'local', format };
    }

    return {
      content: papers.map((p, i) => formatBibliographyCsl(p, style || 'apa', i)).join('\n'),
      provider: 'local',
      format: 'txt',
    };
  }
}
