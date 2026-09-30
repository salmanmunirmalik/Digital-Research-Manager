/**
 * PubMed / NCBI E-utilities provider.
 */

import axios from 'axios';
import { CanonicalPaper, normalizeDoi, normalizeTitle } from './types.js';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

function authParams() {
  const params: Record<string, string> = {
    tool: 'digital_research_manager',
    email: process.env.NCBI_EMAIL || process.env.OPENALEX_MAILTO || 'research@digitalresearchmanager.com',
  };
  if (process.env.NCBI_API_KEY) params.api_key = process.env.NCBI_API_KEY;
  return params;
}

export class PubMedProvider {
  async search(query: string, limit = 15): Promise<CanonicalPaper[]> {
    try {
      const { data: idsXml } = await axios.get(`${EUTILS}/esearch.fcgi`, {
        params: {
          ...authParams(),
          db: 'pubmed',
          term: query,
          retmax: limit,
          retmode: 'json',
        },
        timeout: 12000,
      });
      const ids: string[] = idsXml?.esearchresult?.idlist || [];
      if (!ids.length) return [];
      return this.fetchSummaries(ids);
    } catch (e) {
      console.warn('PubMed search failed:', (e as Error).message);
      return [];
    }
  }

  async getByPmid(pmid: string): Promise<CanonicalPaper | null> {
    const clean = pmid.replace(/\D/g, '');
    if (!clean) return null;
    const papers = await this.fetchSummaries([clean]);
    return papers[0] || null;
  }

  private async fetchSummaries(ids: string[]): Promise<CanonicalPaper[]> {
    const { data } = await axios.get(`${EUTILS}/esummary.fcgi`, {
      params: {
        ...authParams(),
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'json',
      },
      timeout: 12000,
    });
    const result = data?.result || {};
    const papers: CanonicalPaper[] = [];
    for (const id of ids) {
      const r = result[id];
      if (!r || r.error) continue;
      const authors = (r.authors || []).map((a: any) => ({ name: a.name || 'Unknown' }));
      const doi =
        (r.articleids || []).find((x: any) => x.idtype === 'doi')?.value ||
        null;
      papers.push({
        title: r.title || 'Untitled',
        abstract: null,
        publicationYear: r.pubdate ? parseInt(String(r.pubdate).slice(0, 4), 10) : null,
        publicationDate: r.pubdate || null,
        doi: normalizeDoi(doi),
        pmid: String(id),
        journalName: r.fulljournalname || r.source || null,
        volume: r.volume || null,
        issue: r.issue || null,
        pages: r.pages || null,
        authors,
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        metadataSource: 'pubmed',
        normalizedTitle: normalizeTitle(r.title),
      });
    }

    // Enrich abstracts via efetch (batched)
    try {
      const { data: xml } = await axios.get(`${EUTILS}/efetch.fcgi`, {
        params: {
          ...authParams(),
          db: 'pubmed',
          id: ids.join(','),
          rettype: 'abstract',
          retmode: 'xml',
        },
        timeout: 15000,
        responseType: 'text',
      });
      const abstractMap = parseAbstractsFromXml(String(xml));
      for (const p of papers) {
        if (p.pmid && abstractMap[p.pmid]) {
          p.abstract = abstractMap[p.pmid];
          p.abstractAvailable = true;
        }
      }
    } catch {
      /* abstracts optional */
    }

    return papers;
  }
}

function parseAbstractsFromXml(xml: string): Record<string, string> {
  const out: Record<string, string> = {};
  const articles = xml.split(/<PubmedArticle>/i).slice(1);
  for (const chunk of articles) {
    const pmid = chunk.match(/<PMID[^>]*>(\d+)<\/PMID>/i)?.[1];
    if (!pmid) continue;
    const texts = [...chunk.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)].map(
      (m) => m[1].replace(/<[^>]+>/g, '').trim()
    );
    if (texts.length) out[pmid] = texts.join(' ');
  }
  return out;
}

export const pubMedProvider = new PubMedProvider();
