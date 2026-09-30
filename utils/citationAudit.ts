/**
 * Manuscript citation integrity — missing, orphan, and duplicate checks.
 * Used by Readiness and Sources panels.
 */

import type { CitationRecord } from './citationFormat';
import {
  citationsToMap,
  extractCiteIdsOrdered,
  listCiteClusters,
} from './citeWhileWriting';

export type CitationAuditIssue = {
  id: string;
  severity: 'fail' | 'warn' | 'info' | 'pass';
  title: string;
  detail: string;
  /** Optional section id to jump to */
  sectionId?: string;
  citeId?: string;
};

export type CitationAuditResult = {
  citedIds: string[];
  attachedIds: string[];
  missingIds: string[];
  unusedIds: string[];
  clusterCount: number;
  issues: CitationAuditIssue[];
  score: number;
  summary: string;
};

function attachedKeys(citations: CitationRecord[]): string[] {
  const keys = new Set<string>();
  for (const c of citations) {
    if (c.paperId) keys.add(c.paperId);
    if (c.id) keys.add(c.id);
  }
  return [...keys];
}

export function auditManuscriptCitations(opts: {
  fullText: string;
  citations: CitationRecord[];
  sectionTexts?: Array<{ sectionId: string; content: string }>;
}): CitationAuditResult {
  const { fullText, citations } = opts;
  const citedIds = extractCiteIdsOrdered(fullText);
  const byId = citationsToMap(citations);
  const attached = attachedKeys(citations);
  const attachedSet = new Set(attached);

  const missingIds = citedIds.filter((id) => !byId[id]);
  const citedSet = new Set(citedIds);
  const unusedIds = citations
    .map((c) => c.paperId || c.id)
    .filter((id): id is string => Boolean(id))
    .filter((id) => !citedSet.has(id) && !citedIds.some((c) => c === id));

  // Deduplicate unused by preferring paperId
  const unusedUnique = [...new Set(unusedIds)];

  const clusters = listCiteClusters(fullText);
  const issues: CitationAuditIssue[] = [];

  if (citedIds.length === 0 && attached.length === 0) {
    issues.push({
      id: 'no_cites',
      severity: 'fail',
      title: 'No citations yet',
      detail: 'Place the cursor in a body section and use Cite, or select a claim for Citation AI.',
    });
  } else if (citedIds.length === 0 && attached.length > 0) {
    issues.push({
      id: 'attached_not_cited',
      severity: 'warn',
      title: 'References attached but not cited',
      detail: `${attached.length} reference(s) in the draft library, but none appear in the text.`,
    });
  }

  if (missingIds.length) {
    issues.push({
      id: 'missing_records',
      severity: 'fail',
      title: 'Citations without library records',
      detail: `${missingIds.length} cite marker(s) point to unknown ids: ${missingIds
        .slice(0, 4)
        .join(', ')}${missingIds.length > 4 ? '…' : ''}. Re-attach the paper or remove the marker.`,
      citeId: missingIds[0],
    });
  } else if (citedIds.length > 0) {
    issues.push({
      id: 'all_resolved',
      severity: 'pass',
      title: 'All in-text citations resolve',
      detail: `${citedIds.length} unique reference(s) linked to your library.`,
    });
  }

  if (unusedUnique.length) {
    issues.push({
      id: 'unused_refs',
      severity: 'info',
      title: 'Unused references in draft library',
      detail: `${unusedUnique.length} attached reference(s) are not cited in the manuscript. Remove them or cite them where appropriate.`,
    });
  }

  // Incomplete metadata
  const thin = citations.filter(
    (c) =>
      citedSet.has(c.paperId || '') ||
      citedSet.has(c.id || '')
  ).filter((c) => !c.year || !(c.authors && c.authors.length) || !c.title);
  if (thin.length) {
    issues.push({
      id: 'thin_metadata',
      severity: 'warn',
      title: 'Cited works with incomplete metadata',
      detail: `${thin.length} cited reference(s) are missing authors, year, or title — fix before submission.`,
    });
  }

  // Find which section has missing cites
  if (opts.sectionTexts && missingIds.length) {
    for (const sec of opts.sectionTexts) {
      const ids = extractCiteIdsOrdered(sec.content || '');
      if (ids.some((id) => missingIds.includes(id))) {
        const issue = issues.find((i) => i.id === 'missing_records');
        if (issue) issue.sectionId = sec.sectionId;
        break;
      }
    }
  }

  void clusters;
  void attachedSet;

  const fail = issues.filter((i) => i.severity === 'fail').length;
  const warn = issues.filter((i) => i.severity === 'warn').length;
  let score = 100;
  score -= fail * 35;
  score -= warn * 12;
  score = Math.max(0, Math.min(100, score));

  let summary = 'Citation integrity looks solid.';
  if (fail) summary = 'Critical citation problems — fix missing records before export.';
  else if (warn) summary = 'Citation integrity needs attention before submission.';
  else if (unusedUnique.length)
    summary = 'Citations resolve; consider pruning unused library items.';

  return {
    citedIds,
    attachedIds: attached,
    missingIds,
    unusedIds: unusedUnique,
    clusterCount: clusters.length,
    issues,
    score,
    summary,
  };
}
