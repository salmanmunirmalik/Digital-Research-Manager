/**
 * Citation Style Language–inspired formatters for core academic styles.
 * Production path uses structured cite tokens {{cite:paperId}} in manuscripts.
 */

import { CanonicalPaper, authorsToStrings } from './types.js';

export type CslStyleId =
  | 'apa'
  | 'vancouver'
  | 'harvard'
  | 'ieee'
  | 'chicago'
  | 'ama'
  | 'nature';

export const CSL_STYLES: Array<{ id: CslStyleId; label: string }> = [
  { id: 'apa', label: 'APA 7th' },
  { id: 'vancouver', label: 'Vancouver' },
  { id: 'harvard', label: 'Harvard' },
  { id: 'ieee', label: 'IEEE' },
  { id: 'chicago', label: 'Chicago' },
  { id: 'ama', label: 'AMA' },
  { id: 'nature', label: 'Nature' },
];

const CITE_TOKEN_RE = /\{\{cite:([a-zA-Z0-9_;-]+)\}\}/g;

export function extractCiteIds(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(CITE_TOKEN_RE.source, 'g');
  while ((m = re.exec(text))) {
    for (const part of m[1].split(';')) {
      const id = part.trim();
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}

export function isNumberedStyle(style: CslStyleId | string): boolean {
  const s = String(style).toLowerCase();
  return ['vancouver', 'ieee', 'nature', 'ama'].includes(s);
}

function familyName(author: string): string {
  return author.split(',')[0]?.trim().split(/\s+/).slice(-1)[0] || author;
}

export function formatInTextCsl(
  paper: CanonicalPaper,
  style: CslStyleId | string,
  index: number
): string {
  const authors = authorsToStrings(paper.authors || []);
  const year = paper.publicationYear || 'n.d.';
  const s = String(style).toLowerCase() as CslStyleId;

  if (isNumberedStyle(s)) return `[${index + 1}]`;

  const first = authors[0] ? familyName(authors[0]) : 'Author';
  if (s === 'apa' || s === 'harvard' || s === 'chicago') {
    if (authors.length > 1) return `(${first} et al., ${year})`;
    return `(${first}, ${year})`;
  }
  if (authors.length > 1) return `(${first} et al. ${year})`;
  return `(${first} ${year})`;
}

export function formatBibliographyCsl(
  paper: CanonicalPaper,
  style: CslStyleId | string,
  index?: number
): string {
  const authors = authorsToStrings(paper.authors || []);
  const authorStr = authors.length ? authors.join(', ') : 'Unknown author';
  const year = paper.publicationYear || 'n.d.';
  const journal = paper.journalName || '';
  const vol = paper.volume || '';
  const issue = paper.issue ? `(${paper.issue})` : '';
  const pages = paper.pages || '';
  const doi = paper.doi ? ` https://doi.org/${paper.doi}` : '';
  const s = String(style).toLowerCase();
  const prefix = index != null && isNumberedStyle(s) ? `${index + 1}. ` : '';

  if (s === 'apa') {
    return `${prefix}${authorStr} (${year}). ${paper.title}. ${journal}${vol ? `, ${vol}` : ''}${issue}${pages ? `, ${pages}` : ''}.${doi}`.trim();
  }
  if (s === 'vancouver' || s === 'ama') {
    const shortAuthors =
      authors.length > 6
        ? `${authors.slice(0, 6).join(', ')}, et al.`
        : authorStr;
    return `${prefix}${shortAuthors}. ${paper.title}. ${journal}. ${year}${vol ? `;${vol}` : ''}${pages ? `:${pages}` : ''}.${doi}`.trim();
  }
  if (s === 'ieee' || s === 'nature') {
    return `${prefix}${authorStr}, "${paper.title}," ${journal}, ${vol ? `vol. ${vol}, ` : ''}${pages ? `pp. ${pages}, ` : ''}${year}.${doi}`.trim();
  }
  if (s === 'harvard' || s === 'chicago') {
    return `${prefix}${authorStr} (${year}) '${paper.title}', ${journal}${vol ? `, ${vol}` : ''}${pages ? `, pp. ${pages}` : ''}.${doi}`.trim();
  }
  return `${prefix}${authorStr}. ${paper.title}. ${journal} (${year}).${doi}`.trim();
}

/** Replace {{cite:id}} tokens using appearance order for numbered styles. */
export function renderDocumentWithCites(
  text: string,
  papersById: Record<string, CanonicalPaper>,
  style: CslStyleId | string
): { rendered: string; bibliographyIds: string[] } {
  const order: string[] = [];
  const seen = new Set<string>();
  const rendered = text.replace(/\{\{cite:([a-zA-Z0-9_;-]+)\}\}/g, (_m, inner: string) => {
    const ids = String(inner)
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) return '[?]';
    const labels: string[] = [];
    for (const id of ids) {
      const paper = papersById[id];
      if (!paper) {
        labels.push('?');
        continue;
      }
      if (!seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
      const index = order.indexOf(id);
      if (isNumberedStyle(style)) {
        labels.push(String(index + 1));
      } else {
        labels.push(formatInTextCsl(paper, style, index).replace(/^\(|\)$/g, ''));
      }
    }
    if (isNumberedStyle(style)) {
      return `[${[...new Set(labels)].join(',')}]`;
    }
    return `(${labels.join('; ')})`;
  });
  return { rendered, bibliographyIds: order };
}

export function buildBibliographyFromIds(
  ids: string[],
  papersById: Record<string, CanonicalPaper>,
  style: CslStyleId | string
): string {
  return ids
    .map((id, i) => {
      const p = papersById[id];
      return p ? formatBibliographyCsl(p, style, i) : null;
    })
    .filter(Boolean)
    .join('\n\n');
}

/** RIS export */
export function toRis(paper: CanonicalPaper): string {
  const lines = ['TY  - JOUR', `TI  - ${paper.title}`];
  for (const a of authorsToStrings(paper.authors || [])) lines.push(`AU  - ${a}`);
  if (paper.publicationYear) lines.push(`PY  - ${paper.publicationYear}`);
  if (paper.journalName) lines.push(`JO  - ${paper.journalName}`);
  if (paper.volume) lines.push(`VL  - ${paper.volume}`);
  if (paper.issue) lines.push(`IS  - ${paper.issue}`);
  if (paper.pages) lines.push(`SP  - ${paper.pages}`);
  if (paper.doi) lines.push(`DO  - ${paper.doi}`);
  if (paper.abstract) lines.push(`AB  - ${paper.abstract}`);
  if (paper.pmid) lines.push(`AN  - ${paper.pmid}`);
  lines.push('ER  - ');
  return lines.join('\n');
}

export function parseRis(ris: string): Array<Partial<CanonicalPaper>> {
  const records = ris.split(/\nER\s+-/i);
  return records
    .map((block) => {
      const get = (tag: string) =>
        [...block.matchAll(new RegExp(`^${tag}\\s+-\\s+(.*)$`, 'gim'))].map((m) =>
          m[1].trim()
        );
      const title = get('TI')[0] || get('T1')[0];
      if (!title) return null;
      return {
        title,
        authors: get('AU').map((name) => ({ name })),
        publicationYear: get('PY')[0] ? parseInt(get('PY')[0], 10) : null,
        journalName: get('JO')[0] || get('JF')[0] || null,
        volume: get('VL')[0] || null,
        issue: get('IS')[0] || null,
        pages: get('SP')[0] || null,
        doi: get('DO')[0] || null,
        abstract: get('AB')[0] || null,
        pmid: get('AN')[0] || null,
      } as Partial<CanonicalPaper>;
    })
    .filter(Boolean) as Array<Partial<CanonicalPaper>>;
}
