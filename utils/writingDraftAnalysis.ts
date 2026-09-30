/**
 * Pre-submission academic draft analysis — deterministic checkpoints researchers use
 * before journal / funder submission. Optional AI enrichment on the server.
 */

import {
  WritingDraftContent,
  getWritingTemplate,
  getSectionContent,
  draftWordCount,
  countWords,
  draftCompletion,
} from './writingTemplates';

export type CheckSeverity = 'pass' | 'warn' | 'fail' | 'info';

export type DraftCheck = {
  id: string;
  category: string;
  title: string;
  detail: string;
  severity: CheckSeverity;
  tip?: string;
};

export type DraftAnalysisResult = {
  score: number;
  readiness: 'not_ready' | 'needs_work' | 'nearly_ready' | 'submission_ready';
  summary: string;
  checks: DraftCheck[];
  citationCount: number;
  wordCount: number;
  completionPercent: number;
  aiNotes?: string;
};

const CITE_TOKEN = /\{\{cite:[^}]+\}\}/g;
const DOI_OR_YEAR = /\b(19|20)\d{2}\b|\bet al\.?\b|\[\d+\]|\(\w+,\s*\d{4}\)/i;

function severityScore(s: CheckSeverity): number {
  if (s === 'pass') return 1;
  if (s === 'info') return 0.85;
  if (s === 'warn') return 0.45;
  return 0;
}

function readinessFromScore(score: number): DraftAnalysisResult['readiness'] {
  if (score >= 85) return 'submission_ready';
  if (score >= 70) return 'nearly_ready';
  if (score >= 45) return 'needs_work';
  return 'not_ready';
}

export function analyzeWritingDraft(
  draft: WritingDraftContent,
  opts?: {
    citationCount?: number;
    bibliography?: string;
    citationAuditIssues?: Array<{
      id: string;
      severity: CheckSeverity;
      title: string;
      detail: string;
      tip?: string;
    }>;
  }
): DraftAnalysisResult {
  const template = getWritingTemplate(draft.templateId);
  const completion = draftCompletion(draft);
  const wordCount = draftWordCount(draft);
  const citationCount = opts?.citationCount ?? 0;
  const allText = draft.sections.map((s) => s.content).join('\n');
  const citeTokens = allText.match(CITE_TOKEN) || [];
  const informalCites = (allText.match(DOI_OR_YEAR) || []).length;
  const checks: DraftCheck[] = [];

  // —— Structure ——
  checks.push({
    id: 'title',
    category: 'Structure',
    title: 'Working title',
    detail: draft.title?.trim()
      ? `Title present (${draft.title.trim().length} characters).`
      : 'No title yet.',
    severity: draft.title?.trim().length >= 12 ? 'pass' : draft.title?.trim() ? 'warn' : 'fail',
    tip: 'Aim for a specific, informative title (usually 10–20 words).',
  });

  checks.push({
    id: 'required_sections',
    category: 'Structure',
    title: 'Required sections filled',
    detail: `${completion.requiredFilled}/${completion.requiredTotal} required sections have content (${completion.percent}%).`,
    severity:
      completion.percent >= 100 ? 'pass' : completion.percent >= 60 ? 'warn' : 'fail',
    tip: 'Fill every required section before submission; empty Methods/Results are common desk-reject causes.',
  });

  for (const section of template.sections.filter((s) => s.required)) {
    const content = getSectionContent(draft, section.id).trim();
    const w = countWords(content);
    const min = Math.max(40, Math.floor((section.suggestedWords || 150) * 0.35));
    let severity: CheckSeverity = 'pass';
    if (!content) severity = 'fail';
    else if (w < min) severity = 'warn';
    checks.push({
      id: `sec_${section.id}`,
      category: 'Structure',
      title: section.title,
      detail: content
        ? `${w} words${section.suggestedWords ? ` (suggested ~${section.suggestedWords})` : ''}.`
        : 'Empty — not started.',
      severity,
      tip: section.guidance?.[0],
    });
  }

  // —— Clarity / research framing ——
  checks.push({
    id: 'research_question',
    category: 'Framing',
    title: 'Research question / focus',
    detail: draft.researchQuestion?.trim()
      ? 'Research question is stated.'
      : 'No research question recorded in document details.',
    severity: draft.researchQuestion?.trim() ? 'pass' : 'warn',
    tip: 'State one clear question early; journals and reviewers look for it.',
  });

  checks.push({
    id: 'venue',
    category: 'Framing',
    title: 'Target journal / funder',
    detail: draft.targetVenue?.trim()
      ? `Target: ${draft.targetVenue}`
      : 'No target venue set — hard to check length/style fit.',
    severity: draft.targetVenue?.trim() ? 'pass' : 'info',
    tip: 'Set the target journal so word limits and citation style can be checked.',
  });

  checks.push({
    id: 'keywords',
    category: 'Framing',
    title: 'Keywords',
    detail: draft.keywords?.length
      ? `${draft.keywords.length} keyword(s).`
      : 'No keywords yet.',
    severity: (draft.keywords?.length || 0) >= 3 ? 'pass' : 'warn',
    tip: 'Most journals ask for 3–6 keywords for indexing.',
  });

  // —— Length ——
  const limit = draft.wordLimitHint || template.wordLimit;
  if (limit) {
    const ratio = wordCount / limit;
    checks.push({
      id: 'word_limit',
      category: 'Length',
      title: draft.wordLimitHint
        ? 'Word count vs journal preset'
        : 'Word count vs template guidance',
      detail: `${wordCount} words (guide ~${limit}${
        draft.targetVenue ? ` · ${draft.targetVenue}` : ''
      }).`,
      severity: ratio > 1.15 ? 'warn' : ratio < 0.4 ? 'warn' : 'pass',
      tip: 'Verify the official journal/call limit — presets are guidance only.',
    });
  } else {
    checks.push({
      id: 'word_count',
      category: 'Length',
      title: 'Overall length',
      detail: `${wordCount} words across the draft.`,
      severity: wordCount < 800 ? 'warn' : wordCount > 12000 ? 'info' : 'pass',
      tip: 'Very short drafts rarely meet research-paper standards; check journal limits.',
    });
  }

  const abstractSec = template.sections.find((s) => s.id === 'abstract');
  if (abstractSec && draft.abstractLimitHint) {
    const abs = getSectionContent(draft, 'abstract').trim();
    const aw = countWords(abs);
    checks.push({
      id: 'abstract_limit',
      category: 'Length',
      title: 'Abstract length vs venue',
      detail: abs
        ? `${aw} words (venue guide ~${draft.abstractLimitHint}).`
        : 'Abstract empty.',
      severity: !abs
        ? 'fail'
        : aw > draft.abstractLimitHint * 1.1
          ? 'warn'
          : 'pass',
      tip: 'Trim the abstract to the journal’s stated limit.',
    });
  }

  // —— Citations / evidence ——
  checks.push({
    id: 'library',
    category: 'Evidence',
    title: 'Attached reference library',
    detail:
      citationCount > 0
        ? `${citationCount} reference(s) attached to this document.`
        : 'No references attached yet.',
    severity: citationCount >= 5 ? 'pass' : citationCount >= 1 ? 'warn' : 'fail',
    tip: 'Attach DOIs from Evidence & References, then cite while writing.',
  });

  checks.push({
    id: 'in_text_cites',
    category: 'Evidence',
    title: 'In-text citations',
    detail:
      citeTokens.length > 0
        ? `${citeTokens.length} structured cite marker(s) found.`
        : informalCites > 0
          ? 'Possible informal citations found, but no structured {{cite:…}} markers.'
          : 'No in-text citations detected.',
    severity:
      citeTokens.length >= 3 ? 'pass' : citeTokens.length >= 1 || informalCites > 0 ? 'warn' : 'fail',
    tip: 'Use “Cite a paper” so bibliography and style stay consistent.',
  });

  checks.push({
    id: 'bibliography',
    category: 'Evidence',
    title: 'Bibliography',
    detail: opts?.bibliography?.trim()
      ? 'Bibliography text is available.'
      : 'No live bibliography yet — add citations first.',
    severity: opts?.bibliography?.trim() ? 'pass' : citationCount > 0 ? 'warn' : 'fail',
  });

  if (opts?.citationAuditIssues?.length) {
    for (const issue of opts.citationAuditIssues) {
      if (issue.severity === 'pass' && issue.id === 'all_resolved') continue;
      checks.push({
        id: `cite_audit_${issue.id}`,
        category: 'Citation integrity',
        title: issue.title,
        detail: issue.detail,
        severity: issue.severity,
        tip: issue.tip,
      });
    }
  }

  // —— Outline / subsection structure ——
  const requiredL2 = template.sections.filter(
    (s) => s.required && (s.level === 2 || s.parentId)
  );
  if (requiredL2.length) {
    const emptyL2 = requiredL2.filter(
      (s) => !getSectionContent(draft, s.id).trim()
    );
    checks.push({
      id: 'required_subsections',
      category: 'Structure',
      title: 'Required subsections',
      detail:
        emptyL2.length === 0
          ? `All ${requiredL2.length} required subsection(s) have content.`
          : `${emptyL2.length} required subsection(s) still empty: ${emptyL2
              .slice(0, 3)
              .map((s) => s.title)
              .join(', ')}${emptyL2.length > 3 ? '…' : ''}.`,
      severity: emptyL2.length === 0 ? 'pass' : emptyL2.length > 2 ? 'fail' : 'warn',
      tip: 'Fill Search / Synthesis (or Methods children) before submission.',
    });
  }

  checks.push({
    id: 'numbering_policy',
    category: 'Style',
    title: 'Section numbering',
    detail: `Outline numbering: ${
      draft.numberingPolicy || template.numberingPolicy || 'none'
    }.`,
    severity: 'info',
    tip: 'Match the target journal (many leave Introduction unnumbered; grants often use 1.1).',
  });

  if (!draft.subtitle?.trim() && draft.docType === 'research_paper') {
    checks.push({
      id: 'subtitle',
      category: 'Framing',
      title: 'Subtitle',
      detail: 'No subtitle — optional for most journals.',
      severity: 'info',
    });
  }

  // —— Academic tone / integrity heuristics ——
  const firstPersonHeavy = (allText.match(/\b(I|we|our|my)\b/gi) || []).length;
  checks.push({
    id: 'voice',
    category: 'Style',
    title: 'Author voice',
    detail:
      firstPersonHeavy > 40
        ? 'Heavy first-person wording — some journals prefer passive/third person in Methods.'
        : 'Voice looks typical for a research draft.',
    severity: firstPersonHeavy > 80 ? 'warn' : 'info',
    tip: 'Match the target journal’s voice guidelines (Methods often more impersonal).',
  });

  const placeholderish = /TODO|TBD|lorem ipsum|xxx|\[insert|as above|copy from/i.test(allText);
  checks.push({
    id: 'placeholders',
    category: 'Integrity',
    title: 'Placeholder / incomplete text',
    detail: placeholderish
      ? 'Possible placeholder phrases detected (TODO/TBD/etc.).'
      : 'No obvious placeholder markers found.',
    severity: placeholderish ? 'fail' : 'pass',
    tip: 'Remove all TODOs before submission.',
  });

  const methods = template.sections.find((s) => /method/i.test(s.id) || /method/i.test(s.title));
  if (methods) {
    const m = getSectionContent(draft, methods.id);
    const hasStats = /sample size|n\s*=|statistical|p\s*[<≈=]|ANOVA|regression|power/i.test(m);
    checks.push({
      id: 'methods_stats',
      category: 'Rigor',
      title: 'Methods: analysis cues',
      detail: hasStats
        ? 'Methods mention sample size or statistical analysis cues.'
        : 'Methods may lack explicit sample size / analysis description.',
      severity: !m.trim() ? 'fail' : hasStats ? 'pass' : 'warn',
      tip: 'State design, sample, measures, and analysis plan clearly.',
    });
  }

  const results = template.sections.find((s) => /result/i.test(s.id) || /result/i.test(s.title));
  const discussion = template.sections.find(
    (s) => /discuss/i.test(s.id) || /discuss/i.test(s.title)
  );
  if (results && discussion) {
    const r = getSectionContent(draft, results.id).trim();
    const d = getSectionContent(draft, discussion.id).trim();
    checks.push({
      id: 'results_vs_discussion',
      category: 'Rigor',
      title: 'Results vs Discussion separation',
      detail:
        r && d
          ? 'Both Results and Discussion have content.'
          : 'Results and Discussion should both be developed and kept distinct.',
      severity: r && d ? 'pass' : 'warn',
      tip: 'Results = findings; Discussion = interpretation, limits, implications.',
    });
  }

  checks.push({
    id: 'citation_style',
    category: 'Style',
    title: 'Citation style selected',
    detail: `Style set to ${draft.citationStyle}.`,
    severity: 'pass',
    tip: 'Confirm this matches the target journal author guidelines.',
  });

  checks.push({
    id: 'official_check',
    category: 'Submission',
    title: 'Official guidelines reminder',
    detail:
      'This analysis is guidance only — always verify against the journal/funder checklist (ethics, data availability, COI, cover letter, figure specs).',
    severity: 'info',
    tip: template.officialNotes?.[0] || template.standards?.[0],
  });

  const scored = checks.filter((c) => c.severity !== 'info');
  const raw =
    scored.length === 0
      ? 0
      : (scored.reduce((sum, c) => sum + severityScore(c.severity), 0) / scored.length) * 100;
  const score = Math.round(raw);
  const readiness = readinessFromScore(score);

  const failCount = checks.filter((c) => c.severity === 'fail').length;
  const warnCount = checks.filter((c) => c.severity === 'warn').length;
  const summary =
    readiness === 'submission_ready'
      ? 'Draft looks strong against common academic checkpoints — still verify journal-specific rules.'
      : readiness === 'nearly_ready'
        ? `Close — address ${warnCount} warning(s) and re-check before submission.`
        : `Not ready yet: ${failCount} critical gap(s), ${warnCount} warning(s). Fix structure and evidence first.`;

  return {
    score,
    readiness,
    summary,
    checks,
    citationCount,
    wordCount,
    completionPercent: completion.percent,
  };
}
