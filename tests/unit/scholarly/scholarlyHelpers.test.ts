/**
 * Unit tests for scholarly helpers (DOI, title normalize, CSL, RIS, dedup keys).
 */

import {
  normalizeDoi,
  normalizeTitle,
  firstAuthorKey,
  mergeCanonical,
  CanonicalPaper,
} from '../../../server/services/scholarly/types';
import {
  extractCiteIds,
  formatInTextCsl,
  formatBibliographyCsl,
  renderDocumentWithCites,
  parseRis,
  isNumberedStyle,
} from '../../../server/services/scholarly/cslFormat';

describe('scholarly types', () => {
  test('normalizeDoi strips prefixes', () => {
    expect(normalizeDoi('https://doi.org/10.1000/xyz')).toBe('10.1000/xyz');
    expect(normalizeDoi('doi:10.1000/xyz')).toBe('10.1000/xyz');
    expect(normalizeDoi(null)).toBeNull();
  });

  test('normalizeTitle collapses punctuation', () => {
    expect(normalizeTitle('Hello, World!')).toBe('hello world');
  });

  test('firstAuthorKey uses family name', () => {
    expect(firstAuthorKey([{ name: 'Smith, John' }])).toBe('smith');
    expect(firstAuthorKey(['Ada Lovelace'])).toBe('lovelace');
  });

  test('mergeCanonical prefers non-empty fields and max citations', () => {
    const a: CanonicalPaper = {
      title: 'A',
      authors: [{ name: 'A' }],
      doi: '10.1/a',
      citationCount: 2,
    };
    const b: CanonicalPaper = {
      title: 'B',
      authors: [{ name: 'B' }],
      abstract: 'Abs',
      citationCount: 10,
      pmid: '123',
    };
    const m = mergeCanonical(a, b);
    expect(m.doi).toBe('10.1/a');
    expect(m.abstract).toBe('Abs');
    expect(m.pmid).toBe('123');
    expect(m.citationCount).toBe(10);
  });
});

describe('cslFormat', () => {
  const paper: CanonicalPaper = {
    id: 'p1',
    title: 'Test Paper',
    authors: [{ name: 'Smith, Jane' }, { name: 'Doe, John' }],
    publicationYear: 2024,
    journalName: 'Nature',
    doi: '10.1000/test',
  };

  test('numbered styles', () => {
    expect(isNumberedStyle('vancouver')).toBe(true);
    expect(formatInTextCsl(paper, 'vancouver', 0)).toBe('[1]');
    expect(formatInTextCsl(paper, 'apa', 0)).toMatch(/Smith et al/);
  });

  test('extractCiteIds and render preserve order', () => {
    const text = 'See {{cite:p2}} and {{cite:p1}} and again {{cite:p2}}.';
    expect(extractCiteIds(text)).toEqual(['p2', 'p1']);
    const { rendered, bibliographyIds } = renderDocumentWithCites(
      text,
      {
        p1: paper,
        p2: { ...paper, id: 'p2', authors: [{ name: 'Lee, A' }], publicationYear: 2020 },
      },
      'vancouver'
    );
    expect(bibliographyIds).toEqual(['p2', 'p1']);
    expect(rendered).toContain('[1]');
    expect(rendered).toContain('[2]');
  });

  test('bibliography includes title', () => {
    expect(formatBibliographyCsl(paper, 'apa')).toContain('Test Paper');
  });

  test('parseRis', () => {
    const ris = `TY  - JOUR
TI  - Hello RIS
AU  - Author, A
PY  - 2021
DO  - 10.1/ris
ER  - 
`;
    const parsed = parseRis(ris);
    expect(parsed[0]?.title).toBe('Hello RIS');
    expect(parsed[0]?.doi).toBe('10.1/ris');
  });
});
