/**
 * DOI Integration Service
 * Auto-fetch papers from CrossRef, PubMed, arXiv, and other academic databases
 * Implements Salman's suggestion: Fetch papers by DOI with option to save full paper or AI summary
 */

import axios from 'axios';

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface Paper {
  doi?: string;
  pmid?: string;
  arxivId?: string;
  title: string;
  authors: Author[];
  abstract?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  year: number;
  publicationDate?: string;
  url?: string;
  pdfUrl?: string;
  citationCount?: number;
  keywords?: string[];
  references?: string[];
  meshTerms?: string[]; // For PubMed
  subjects?: string[]; // For arXiv
  // AI-generated content
  aiSummary?: string;
  keyFindings?: string[];
  methodology?: string;
  relevanceScore?: number;
}

interface Author {
  firstName: string;
  lastName: string;
  affiliation?: string;
  orcid?: string;
}

interface CrossRefResponse {
  message: {
    title: string[];
    author: any[];
    abstract?: string;
    'container-title'?: string[];
    volume?: string;
    issue?: string;
    page?: string;
    published: any;
    DOI: string;
    URL?: string;
    'is-referenced-by-count'?: number;
    subject?: string[];
    reference?: any[];
  };
}

interface PubMedArticle {
  MedlineCitation: {
    PMID: { _text: string };
    Article: {
      ArticleTitle: { _text: string };
      Abstract?: { AbstractText: any };
      AuthorList?: { Author: any[] };
      Journal: {
        Title: { _text: string };
        JournalIssue: {
          Volume?: { _text: string };
          Issue?: { _text: string };
          PubDate: any;
        };
      };
      Pagination?: { MedlinePgn: { _text: string } };
    };
    MeshHeadingList?: { MeshHeading: any[] };
    KeywordList?: { Keyword: any[] };
  };
  PubmedData?: {
    ArticleIdList?: { ArticleId: any[] };
  };
}

// ==============================================
// CROSSREF API INTEGRATION
// ==============================================

export class CrossRefService {
  private baseUrl = 'https://api.crossref.org/works';
  private email = 'digital-research-manager@researchlab.com'; // Polite API access

  async fetchByDOI(doi: string): Promise<Paper | null> {
    try {
      const cleanDoi = this.cleanDOI(doi);
      const response = await axios.get<CrossRefResponse>(
        `${this.baseUrl}/${encodeURIComponent(cleanDoi)}`,
        {
          params: { mailto: this.email },
          timeout: 10000
        }
      );

      return this.parseCrossRefResponse(response.data);
    } catch (error: any) {
      console.error('CrossRef API error:', error.message);
      return null;
    }
  }

  async searchPapers(query: string, limit: number = 10): Promise<Paper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}`, {
        params: {
          query: query,
          rows: limit,
          mailto: this.email
        },
        timeout: 10000
      });

      if (response.data?.message?.items) {
        return response.data.message.items.map((item: any) => 
          this.parseCrossRefItem(item)
        ).filter((paper: Paper | null) => paper !== null) as Paper[];
      }

      return [];
    } catch (error: any) {
      console.error('CrossRef search error:', error.message);
      return [];
    }
  }

  async fetchByAuthorORCID(orcid: string): Promise<Paper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}`, {
        params: {
          filter: `orcid:${orcid}`,
          rows: 100,
          mailto: this.email
        },
        timeout: 15000
      });

      if (response.data?.message?.items) {
        return response.data.message.items.map((item: any) => 
          this.parseCrossRefItem(item)
        ).filter((paper: Paper | null) => paper !== null) as Paper[];
      }

      return [];
    } catch (error: any) {
      console.error('CrossRef ORCID fetch error:', error.message);
      return [];
    }
  }

  private parseCrossRefResponse(data: CrossRefResponse): Paper {
    const msg = data.message;
    
    return {
      doi: msg.DOI,
      title: Array.isArray(msg.title) ? msg.title[0] : msg.title,
      authors: this.parseAuthors(msg.author || []),
      abstract: msg.abstract,
      journal: msg['container-title']?.[0],
      volume: msg.volume,
      issue: msg.issue,
      pages: msg.page,
      year: this.extractYear(msg.published),
      publicationDate: this.formatDate(msg.published),
      url: msg.URL,
      citationCount: msg['is-referenced-by-count'],
      keywords: msg.subject || [],
    };
  }

  private parseCrossRefItem(item: any): Paper | null {
    try {
      return this.parseCrossRefResponse({ message: item });
    } catch (error) {
      return null;
    }
  }

  private parseAuthors(authors: any[]): Author[] {
    return authors.map(author => ({
      firstName: author.given || '',
      lastName: author.family || '',
      affiliation: author.affiliation?.[0]?.name,
      orcid: author.ORCID?.replace('http://orcid.org/', '')
    }));
  }

  private extractYear(published: any): number {
    if (published?.['date-parts']?.[0]?.[0]) {
      return published['date-parts'][0][0];
    }
    return new Date().getFullYear();
  }

  private formatDate(published: any): string | undefined {
    if (published?.['date-parts']?.[0]) {
      const parts = published['date-parts'][0];
      return `${parts[0]}-${String(parts[1] || 1).padStart(2, '0')}-${String(parts[2] || 1).padStart(2, '0')}`;
    }
    return undefined;
  }

  private cleanDOI(doi: string): string {
    // Remove common prefixes
    return doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, '');
  }
}

// ==============================================
// PUBMED API INTEGRATION
// ==============================================

export class PubMedService {
  private baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

  async fetchByPMID(pmid: string): Promise<Paper | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/efetch.fcgi`, {
        params: {
          db: 'pubmed',
          id: pmid,
          retmode: 'xml'
        },
        timeout: 10000
      });

      return this.parsePubMedXML(response.data);
    } catch (error: any) {
      console.error('PubMed API error:', error.message);
      return null;
    }
  }

  async search(query: string, limit: number = 10): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/esearch.fcgi`, {
        params: {
          db: 'pubmed',
          term: query,
          retmax: limit,
          retmode: 'json'
        },
        timeout: 10000
      });

      return response.data?.esearchresult?.idlist || [];
    } catch (error: any) {
      console.error('PubMed search error:', error.message);
      return [];
    }
  }

  async fetchByAuthorName(authorName: string, limit: number = 50): Promise<string[]> {
    return this.search(`${authorName}[Author]`, limit);
  }

  private parsePubMedXML(xml: string): Paper | null {
    // Simplified XML parsing - in production, use xml2js or similar library
    // This is a placeholder implementation
    try {
      const titleMatch = xml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
      const pmidMatch = xml.match(/<PMID.*?>(.*?)<\/PMID>/);
      
      if (!titleMatch || !pmidMatch) return null;

      return {
        pmid: pmidMatch[1],
        title: titleMatch[1],
        authors: [], // Would parse from XML
        year: new Date().getFullYear(), // Would parse from XML
      };
    } catch (error) {
      return null;
    }
  }
}

// ==============================================
// ARXIV API INTEGRATION
// ==============================================

export class ArXivService {
  private baseUrl = 'http://export.arxiv.org/api/query';

  async fetchByArXivId(arxivId: string): Promise<Paper | null> {
    try {
      const cleanId = arxivId.replace(/^arxiv:/i, '').replace(/^https?:\/\/arxiv\.org\/abs\//i, '');
      const response = await axios.get(this.baseUrl, {
        params: {
          id_list: cleanId,
          max_results: 1
        },
        timeout: 10000
      });

      return this.parseArXivAtom(response.data);
    } catch (error: any) {
      console.error('arXiv API error:', error.message);
      return null;
    }
  }

  async search(query: string, limit: number = 10): Promise<Paper[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          search_query: `all:${query}`,
          max_results: limit,
          sortBy: 'relevance'
        },
        timeout: 10000
      });

      return this.parseArXivAtomFeed(response.data);
    } catch (error: any) {
      console.error('arXiv search error:', error.message);
      return [];
    }
  }

  private parseArXivAtom(atom: string): Paper | null {
    // Simplified ATOM parsing - in production, use xml2js
    try {
      const titleMatch = atom.match(/<title>(.*?)<\/title>/);
      const summaryMatch = atom.match(/<summary>(.*?)<\/summary>/s);
      const publishedMatch = atom.match(/<published>(.*?)<\/published>/);
      const idMatch = atom.match(/<id>(.*?)<\/id>/);

      if (!titleMatch || !idMatch) return null;

      const arxivId = idMatch[1].split('/').pop()?.replace('v', '');
      
      return {
        arxivId: arxivId,
        title: titleMatch[1].replace(/\s+/g, ' ').trim(),
        abstract: summaryMatch?.[1].replace(/\s+/g, ' ').trim(),
        year: publishedMatch ? new Date(publishedMatch[1]).getFullYear() : new Date().getFullYear(),
        authors: [], // Would parse from ATOM
        url: idMatch[1],
        pdfUrl: idMatch[1].replace('/abs/', '/pdf/') + '.pdf'
      };
    } catch (error) {
      return null;
    }
  }

  private parseArXivAtomFeed(atom: string): Paper[] {
    // Would parse multiple entries from ATOM feed
    // Placeholder implementation
    return [];
  }
}

// ==============================================
// UNIFIED PAPER FETCHING SERVICE
// ==============================================

export class PaperFetchingService {
  private crossRef: CrossRefService;
  private pubMed: PubMedService;
  private arXiv: ArXivService;

  constructor() {
    this.crossRef = new CrossRefService();
    this.pubMed = new PubMedService();
    this.arXiv = new ArXivService();
  }

  /**
   * Smart paper fetching - detects identifier type and fetches from appropriate source
   */
  async fetchPaper(identifier: string): Promise<Paper | null> {
    // Detect identifier type
    if (this.isDOI(identifier)) {
      return this.crossRef.fetchByDOI(identifier);
    } else if (this.isPMID(identifier)) {
      return this.pubMed.fetchByPMID(identifier);
    } else if (this.isArXivId(identifier)) {
      return this.arXiv.fetchByArXivId(identifier);
    }

    // If no specific format detected, try search across all
    const papers = await this.searchAcrossAll(identifier);
    return papers.length > 0 ? papers[0] : null;
  }

  /**
   * Fetch all papers by author's ORCID
   */
  async fetchPapersByORCID(orcid: string): Promise<Paper[]> {
    try {
      const papers = await this.crossRef.fetchByAuthorORCID(orcid);
      return papers;
    } catch (error) {
      console.error('Error fetching papers by ORCID:', error);
      return [];
    }
  }

  /**
   * Search across all databases
   */
  async searchAcrossAll(query: string, limit: number = 20): Promise<Paper[]> {
    const results = await Promise.allSettled([
      this.crossRef.searchPapers(query, limit),
      this.arXiv.search(query, limit / 2),
    ]);

    const papers: Paper[] = [];
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        papers.push(...result.value);
      }
    });

    // Remove duplicates by DOI/PMID/arXivId
    return this.deduplicatePapers(papers);
  }

  /**
   * Generate AI summary for a paper (placeholder for AI integration)
   */
  async generateAISummary(paper: Paper): Promise<string> {
    // This would integrate with OpenAI/Together AI
    // Placeholder implementation
    return `AI Summary: This paper titled "${paper.title}" was published in ${paper.year}. ${paper.abstract ? paper.abstract.substring(0, 200) + '...' : 'Abstract not available.'}`;
  }

  /**
   * Extract key findings using AI (placeholder)
   */
  async extractKeyFindings(paper: Paper): Promise<string[]> {
    // This would use AI to analyze the paper
    // Placeholder implementation
    return [
      'Key finding 1 from the paper',
      'Key finding 2 from the paper',
      'Key finding 3 from the paper'
    ];
  }

  /**
   * Extract methodology using AI (placeholder)
   */
  async extractMethodology(paper: Paper): Promise<string> {
    // This would use AI to extract methodology
    // Placeholder implementation
    return 'Methodology: The study employed...';
  }

  /**
   * Calculate relevance to user's work (placeholder)
   */
  async calculateRelevance(paper: Paper, userProfile: any): Promise<number> {
    // This would use AI to match paper to user's research interests
    // Returns score 0-100
    // Placeholder implementation
    return Math.floor(Math.random() * 100);
  }

  // Helper methods
  private isDOI(str: string): boolean {
    return /^(https?:\/\/)?(dx\.)?doi\.org\/10\.\d+/i.test(str) || 
           /^10\.\d+\/.+/.test(str);
  }

  private isPMID(str: string): boolean {
    return /^\d{7,8}$/.test(str.trim()) || 
           /pmid:?\s*\d{7,8}/i.test(str);
  }

  private isArXivId(str: string): boolean {
    return /^(arxiv:)?(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/i.test(str) ||
           /arxiv\.org\/abs\//i.test(str);
  }

  private deduplicatePapers(papers: Paper[]): Paper[] {
    const seen = new Set<string>();
    return papers.filter(paper => {
      const key = paper.doi || paper.pmid || paper.arxivId || paper.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance
export const paperFetchingService = new PaperFetchingService();

