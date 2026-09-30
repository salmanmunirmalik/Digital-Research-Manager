/**
 * Canonical scholarly paper types + normalization helpers.
 */

export type ScholarlyAuthor = {
  name: string;
  orcid?: string;
  affiliation?: string;
};

export type CanonicalPaper = {
  id?: string;
  title: string;
  abstract?: string | null;
  publicationType?: string | null;
  publicationYear?: number | null;
  publicationDate?: string | null;
  doi?: string | null;
  pmid?: string | null;
  pmcid?: string | null;
  openalexId?: string | null;
  semanticScholarId?: string | null;
  journalName?: string | null;
  journalIssn?: string | null;
  publisher?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  authors: ScholarlyAuthor[];
  affiliations?: string[];
  keywords?: string[];
  meshTerms?: string[];
  topics?: string[];
  citationCount?: number | null;
  isOpenAccess?: boolean;
  openAccessStatus?: string | null;
  openAccessUrl?: string | null;
  pdfUrl?: string | null;
  sourceUrl?: string | null;
  metadataSource?: string | null;
  metadataAvailable?: boolean;
  abstractAvailable?: boolean;
  fullTextAvailable?: boolean;
  pdfAvailable?: boolean;
  pdfAccessType?: 'user_upload' | 'open_access' | 'publisher' | 'none' | null;
  normalizedTitle?: string | null;
};

export function normalizeDoi(doi?: string | null): string | null {
  if (!doi) return null;
  const cleaned = doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
  return cleaned || null;
}

export function normalizeTitle(title?: string | null): string | null {
  if (!title) return null;
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000) || null;
}

export function firstAuthorKey(authors: ScholarlyAuthor[] | string[] | undefined): string | null {
  if (!authors?.length) return null;
  const first = authors[0];
  const name = typeof first === 'string' ? first : first.name;
  if (!name) return null;
  return name
    .toLowerCase()
    .split(',')[0]
    .trim()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-1)[0] || null;
}

export function authorsToStrings(authors: ScholarlyAuthor[]): string[] {
  return authors.map((a) => a.name).filter(Boolean);
}

export function mergeCanonical(a: CanonicalPaper, b: CanonicalPaper): CanonicalPaper {
  const pick = <T>(x: T | null | undefined, y: T | null | undefined): T | null | undefined =>
    x != null && x !== '' ? x : y;

  return {
    ...a,
    title: a.title || b.title,
    abstract: pick(a.abstract, b.abstract) as string | null,
    publicationType: pick(a.publicationType, b.publicationType) as string | null,
    publicationYear: pick(a.publicationYear, b.publicationYear) as number | null,
    publicationDate: pick(a.publicationDate, b.publicationDate) as string | null,
    doi: normalizeDoi(pick(a.doi, b.doi) as string | null),
    pmid: pick(a.pmid, b.pmid) as string | null,
    pmcid: pick(a.pmcid, b.pmcid) as string | null,
    openalexId: pick(a.openalexId, b.openalexId) as string | null,
    semanticScholarId: pick(a.semanticScholarId, b.semanticScholarId) as string | null,
    journalName: pick(a.journalName, b.journalName) as string | null,
    journalIssn: pick(a.journalIssn, b.journalIssn) as string | null,
    publisher: pick(a.publisher, b.publisher) as string | null,
    volume: pick(a.volume, b.volume) as string | null,
    issue: pick(a.issue, b.issue) as string | null,
    pages: pick(a.pages, b.pages) as string | null,
    authors: a.authors?.length ? a.authors : b.authors || [],
    affiliations: a.affiliations?.length ? a.affiliations : b.affiliations,
    keywords: a.keywords?.length ? a.keywords : b.keywords,
    meshTerms: a.meshTerms?.length ? a.meshTerms : b.meshTerms,
    topics: a.topics?.length ? a.topics : b.topics,
    citationCount: Math.max(a.citationCount || 0, b.citationCount || 0),
    isOpenAccess: Boolean(a.isOpenAccess || b.isOpenAccess),
    openAccessStatus: pick(a.openAccessStatus, b.openAccessStatus) as string | null,
    openAccessUrl: pick(a.openAccessUrl, b.openAccessUrl) as string | null,
    pdfUrl: pick(a.pdfUrl, b.pdfUrl) as string | null,
    sourceUrl: pick(a.sourceUrl, b.sourceUrl) as string | null,
    metadataSource: [a.metadataSource, b.metadataSource].filter(Boolean).join('+') || a.metadataSource,
    abstractAvailable: Boolean(a.abstractAvailable || b.abstractAvailable || a.abstract || b.abstract),
    fullTextAvailable: Boolean(a.fullTextAvailable || b.fullTextAvailable),
    pdfAvailable: Boolean(a.pdfAvailable || b.pdfAvailable || a.pdfUrl || b.pdfUrl),
    pdfAccessType: (pick(a.pdfAccessType, b.pdfAccessType) as CanonicalPaper['pdfAccessType']) || null,
    normalizedTitle: normalizeTitle(a.title || b.title),
  };
}
