/**
 * Journal / venue presets for Writing Studio.
 * Apply style, length guidance, and author-facing tips in one click.
 */

import type { CitationStyle } from './writingTemplates';

export type JournalPreset = {
  id: string;
  name: string;
  publisher?: string;
  field: string;
  citationStyle: CitationStyle;
  /** Soft word-limit guidance for the full manuscript (excl. refs) */
  wordLimit?: number;
  abstractLimit?: number;
  tips: string[];
};

export const JOURNAL_PRESETS: JournalPreset[] = [
  {
    id: 'nature',
    name: 'Nature (research article)',
    publisher: 'Springer Nature',
    field: 'Multidisciplinary',
    citationStyle: 'Nature',
    wordLimit: 3000,
    abstractLimit: 150,
    tips: [
      'Lead with the advance; avoid lengthy literature reviews in the intro.',
      'Methods often sit online — keep the main text concise.',
      'Numbered citations; figures must stand alone with clear legends.',
    ],
  },
  {
    id: 'science',
    name: 'Science',
    publisher: 'AAAS',
    field: 'Multidisciplinary',
    citationStyle: 'Science',
    wordLimit: 4500,
    abstractLimit: 125,
    tips: [
      'Emphasize broad significance early.',
      'Keep the narrative tight; move detail to supplementary materials.',
    ],
  },
  {
    id: 'cell',
    name: 'Cell / life-science journal',
    publisher: 'Cell Press–style',
    field: 'Life sciences',
    citationStyle: 'Vancouver',
    wordLimit: 7000,
    abstractLimit: 150,
    tips: [
      'Structured abstract preferred for many Cell Press titles.',
      'Results should tell a figure-driven story.',
    ],
  },
  {
    id: 'lancet',
    name: 'The Lancet / clinical',
    publisher: 'Elsevier',
    field: 'Medicine',
    citationStyle: 'Vancouver',
    wordLimit: 4500,
    abstractLimit: 300,
    tips: [
      'Use structured abstract (Background, Methods, Findings, Interpretation).',
      'Report CONSORT/STROBE items where applicable.',
    ],
  },
  {
    id: 'ieee',
    name: 'IEEE Transactions',
    publisher: 'IEEE',
    field: 'Engineering / CS',
    citationStyle: 'IEEE',
    wordLimit: 8000,
    abstractLimit: 200,
    tips: [
      'Numbered citations in brackets.',
      'Equations and algorithms should be self-contained.',
    ],
  },
  {
    id: 'acm',
    name: 'ACM conference / journal',
    publisher: 'ACM',
    field: 'Computer science',
    citationStyle: 'APA',
    wordLimit: 9000,
    abstractLimit: 200,
    tips: [
      'Follow the specific ACM template for the venue.',
      'Related work should position novelty clearly.',
    ],
  },
  {
    id: 'apa_psych',
    name: 'APA journal (psychology / social)',
    publisher: 'APA',
    field: 'Psychology / social science',
    citationStyle: 'APA',
    wordLimit: 8000,
    abstractLimit: 250,
    tips: [
      'Author–date citations; hanging-indent reference list.',
      'Report effect sizes and exact p-values where appropriate.',
    ],
  },
  {
    id: 'plos',
    name: 'PLOS ONE',
    publisher: 'PLOS',
    field: 'Open science',
    citationStyle: 'Vancouver',
    wordLimit: 10000,
    abstractLimit: 300,
    tips: [
      'Emphasize methodological soundness over novelty.',
      'Data and code availability statements are expected.',
    ],
  },
  {
    id: 'custom',
    name: 'Custom / other venue',
    field: 'General',
    citationStyle: 'APA',
    tips: [
      'Set citation style and word limits from the journal’s author guidelines.',
      'Paste the official abstract and figure limits into your checklist.',
    ],
  },
];

export function getJournalPreset(id: string | undefined | null): JournalPreset | undefined {
  if (!id) return undefined;
  return JOURNAL_PRESETS.find((p) => p.id === id);
}

export function matchPresetByVenueName(venue: string): JournalPreset | undefined {
  const v = venue.trim().toLowerCase();
  if (!v) return undefined;
  return JOURNAL_PRESETS.find(
    (p) =>
      p.id !== 'custom' &&
      (v.includes(p.name.toLowerCase().split(' ')[0]) ||
        (p.publisher && v.includes(p.publisher.toLowerCase().split(' ')[0])))
  );
}

/** Apply a preset onto draft metadata (caller merges into state). */
export function applyJournalPreset(
  preset: JournalPreset,
  currentVenue?: string
): {
  targetVenue: string;
  citationStyle: CitationStyle;
  journalPresetId: string;
  wordLimitHint?: number;
  abstractLimitHint?: number;
  numberingPolicy?: 'none' | 'decimal';
} {
  return {
    targetVenue:
      preset.id === 'custom' && currentVenue?.trim()
        ? currentVenue
        : preset.name,
    citationStyle: preset.citationStyle,
    journalPresetId: preset.id,
    wordLimitHint: preset.wordLimit,
    abstractLimitHint: preset.abstractLimit,
    numberingPolicy:
      preset.citationStyle === 'Nature' ||
      preset.citationStyle === 'Science' ||
      preset.citationStyle === 'Vancouver' ||
      preset.citationStyle === 'IEEE'
        ? 'decimal'
        : 'none',
  };
}
