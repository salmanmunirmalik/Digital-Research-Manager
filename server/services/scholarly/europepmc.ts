/**
 * Europe PMC provider — biomedical search + OA full text when permitted.
 */

import axios from 'axios';
import { CanonicalPaper, normalizeDoi, normalizeTitle } from './types.js';

const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';

function mapResult(r: any): CanonicalPaper {
  const doi = normalizeDoi(r.doi);
  const isOA = Boolean(r.isOpenAccess === 'Y' || r.isOpenAccess === true);
  return {
    title: r.title || 'Untitled',
    abstract: r.abstractText || null,
    publicationYear: r.pubYear ? Number(r.pubYear) : null,
    publicationDate: r.firstPublicationDate || null,
    doi,
    pmid: r.pmid || null,
    pmcid: r.pmcid || null,
    journalName: r.journalTitle || null,
    volume: r.journalVolume || null,
    issue: r.issue || null,
    pages: r.pageInfo || null,
    authors: String(r.authorString || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name })),
    citationCount: r.citedByCount != null ? Number(r.citedByCount) : null,
    isOpenAccess: isOA,
    openAccessStatus: isOA ? 'open' : null,
    pdfUrl: isOA && r.pmcid ? `https://www.ncbi.nlm.nih.gov/pmc/articles/${r.pmcid}/pdf/` : null,
    sourceUrl: r.pmid
      ? `https://europepmc.org/article/MED/${r.pmid}`
      : doi
        ? `https://doi.org/${doi}`
        : null,
    metadataSource: 'europepmc',
    abstractAvailable: Boolean(r.abstractText),
    fullTextAvailable: Boolean(isOA && r.hasPDF === 'Y'),
    pdfAvailable: Boolean(isOA && (r.hasPDF === 'Y' || r.pmcid)),
    pdfAccessType: isOA ? 'open_access' : 'none',
    normalizedTitle: normalizeTitle(r.title),
  };
}

export class EuropePmcProvider {
  async search(query: string, limit = 15): Promise<CanonicalPaper[]> {
    try {
      const { data } = await axios.get(`${BASE}/search`, {
        params: {
          query,
          format: 'json',
          pageSize: limit,
          resultType: 'core',
        },
        timeout: 15000,
      });
      return (data?.resultList?.result || []).map(mapResult);
    } catch (e) {
      console.warn('Europe PMC search failed:', (e as Error).message);
      return [];
    }
  }

  async getByPmid(pmid: string): Promise<CanonicalPaper | null> {
    const results = await this.search(`EXT_ID:${pmid.replace(/\D/g, '')} AND SRC:MED`, 1);
    return results[0] || null;
  }

  /** Fetch legally available full text XML/plain when OA. */
  async fetchFullText(pmcid: string): Promise<string | null> {
    const clean = pmcid.replace(/^PMC/i, '');
    try {
      const { data } = await axios.get(`${BASE}/PMC${clean}/fullTextXML`, {
        timeout: 20000,
        responseType: 'text',
        transformResponse: [(d) => d],
      });
      const text = String(data)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text.slice(0, 500_000) || null;
    } catch {
      return null;
    }
  }
}

export const europePmcProvider = new EuropePmcProvider();
