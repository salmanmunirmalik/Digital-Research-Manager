/**
 * Map Research Journey / PaperGenerationPipeline paper artifacts into a Writing Studio draft.
 */

import {
  emptyWritingDraft,
  setSectionContent,
  type WritingDraftContent,
} from './writingTemplates';

function sectionText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value !== null && 'text' in value) {
    const t = (value as { text?: unknown }).text;
    if (typeof t === 'string') return t.trim();
  }
  return '';
}

/** Accepts either pipeline `.paper` object or a flat section map. */
export function paperArtifactToWritingDraft(
  paper: Record<string, unknown> | null | undefined,
  templateId = 'paper_imrad_journal'
): WritingDraftContent {
  const draft = emptyWritingDraft(templateId);
  if (!paper) return draft;

  const title = sectionText(paper.title) || String(paper.title || '').trim();
  if (title && title !== '[object Object]') {
    draft.title = title;
  }

  const mapping: Array<[string, unknown]> = [
    ['abstract', paper.abstract],
    ['introduction', paper.introduction],
    ['methods', paper.methods],
    ['results', paper.results],
    ['discussion', paper.discussion],
    ['conclusion', paper.conclusion],
  ];

  for (const [sectionId, raw] of mapping) {
    const text = sectionText(raw);
    if (text) setSectionContent(draft, sectionId, text);
  }

  return draft;
}
