/**
 * Crossref provider — wraps existing doiIntegration CrossRefService.
 */

import { CrossRefService } from '../doiIntegration.js';
import { CanonicalPaper, normalizeDoi, normalizeTitle } from './types.js';

const crossref = new CrossRefService();

function mapPaper(p: any): CanonicalPaper {
  const authors = (p.authors || []).map((a: any) => ({
    name:
      typeof a === 'string'
        ? a
        : [a.lastName, a.firstName].filter(Boolean).join(', ') || a.name || 'Unknown',
  }));
  return {
    title: p.title,
    abstract: p.abstract || null,
    publicationYear: p.year || null,
    publicationDate: p.publicationDate || null,
    doi: normalizeDoi(p.doi),
    journalName: p.journal || null,
    volume: p.volume || null,
    issue: p.issue || null,
    pages: p.pages || null,
    authors,
    citationCount: p.citationCount ?? null,
    sourceUrl: p.url || (p.doi ? `https://doi.org/${normalizeDoi(p.doi)}` : null),
    pdfUrl: p.pdfUrl || null,
    metadataSource: 'crossref',
    abstractAvailable: Boolean(p.abstract),
    pdfAvailable: Boolean(p.pdfUrl),
    normalizedTitle: normalizeTitle(p.title),
  };
}

export class CrossrefProvider {
  async getByDoi(doi: string): Promise<CanonicalPaper | null> {
    const paper = await crossref.fetchByDOI(doi);
    return paper ? mapPaper(paper) : null;
  }

  async search(query: string, limit = 10): Promise<CanonicalPaper[]> {
    const papers = await crossref.searchPapers(query, limit);
    return papers.map(mapPaper);
  }
}

export const crossrefProvider = new CrossrefProvider();
