/**
 * Literature Evidence Finder + Citation Checker (grounded on abstract/PDF only).
 */

import { ScholarlyService } from './ScholarlyService.js';
import { CanonicalPaper } from './types.js';
import { PaperRepository } from './PaperRepository.js';
import { AgentFactory } from '../AgentFactory.js';
import { gateAgentExecution } from '../safety/agentSafetyGate.js';
import pool from '../../../database/config.js';

export type EvidenceLabel =
  | 'potentially_supporting'
  | 'relevant_background'
  | 'potentially_conflicting'
  | 'insufficient_evidence';

export class EvidenceFinderService {
  static async findEvidence(opts: {
    userId: string;
    userRole?: string;
    claim: string;
    limit?: number;
  }): Promise<{
    claim: string;
    results: Array<{
      paper: CanonicalPaper & { id?: string };
      label: EvidenceLabel;
      relevanceScore: number;
      evidencePreview: string | null;
      note: string;
    }>;
    disclaimer: string;
  }> {
    const claim = opts.claim.trim();
    const search = await ScholarlyService.search({
      query: claim,
      limit: opts.limit || 12,
      sort: 'relevance',
    });

    const results = [];
    for (const paper of search.papers) {
      const preview = paper.abstract?.slice(0, 400) || null;
      let label: EvidenceLabel = preview ? 'relevant_background' : 'insufficient_evidence';
      let note =
        'Title/topic overlap only — not verified as supporting evidence without reading the source.';

      if (preview) {
        const claimTokens = claim
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 4);
        const hits = claimTokens.filter((t) => preview.toLowerCase().includes(t)).length;
        const ratio = claimTokens.length ? hits / claimTokens.length : 0;
        if (ratio >= 0.35) {
          label = 'potentially_supporting';
          note = 'Abstract shares substantial terminology with the claim; verify directly before citing as support.';
        } else if (/\b(however|not|no evidence|fail|contradict)\b/i.test(preview) && ratio > 0.15) {
          label = 'potentially_conflicting';
          note = 'Abstract language may conflict with the claim; read carefully.';
        }
      }

      // Persist for save/cite
      let stored: (CanonicalPaper & { id: string }) | undefined;
      try {
        stored = await PaperRepository.upsert(paper);
      } catch {
        stored = undefined;
      }

      results.push({
        paper: stored || paper,
        label,
        relevanceScore: Math.round(
          (preview ? 50 : 20) + Math.min(30, Math.log10((paper.citationCount || 0) + 1) * 10)
        ),
        evidencePreview: preview,
        note,
      });
    }

    return {
      claim,
      results,
      disclaimer:
        'AI-assisted assessment. Researchers should verify the source directly before publication. Never claim support from title similarity alone.',
    };
  }

  static async checkCitation(opts: {
    userId: string;
    userRole?: string;
    claim: string;
    paperIds: string[];
  }): Promise<{
    assessments: Array<{
      paperId: string;
      status:
        | 'support'
        | 'partially_support'
        | 'not_clearly_support'
        | 'contradict'
        | 'cannot_verify';
      explanation: string;
      excerpt: string | null;
    }>;
    disclaimer: string;
  }> {
    const assessments = [];
    for (const paperId of opts.paperIds) {
      const paper = await PaperRepository.getById(paperId);
      if (!paper) {
        assessments.push({
          paperId,
          status: 'cannot_verify' as const,
          explanation: 'Paper not found.',
          excerpt: null,
        });
        continue;
      }

      const libRow = await pool.query(
        `SELECT user_pdf_text FROM user_library_items WHERE user_id = $1 AND paper_id = $2`,
        [opts.userId, paperId]
      );
      let sourceText = libRow.rows?.[0]?.user_pdf_text || '';
      if (!sourceText) sourceText = paper.abstract || '';

      if (!sourceText.trim()) {
        assessments.push({
          paperId,
          status: 'cannot_verify' as const,
          explanation: 'No abstract or uploaded full text available to verify this claim.',
          excerpt: null,
        });
        continue;
      }

      const excerpt = sourceText.slice(0, 600);
      const claimTokens = opts.claim
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 4);
      const hits = claimTokens.filter((t) => excerpt.toLowerCase().includes(t)).length;
      const ratio = claimTokens.length ? hits / claimTokens.length : 0;
      const neg = /\b(however|not |no evidence|contrary|failed to|did not)\b/i.test(excerpt);

      let status:
        | 'support'
        | 'partially_support'
        | 'not_clearly_support'
        | 'contradict'
        | 'cannot_verify' = 'not_clearly_support';
      let explanation = 'Overlap with source text is limited; cannot confirm support.';

      if (neg && ratio > 0.2) {
        status = 'contradict';
        explanation = 'Source passage contains negating language relative to the claim.';
      } else if (ratio >= 0.45) {
        status = 'support';
        explanation = 'Source text appears consistent with the claim based on overlapping content.';
      } else if (ratio >= 0.25) {
        status = 'partially_support';
        explanation = 'Source partially overlaps the claim; may support only part of the statement.';
      }

      // Optional LLM refinement when abstract_writing available
      try {
        const gate = await gateAgentExecution({
          userId: opts.userId,
          agentType: 'quality_validation',
          input: { claim: opts.claim, excerpt },
          userRole: opts.userRole,
        });
        if (gate.allowed) {
          const agent = AgentFactory.createAgent('quality_validation');
          if (agent?.validateInput?.({ content: excerpt })) {
            /* keep heuristic status — quality agent schemas vary */
          }
        }
      } catch {
        /* heuristic only */
      }

      assessments.push({ paperId, status, explanation, excerpt });
    }

    return {
      assessments,
      disclaimer:
        'AI-assisted assessment. Researchers should verify the source directly before publication.',
    };
  }
}
