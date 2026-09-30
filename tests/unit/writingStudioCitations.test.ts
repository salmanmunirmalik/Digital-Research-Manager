import {
  citeToken,
  extractCiteIdsOrdered,
  formatCiteClusterDisplay,
  parseCiteParts,
  renderTextWithCitations,
} from '../../utils/citeWhileWriting';
import { auditManuscriptCitations } from '../../utils/citationAudit';
import { applyJournalPreset, getJournalPreset } from '../../utils/journalPresets';

describe('citeWhileWriting locators', () => {
  it('parses id|locator parts', () => {
    expect(parseCiteParts('abc|p.12;def')).toEqual([
      { id: 'abc', locator: 'p.12' },
      { id: 'def' },
    ]);
  });

  it('builds tokens with locators', () => {
    expect(citeToken([{ id: 'x', locator: 'p. 3' }])).toBe('{{cite:x|p. 3}}');
    expect(citeToken(['a', 'b'])).toBe('{{cite:a;b}}');
  });

  it('extracts ordered ids ignoring locators', () => {
    const text = 'Hello {{cite:one|p.2}} and {{cite:two}} then {{cite:one}} again.';
    expect(extractCiteIdsOrdered(text)).toEqual(['one', 'two']);
  });

  it('renders author-year with page locator', () => {
    const byId = {
      one: {
        id: 'one',
        title: 'Paper',
        authors: ['Jane Smith'],
        year: 2020,
      },
    };
    const { rendered } = renderTextWithCitations(
      'Claim {{cite:one|p.12}}.',
      byId,
      'APA'
    );
    expect(rendered).toContain('Smith');
    expect(rendered).toContain('2020');
    expect(rendered).toMatch(/p\.?\s*12/i);
  });

  it('formats numbered cluster without crashing on locator', () => {
    const label = formatCiteClusterDisplay(
      [{ id: 'a', locator: 'p.1' }],
      {
        a: { id: 'a', title: 'T', authors: ['A'], year: 2021 },
      },
      'Vancouver',
      { a: 0 }
    );
    expect(label).toContain('1');
  });
});

describe('citationAudit', () => {
  it('flags missing and unused refs', () => {
    const result = auditManuscriptCitations({
      fullText: 'Text {{cite:missing1}} and {{cite:ok}}.',
      citations: [
        { id: 'ok', paperId: 'ok', title: 'Good', authors: ['A'], year: 2020 },
        { id: 'unused', paperId: 'unused', title: 'Spare', authors: ['B'], year: 2019 },
      ],
    });
    expect(result.missingIds).toContain('missing1');
    expect(result.unusedIds).toContain('unused');
    expect(result.citedIds).toEqual(['missing1', 'ok']);
  });
});

describe('journalPresets', () => {
  it('applies Nature style and limits', () => {
    const preset = getJournalPreset('nature');
    expect(preset).toBeTruthy();
    const applied = applyJournalPreset(preset!);
    expect(applied.citationStyle).toBe('Nature');
    expect(applied.wordLimitHint).toBe(3000);
  });
});
