/**
 * Shared citation formatting / BibTeX helpers (client + server).
 */

export type CitationRecord = {
  id?: string;
  /** Canonical paper id when linked to Evidence & References spine */
  paperId?: string | null;
  title: string;
  authors: string[];
  year?: number | null;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  doi?: string | null;
  url?: string | null;
  abstract?: string | null;
  citationKey?: string | null;
  sourceType?: string;
  rawBibtex?: string | null;
  notes?: string | null;
  sourceText?: string | null;
};

function unbrace(value: string): string {
  return value
    .replace(/^\{|\}$/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function field(entry: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*(\\{([^{}]*)\\}|\"([^\"]*)\")`, 'i');
  const m = entry.match(re);
  if (!m) return undefined;
  return unbrace(m[2] ?? m[3] ?? '');
}

/** Parse one or more BibTeX entries into citation records. */
export function parseBibtex(bibtex: string): CitationRecord[] {
  const entries = bibtex.match(/@\w+\s*\{[^@]*/gi) || [];
  return entries
    .map((raw) => {
      const header = raw.match(/@(\w+)\s*\{\s*([^,\s]+)\s*,/i);
      const type = (header?.[1] || 'article').toLowerCase();
      const key = header?.[2] || undefined;
      const title = field(raw, 'title');
      if (!title) return null;
      const authorRaw = field(raw, 'author') || '';
      const authors = authorRaw
        ? authorRaw.split(/\s+and\s+/i).map((a) => a.trim()).filter(Boolean)
        : [];
      const yearStr = field(raw, 'year');
      const year = yearStr ? parseInt(yearStr, 10) : null;
      return {
        title,
        authors,
        year: Number.isFinite(year) ? year : null,
        journal: field(raw, 'journal') || field(raw, 'booktitle') || null,
        volume: field(raw, 'volume') || null,
        issue: field(raw, 'number') || null,
        pages: field(raw, 'pages') || null,
        doi: field(raw, 'doi') || null,
        url: field(raw, 'url') || null,
        abstract: field(raw, 'abstract') || null,
        citationKey: key || null,
        sourceType: type,
        rawBibtex: `@${type}{${key || 'entry'},${raw.slice(raw.indexOf(','))}`,
      } as CitationRecord;
    })
    .filter(Boolean) as CitationRecord[];
}

export function normalizeDoi(doi: string): string {
  return doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
}

export function formatInText(
  citation: CitationRecord,
  style: string,
  index?: number
): string {
  const first =
    citation.authors[0]
      ?.split(',')[0]
      ?.trim()
      .split(/\s+/)
      .slice(-1)[0] || 'Author';
  const year = citation.year || 'n.d.';
  const s = style.toLowerCase();
  if (s === 'vancouver' || s === 'ieee' || s === 'nature' || s === 'science') {
    return `[${(index ?? 0) + 1}]`;
  }
  if (citation.authors.length > 1) {
    return `(${first} et al., ${year})`;
  }
  return `(${first}, ${year})`;
}

export function formatBibliography(citation: CitationRecord, style: string): string {
  const authors =
    citation.authors.length > 0 ? citation.authors.join(', ') : 'Unknown author';
  const year = citation.year || 'n.d.';
  const journal = citation.journal ? `. ${citation.journal}` : '';
  const vol = citation.volume ? ` ${citation.volume}` : '';
  const issue = citation.issue ? `(${citation.issue})` : '';
  const pages = citation.pages ? `: ${citation.pages}` : '';
  const doi = citation.doi
    ? ` https://doi.org/${normalizeDoi(citation.doi)}`
    : '';
  const s = style.toLowerCase();
  if (s === 'apa') {
    return `${authors} (${year}). ${citation.title}${journal}${vol}${issue}${pages}.${doi}`.trim();
  }
  if (s === 'vancouver' || s === 'ama') {
    const numberedAuthors = citation.authors.slice(0, 6).join(', ');
    const more = citation.authors.length > 6 ? ', et al' : '';
    return `${numberedAuthors}${more}. ${citation.title}. ${citation.journal || ''}. ${year}${vol ? `;${citation.volume}` : ''}${pages}.${doi}`.trim();
  }
  if (s === 'ieee') {
    const ieeeAuthors =
      citation.authors.length > 0
        ? citation.authors
            .map((a) => {
              const parts = a.trim().split(/\s+/);
              const last = parts[parts.length - 1];
              const initials = parts
                .slice(0, -1)
                .map((p) => `${p[0]}.`)
                .join(' ');
              return initials ? `${initials} ${last}` : last;
            })
            .join(', ')
        : 'Unknown';
    return `${ieeeAuthors}, "${citation.title}," ${citation.journal || 'Journal'}, ${year}.${doi}`.trim();
  }
  if (s === 'nature' || s === 'science') {
    const natAuthors =
      citation.authors.length > 0
        ? citation.authors
            .map((a) => {
              const parts = a.trim().split(/\s+/);
              const last = parts[parts.length - 1];
              const initials = parts
                .slice(0, -1)
                .map((p) => p[0])
                .join('');
              return initials ? `${last} ${initials}` : last;
            })
            .join(', ')
        : 'Unknown';
    return `${natAuthors}. ${citation.title}. ${citation.journal || ''}. ${year}${vol};${pages}.${doi}`.trim();
  }
  if (s === 'mla') {
    return `${authors}. "${citation.title}." ${citation.journal || 'Print'}, ${year}${pages}.${doi}`.trim();
  }
  if (s === 'chicago' || s === 'harvard') {
    return `${authors}. ${year}. "${citation.title}." ${citation.journal || 'Journal'}${vol}${issue}${pages}.${doi}`.trim();
  }
  return `${authors}. ${citation.title}${journal}${vol}${pages} (${year}).${doi}`.trim();
}

export function buildBibliography(
  citations: CitationRecord[],
  style: string
): string {
  return citations.map((c, i) => formatBibliography(c, style)).join('\n\n');
}

/** Insert citation marker at cursor position in plain text. */
export function insertAtCursor(
  text: string,
  cursorStart: number,
  cursorEnd: number,
  insertion: string
): { text: string; cursor: number } {
  const before = text.slice(0, cursorStart);
  const after = text.slice(cursorEnd);
  const needsSpaceBefore = before.length > 0 && !/\s$/.test(before);
  const needsSpaceAfter = after.length > 0 && !/^\s|^[,.;:]/.test(after);
  const chunk =
    (needsSpaceBefore ? ' ' : '') + insertion + (needsSpaceAfter ? ' ' : '');
  const next = before + chunk + after;
  return { text: next, cursor: before.length + chunk.length };
}
