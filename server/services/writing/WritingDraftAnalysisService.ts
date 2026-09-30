/**
 * Server-side draft analysis — deterministic checks + optional AI peer-review notes.
 */

import {
  analyzeWritingDraft,
  DraftAnalysisResult,
} from '../../../utils/writingDraftAnalysis.js';
import { WritingDraftContent, draftToMarkdown } from '../../../utils/writingTemplates.js';
import { AgentFactory } from '../AgentFactory.js';
import { gateAgentExecution } from '../safety/agentSafetyGate.js';
import { UserContextRetriever } from '../UserContextRetriever.js';

export class WritingDraftAnalysisService {
  static async analyze(opts: {
    userId: string;
    userRole?: string;
    draft: WritingDraftContent;
    citationCount?: number;
    bibliography?: string;
    enrichWithAi?: boolean;
  }): Promise<DraftAnalysisResult & { aiNotes?: string }> {
    const base = analyzeWritingDraft(opts.draft, {
      citationCount: opts.citationCount,
      bibliography: opts.bibliography,
    });

    if (!opts.enrichWithAi) {
      return base;
    }

    try {
      const failing = base.checks
        .filter((c) => c.severity === 'fail' || c.severity === 'warn')
        .slice(0, 12)
        .map((c) => `- [${c.severity}] ${c.title}: ${c.detail}`)
        .join('\n');

      const input = {
        title: opts.draft.title || 'Untitled',
        researchQuestion: opts.draft.researchQuestion,
        targetVenue: opts.draft.targetVenue,
        citationStyle: opts.draft.citationStyle,
        draftMarkdown: draftToMarkdown(opts.draft).slice(0, 12000),
        checklistGaps: failing,
        mode: 'pre_submission_review',
        instruction:
          'Write 5–8 concrete revision actions for pre-submission. Do not invent data or DOIs.',
      };

      const gate = await gateAgentExecution({
        userId: opts.userId,
        agentType: 'paper_writing',
        input,
        userRole: opts.userRole,
      });
      if (!gate.allowed) {
        return base;
      }

      const agent = AgentFactory.createAgent('paper_writing');
      if (!agent?.validateInput?.(input) && !agent?.execute) {
        return base;
      }

      const userContext = await UserContextRetriever.retrieveContext(
        opts.userId,
        opts.draft.title || opts.draft.researchQuestion || 'manuscript'
      );

      const result = await agent.execute(input, {
        userContext,
        conversationHistory: [],
        additionalData: { userId: opts.userId },
      });

      if (!result?.success) return base;

      const raw =
        result.content?.reviewNotes ||
        result.content?.summary ||
        result.content?.text ||
        (typeof result.content === 'string' ? result.content : JSON.stringify(result.content));

      return {
        ...base,
        aiNotes: raw ? String(raw).slice(0, 4000) : undefined,
      };
    } catch {
      return base;
    }
  }
}
