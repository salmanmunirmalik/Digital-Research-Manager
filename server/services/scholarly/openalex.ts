/**
 * OpenAlex scholarly provider — primary discovery engine.
 * https://docs.openalex.org/
 */

import axios from 'axios';
import { CanonicalPaper, normalizeDoi, normalizeTitle } from './types.js';

const BASE = 'https://api.openalex.org';

function mailto(): string {
  return process.env.OPENALEX_MAILTO || process.env.NCBI_EMAIL || 'research@digitalresearchmanager.com';
}

function headers() {
  const h: Record<string, string> = { Accept: 'application/json' };
  const key = process.env.OPENALEX_API_KEY;
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

function mapWork(w: any): CanonicalPaper {
  const doi = normalizeDoi(w.doi || w.ids?.doi);
  const authors = (w.authorships || [])
    .map((a: any) => ({
      name: a.author?.display_name || '',
      orcid: a.author?.orcid || undefined,
      affiliation: a.institutions?.[0]?.display_name,
    }))
    .filter((a: { name: string }) => a.name && !/^unknown$/i.test(a.name));
  const oaUrl =
    w.open_access?.oa_url ||
    w.primary_location?.pdf_url ||
    w.best_oa_location?.pdf_url ||
    null;
  const pdfUrl = w.primary_location?.pdf_url || w.best_oa_location?.pdf_url || oaUrl;
  const year = w.publication_year || null;
  return {
    title: (() => {
      const candidates = [w.title, w.display_name]
        .map((t: unknown) => String(t || '').trim())
        .filter(Boolean);
      const isPlaceholder = (t: string) =>
        /^(full\s*length\s*article|original\s*article|research\s*article|brief\s*report|editorial|untitled|article)$/i.test(
          t
        );
      return (
        candidates.find((t) => !isPlaceholder(t)) ||
        candidates[0] ||
        'Untitled'
      );
    })(),
    abstract: invertAbstract(w.abstract_inverted_index) || null,
    publicationType: w.type || null,
    publicationYear: year,
    publicationDate: w.publication_date || null,
    doi,
    pmid: w.ids?.pmid?.replace?.('https://pubmed.ncbi.nlm.nih.gov/', '') || null,
    pmcid: w.ids?.pmcid || null,
    openalexId: w.id?.replace?.('https://openalex.org/', '') || w.id || null,
    journalName: w.primary_location?.source?.display_name || null,
    journalIssn: w.primary_location?.source?.issn_l || null,
    publisher: w.primary_location?.source?.host_organization_name || null,
    volume: w.biblio?.volume || null,
    issue: w.biblio?.issue || null,
    pages:
      w.biblio?.first_page && w.biblio?.last_page
        ? `${w.biblio.first_page}-${w.biblio.last_page}`
        : w.biblio?.first_page || null,
    authors,
    topics: (w.topics || []).map((t: any) => t.display_name).filter(Boolean),
    keywords: (w.keywords || []).map((k: any) => k.display_name || k).filter(Boolean),
    citationCount: w.cited_by_count ?? 0,
    isOpenAccess: Boolean(w.open_access?.is_oa),
    openAccessStatus: w.open_access?.oa_status || null,
    openAccessUrl: oaUrl,
    pdfUrl: pdfUrl || null,
    sourceUrl: w.id || (doi ? `https://doi.org/${doi}` : null),
    metadataSource: 'openalex',
    abstractAvailable: Boolean(invertAbstract(w.abstract_inverted_index)),
    pdfAvailable: Boolean(pdfUrl),
    pdfAccessType: pdfUrl ? 'open_access' : 'none',
    normalizedTitle: normalizeTitle(w.title || w.display_name),
  };
}

function invertAbstract(inv: Record<string, number[]> | undefined): string | null {
  if (!inv || typeof inv !== 'object') return null;
  const pairs: Array<{ word: string; pos: number }> = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) pairs.push({ word, pos });
  }
  if (!pairs.length) return null;
  pairs.sort((a, b) => a.pos - b.pos);
  return pairs.map((p) => p.word).join(' ');
}

export class OpenAlexProvider {
  async search(opts: {
    query: string;
    limit?: number;
    yearFrom?: number;
    yearTo?: number;
    openAccessOnly?: boolean;
    sort?: 'relevance' | 'newest' | 'oldest' | 'cited';
  }): Promise<CanonicalPaper[]> {
    const limit = Math.min(50, Math.max(1, opts.limit || 20));
    const filters: string[] = [];
    if (opts.yearFrom) filters.push(`from_publication_date:${opts.yearFrom}-01-01`);
    if (opts.yearTo) filters.push(`to_publication_date:${opts.yearTo}-12-31`);
    if (opts.openAccessOnly) filters.push('is_oa:true');

    let sort = 'relevance_score:desc';
    if (opts.sort === 'newest') sort = 'publication_date:desc';
    if (opts.sort === 'oldest') sort = 'publication_date:asc';
    if (opts.sort === 'cited') sort = 'cited_by_count:desc';

    const params: Record<string, string | number> = {
      search: opts.query,
      per_page: limit,
      sort,
      mailto: mailto(),
    };
    if (filters.length) params.filter = filters.join(',');

    const { data } = await axios.get(`${BASE}/works`, {
      params,
      headers: headers(),
      timeout: 15000,
    });
    return (data.results || []).map(mapWork);
  }

  async getByDoi(doi: string): Promise<CanonicalPaper | null> {
    const cleaned = normalizeDoi(doi);
    if (!cleaned) return null;
    try {
      const { data } = await axios.get(`${BASE}/works/doi:${encodeURIComponent(cleaned)}`, {
        params: { mailto: mailto() },
        headers: headers(),
        timeout: 12000,
      });
      return mapWork(data);
    } catch {
      return null;
    }
  }

  async getByOpenAlexId(id: string): Promise<CanonicalPaper | null> {
    const clean = id.replace(/^https?:\/\/openalex\.org\//i, '');
    try {
      const { data } = await axios.get(`${BASE}/works/${clean}`, {
        params: { mailto: mailto() },
        headers: headers(),
        timeout: 12000,
      });
      return mapWork(data);
    } catch {
      return null;
    }
  }

  async related(openalexId: string, limit = 10): Promise<{
    related: CanonicalPaper[];
    referenced: string[];
    citedByCount: number;
  }> {
    const work = await this.getByOpenAlexId(openalexId);
    if (!work?.openalexId) return { related: [], referenced: [], citedByCount: 0 };
    const related = await this.search({
      query: work.title,
      limit,
      sort: 'cited',
    });
    return {
      related: related.filter((r) => r.openalexId !== work.openalexId).slice(0, limit),
      referenced: [],
      citedByCount: work.citationCount || 0,
    };
  }

  async citedBy(openalexId: string, limit = 15): Promise<CanonicalPaper[]> {
    const clean = openalexId.replace(/^https?:\/\/openalex\.org\//i, '');
    try {
      const { data } = await axios.get(`${BASE}/works`, {
        params: {
          filter: `cites:${clean}`,
          per_page: limit,
          sort: 'cited_by_count:desc',
          mailto: mailto(),
        },
        headers: headers(),
        timeout: 15000,
      });
      return (data.results || []).map(mapWork);
    } catch {
      return [];
    }
  }

  async references(openalexId: string, limit = 15): Promise<CanonicalPaper[]> {
    const clean = openalexId.replace(/^https?:\/\/openalex\.org\//i, '');
    try {
      const { data } = await axios.get(`${BASE}/works/${clean}`, {
        params: { mailto: mailto() },
        headers: headers(),
        timeout: 12000,
      });
      const ids = (data.referenced_works || []).slice(0, limit) as string[];
      const papers: CanonicalPaper[] = [];
      for (const id of ids.slice(0, 8)) {
        const p = await this.getByOpenAlexId(id);
        if (p) papers.push(p);
      }
      return papers;
    } catch {
      return [];
    }
  }
}

export const openAlexProvider = new OpenAlexProvider();
