/**
 * Cite-while-writing helpers (Zotero / Mendeley / Word-style).
 * Manuscripts store structural tokens; UI shows formatted author–year or numbers.
 *
 * Token forms:
 *   {{cite:id}}
 *   {{cite:id|p.12}}              // page / locator
 *   {{cite:id1;id2}}              // multi-cite cluster
 *   {{cite:id1|p.3;id2|pp.10-12}}
 */

import type { CitationRecord } from './citationFormat';
import { formatInText, formatBibliography } from './citationFormat';

export const CITE_CLUSTER_RE = /\{\{cite:([^}]+)\}\}/g;

export type CitePart = { id: string; locator?: string };

export function parseCitePart(raw: string): CitePart | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const pipe = trimmed.indexOf('|');
  if (pipe < 0) {
    const id = trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
    return id ? { id } : null;
  }
  const id = trimmed.slice(0, pipe).trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const locator = trimmed.slice(pipe + 1).trim();
  if (!id) return null;
  return locator ? { id, locator } : { id };
}

export function parseCiteCluster(inner: string): string[] {
  return parseCiteParts(inner).map((p) => p.id);
}

export function parseCiteParts(inner: string): CitePart[] {
  return inner
    .split(';')
    .map((s) => parseCitePart(s))
    .filter((p): p is CitePart => Boolean(p));
}

export function citeToken(ids: string[]): string;
export function citeToken(parts: CitePart[]): string;
export function citeToken(idsOrParts: string[] | CitePart[]): string {
  if (!idsOrParts.length) return '';
  if (typeof idsOrParts[0] === 'string') {
    const clean = [
      ...new Set((idsOrParts as string[]).map((id) => String(id).trim()).filter(Boolean)),
    ];
    if (!clean.length) return '';
    return `{{cite:${clean.join(';')}}}`;
  }
  const parts = idsOrParts as CitePart[];
  const encoded = parts
    .filter((p) => p.id)
    .map((p) => (p.locator ? `${p.id}|${p.locator}` : p.id));
  if (!encoded.length) return '';
  return `{{cite:${encoded.join(';')}}}`;
}

/** Unique cite ids in document order of first appearance. */
export function extractCiteIdsOrdered(text: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const re = new RegExp(CITE_CLUSTER_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    for (const part of parseCiteParts(m[1])) {
      if (!seen.has(part.id)) {
        seen.add(part.id);
        ids.push(part.id);
      }
    }
  }
  return ids;
}

export function countCiteClusters(text: string): number {
  return (text.match(new RegExp(CITE_CLUSTER_RE.source, 'g')) || []).length;
}

export function isNumberedCitationStyle(style: string): boolean {
  const s = String(style).toLowerCase();
  return ['vancouver', 'ieee', 'nature', 'science', 'ama'].includes(s);
}

function familyName(author: string): string {
  const part = author.split(',')[0]?.trim() || author.trim();
  const bits = part.split(/\s+/);
  return bits[bits.length - 1] || 'Author';
}

function normalizeLocator(loc: string): string {
  const t = loc.trim();
  if (!t) return '';
  if (/^(p{1,2}\.?|at|para\.?|§|ch\.?|fig\.?|eq\.?)\s*/i.test(t)) return t;
  if (/^\d/.test(t)) return `p. ${t}`;
  return t;
}

export function formatSingleInText(
  citation: CitationRecord,
  style: string,
  numberIndex: number,
  locator?: string
): string {
  const loc = locator ? normalizeLocator(locator) : '';
  if (isNumberedCitationStyle(style)) {
    const n = String(numberIndex + 1);
    return loc ? `${n}, ${loc}` : n;
  }
  const authors = citation.authors || [];
  const first = authors[0] ? familyName(authors[0]) : 'Author';
  const year = citation.year || 'n.d.';
  const s = String(style).toLowerCase();
  let core: string;
  if (s === 'apa' || s === 'harvard' || s === 'chicago' || s === 'mla') {
    if (authors.length >= 3) core = `${first} et al., ${year}`;
    else if (authors.length === 2) {
      core = `${first} & ${familyName(authors[1])}, ${year}`;
    } else core = `${first}, ${year}`;
  } else if (authors.length > 1) {
    core = `${first} et al. ${year}`;
  } else {
    core = `${first} ${year}`;
  }
  return loc ? `${core}, ${loc}` : core;
}

/** Format a multi-cite cluster for display (parentheses / brackets applied). */
export function formatCiteClusterDisplay(
  ids: string[],
  byId: Record<string, CitationRecord>,
  style: string,
  numberIndexById: Record<string, number>,
  locators?: Array<string | undefined>
): string;
export function formatCiteClusterDisplay(
  parts: CitePart[],
  byId: Record<string, CitationRecord>,
  style: string,
  numberIndexById: Record<string, number>
): string;
export function formatCiteClusterDisplay(
  idsOrParts: string[] | CitePart[],
  byId: Record<string, CitationRecord>,
  style: string,
  numberIndexById: Record<string, number>,
  locators?: Array<string | undefined>
): string {
  const parts: CitePart[] =
    !idsOrParts.length || typeof idsOrParts[0] === 'string'
      ? (idsOrParts as string[]).map((id, i) => ({
          id,
          locator: locators?.[i],
        }))
      : (idsOrParts as CitePart[]);

  const resolved = parts.map((p) => ({ ...p, c: byId[p.id] })).filter((x) => x.c);
  if (!resolved.length) return '[missing citation]';

  if (isNumberedCitationStyle(style)) {
    const nums = resolved
      .map((x) => numberIndexById[x.id] ?? 0)
      .map((n) => n + 1)
      .sort((a, b) => a - b);
    const partsNum: string[] = [];
    let start = nums[0];
    let prev = nums[0];
    for (let i = 1; i <= nums.length; i++) {
      const cur = nums[i];
      if (cur === prev + 1) {
        prev = cur;
        continue;
      }
      partsNum.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = cur;
      prev = cur;
    }
    const base = `[${partsNum.join(',')}]`;
    if (resolved.length === 1 && resolved[0].locator) {
      return `${base}${normalizeLocator(resolved[0].locator)}`;
    }
    return base;
  }

  const inner = resolved
    .map((x) =>
      formatSingleInText(x.c!, style, numberIndexById[x.id] ?? 0, x.locator)
    )
    .join('; ');
  return `(${inner})`;
}

export function buildNumberIndexMap(orderedIds: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  orderedIds.forEach((id, i) => {
    map[id] = i;
  });
  return map;
}

/** Replace all cite tokens with formatted in-text citations (preview / export). */
export function renderTextWithCitations(
  text: string,
  byId: Record<string, CitationRecord>,
  style: string,
  documentOrderedIds?: string[]
): { rendered: string; bibliographyIds: string[] } {
  const ordered = documentOrderedIds?.length
    ? documentOrderedIds
    : extractCiteIdsOrdered(text);
  const numberIndexById = buildNumberIndexMap(ordered);

  const rendered = text.replace(CITE_CLUSTER_RE, (_m, inner: string) => {
    const parts = parseCiteParts(inner);
    return formatCiteClusterDisplay(parts, byId, style, numberIndexById);
  });

  return { rendered, bibliographyIds: ordered };
}

export function buildOrderedBibliography(
  orderedIds: string[],
  byId: Record<string, CitationRecord>,
  style: string
): string {
  return orderedIds
    .map((id, i) => {
      const c = byId[id];
      if (!c) {
        const missing = `[Missing reference metadata for cite id ${id}]`;
        return isNumberedCitationStyle(style) ? `${i + 1}. ${missing}` : missing;
      }
      const line = formatBibliography(c, style);
      if (isNumberedCitationStyle(style)) {
        return `${i + 1}. ${line.replace(/^\d+\.\s*/, '')}`;
      }
      return line;
    })
    .join('\n\n');
}

export function removeCiteClusterAt(text: string, clusterIndex: number): string {
  let i = 0;
  return text
    .replace(CITE_CLUSTER_RE, (match) => {
      const keep = i !== clusterIndex;
      i += 1;
      return keep ? match : '';
    })
    .replace(/  +/g, ' ');
}

/** Remove one or more paper/cite ids from all {{cite:…}} clusters in text. */
export function stripCiteIdsFromText(text: string, idsToRemove: string[]): string {
  const drop = new Set(idsToRemove.filter(Boolean));
  if (!drop.size || !text) return text;
  return text
    .replace(CITE_CLUSTER_RE, (match, inner: string) => {
      const kept = parseCiteParts(inner).filter((p) => !drop.has(p.id));
      if (!kept.length) return '';
      return citeToken(kept);
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/  +/g, ' ');
}

export function listCiteClusters(
  text: string
): Array<{
  index: number;
  ids: string[];
  parts: CitePart[];
  raw: string;
  start: number;
  end: number;
}> {
  const out: Array<{
    index: number;
    ids: string[];
    parts: CitePart[];
    raw: string;
    start: number;
    end: number;
  }> = [];
  const re = new RegExp(CITE_CLUSTER_RE.source, 'g');
  let m: RegExpExecArray | null;
  let index = 0;
  while ((m = re.exec(text))) {
    const parts = parseCiteParts(m[1]);
    out.push({
      index,
      ids: parts.map((p) => p.id),
      parts,
      raw: m[0],
      start: m.index,
      end: m.index + m[0].length,
    });
    index += 1;
  }
  return out;
}

export function citationsToMap(
  citations: CitationRecord[]
): Record<string, CitationRecord> {
  const map: Record<string, CitationRecord> = {};
  for (const c of citations) {
    const id = c.paperId || c.id;
    if (id) map[id] = c;
    if (c.id) map[c.id] = c;
    if (c.paperId) map[c.paperId] = c;
  }
  return map;
}

/** Fallback display when record missing — still show token id briefly. */
export { formatInText };
