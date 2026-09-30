/**
 * Writing Studio AI assist — routes section / full-draft requests to the right agent.
 */

import { AgentFactory } from '../AgentFactory.js';
import { UserContextRetriever } from '../UserContextRetriever.js';
import { gateAgentExecution } from '../safety/agentSafetyGate.js';
import {
  WritingDraftContent,
  getWritingTemplate,
  draftToMarkdown,
  getSectionContent,
} from '../../../utils/writingTemplates.js';

export type AssistMode = 'section' | 'full' | 'citations' | 'continue';

export class WritingAssistService {
  static async assist(opts: {
    userId: string;
    userRole?: string;
    draft: WritingDraftContent;
    mode: AssistMode;
    sectionId?: string;
    instruction?: string;
    /** Attached source excerpts for grounded continue */
    groundedSources?: Array<{
      title: string;
      authors?: string[];
      year?: number | null;
      doi?: string | null;
      abstract?: string | null;
      sourceText?: string | null;
      inText?: string;
    }>;
  }): Promise<{
    success: boolean;
    content?: any;
    sectionUpdates?: Array<{ sectionId: string; content: string }>;
    continuedText?: string;
    bibliography?: string;
    error?: string;
    agentType?: string;
  }> {
    const template = getWritingTemplate(opts.draft.templateId);
    const agentType =
      opts.mode === 'citations'
        ? 'reference_management'
        : opts.mode === 'continue'
          ? 'paper_writing'
          : template.primaryAgent;

    const section = opts.sectionId
      ? template.sections.find((s) => s.id === opts.sectionId)
      : null;

    const input = this.buildInput(
      opts.draft,
      opts.mode,
      opts.sectionId,
      opts.instruction,
      opts.groundedSources
    );

    const gate = await gateAgentExecution({
      userId: opts.userId,
      agentType,
      input,
      userRole: opts.userRole,
    });
    if (!gate.allowed) {
      return {
        success: false,
        error: gate.blockedReason || 'Blocked by safety policy',
        agentType,
      };
    }

    const agent = AgentFactory.createAgent(agentType);
    if (!agent.validateInput(input)) {
      return {
        success: false,
        error: 'Invalid assist input — add a title and some context first.',
        agentType,
      };
    }

    const userContext = await UserContextRetriever.retrieveContext(
      opts.userId,
      opts.draft.title || opts.draft.researchQuestion || template.name
    );

    const result = await agent.execute(input, {
      userContext,
      conversationHistory: [],
      additionalData: { userId: opts.userId },
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Assist failed',
        agentType,
      };
    }

    if (opts.mode === 'citations') {
      return {
        success: true,
        content: result.content,
        bibliography: result.content?.bibliography,
        agentType,
      };
    }

    if (opts.mode === 'continue' && opts.sectionId) {
      const continued = this.extractContinuedText(result.content, opts.sectionId);
      const existing = getSectionContent(opts.draft, opts.sectionId);
      const merged = continued
        ? existing.trim()
          ? `${existing.trim()}\n\n${continued.trim()}`
          : continued.trim()
        : existing;
      return {
        success: true,
        content: result.content,
        continuedText: continued || undefined,
        sectionUpdates: continued
          ? [{ sectionId: opts.sectionId, content: merged }]
          : [],
        agentType,
      };
    }

    const sectionUpdates = this.mapAgentOutputToSections(
      opts.draft,
      result.content,
      opts.mode,
      opts.sectionId,
      section?.assistHint
    );

    return {
      success: true,
      content: result.content,
      sectionUpdates,
      agentType,
    };
  }

  private static extractContinuedText(content: any, sectionId: string): string {
    if (!content) return '';
    const paper = content.paper || content;
    const map: Record<string, unknown> = {
      abstract: paper?.abstract?.text || paper?.abstract,
      introduction: paper?.introduction?.text || paper?.introduction,
      methods: paper?.methods?.text || paper?.methods,
      results: paper?.results?.text || paper?.results,
      discussion: paper?.discussion?.text || paper?.discussion,
      conclusion: paper?.conclusion?.text || paper?.conclusion,
    };
    const direct = map[sectionId] || content?.text || content?.content || content?.continuation;
    if (typeof direct === 'string') return direct;
    // Fallback: stringify first useful string field
    for (const v of Object.values(map)) {
      if (typeof v === 'string' && v.trim()) return v;
    }
    return '';
  }

  private static buildInput(
    draft: WritingDraftContent,
    mode: AssistMode,
    sectionId?: string,
    instruction?: string,
    groundedSources?: Array<{
      title: string;
      authors?: string[];
      year?: number | null;
      doi?: string | null;
      abstract?: string | null;
      sourceText?: string | null;
      inText?: string;
    }>
  ) {
    const template = getWritingTemplate(draft.templateId);
    const markdown = draftToMarkdown(draft);

    if (mode === 'continue') {
      const sectionBody = sectionId ? getSectionContent(draft, sectionId) : '';
      const sourceBlock = (groundedSources || [])
        .map((s, i) => {
          const excerpt = (s.sourceText || s.abstract || '').slice(0, 2500);
          return [
            `SOURCE ${i + 1}${s.inText ? ` ${s.inText}` : ''}`,
            `Title: ${s.title}`,
            s.authors?.length ? `Authors: ${s.authors.join(', ')}` : '',
            s.year ? `Year: ${s.year}` : '',
            s.doi ? `DOI: ${s.doi}` : '',
            excerpt ? `Excerpt:\n${excerpt}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        })
        .join('\n\n---\n\n');

      return {
        title: draft.title || 'Untitled',
        researchQuestion: draft.researchQuestion,
        context: {
          background: [
            `Continue the “${sectionId || 'section'}” section. Write 1–3 new paragraphs that follow naturally from the existing text.`,
            'ONLY use claims supported by the SOURCES below. Insert in-text citations using the provided markers.',
            'If a claim cannot be supported, omit it. Do not invent DOIs, authors, or findings.',
            instruction || '',
            '',
            'EXISTING SECTION TEXT:',
            sectionBody || '(empty — start the section)',
            '',
            'SOURCES (grounded):',
            sourceBlock || '(no sources attached — write cautiously and mark [UNVERIFIED] on speculative claims)',
          ].join('\n'),
          methodology: getSectionContent(draft, 'methods'),
          results: getSectionContent(draft, 'results'),
          relatedWork: sourceBlock,
        },
        existingSections: {
          abstract: getSectionContent(draft, 'abstract'),
          introduction: getSectionContent(draft, 'introduction'),
          methods: getSectionContent(draft, 'methods'),
          results: getSectionContent(draft, 'results'),
          discussion: getSectionContent(draft, 'discussion'),
        },
        sections: {
          includeAbstract: sectionId === 'abstract',
          includeIntroduction: !sectionId || sectionId === 'introduction',
          includeMethods: sectionId === 'methods',
          includeResults: sectionId === 'results',
          includeDiscussion: sectionId === 'discussion' || (!sectionId && true),
          includeConclusion: sectionId === 'conclusion',
          includeReferences: false,
        },
        style: {
          journal: draft.targetVenue || undefined,
          format: draft.citationStyle === 'Vancouver' ? 'APA' : draft.citationStyle,
          wordLimit: 600,
          tone: 'academic' as const,
        },
      };
    }

    if (mode === 'citations') {
      return {
        content: markdown,
        topics: [
          draft.title,
          draft.researchQuestion,
          ...(draft.keywords || []),
        ].filter(Boolean),
        citationStyle: draft.citationStyle,
        action: 'all',
        context: {
          paperTitle: draft.title,
          researchField: draft.targetVenue,
          keywords: draft.keywords,
        },
        maxReferences: 15,
      };
    }

    if (template.primaryAgent === 'literature_review') {
      return {
        topic: draft.title || draft.researchQuestion || template.name,
        researchQuestion: draft.researchQuestion,
        focus: template.id.includes('systematic') ? 'systematic' : 'narrative',
        scope: {
          keywords: draft.keywords?.length
            ? draft.keywords
            : [draft.researchQuestion, draft.title].filter(Boolean),
        },
        sections: sectionId ? [sectionId] : undefined,
        maxPapers: 25,
        instruction:
          instruction ||
          (sectionId
            ? `Focus on drafting the “${sectionId}” section for this review.`
            : undefined),
        existingContent: sectionId ? getSectionContent(draft, sectionId) : markdown,
      };
    }

    if (template.primaryAgent === 'abstract_writing') {
      return {
        title: draft.title || 'Untitled',
        content:
          markdown.trim().length > 40
            ? markdown
            : [
                draft.title,
                draft.researchQuestion,
                getSectionContent(draft, 'body'),
                instruction,
              ]
                .filter(Boolean)
                .join('\n\n') || draft.title || 'Research abstract',
        type: template.id.includes('review') ? 'review' : 'research',
        wordLimit: template.wordLimit || 250,
        style: 'structured' as const,
      };
    }

    if (template.primaryAgent === 'proposal_writing') {
      return {
        title: draft.title || 'Untitled proposal',
        researchQuestion: draft.researchQuestion,
        fundingAgency: draft.fundingAgency || draft.targetVenue,
        templateId: draft.templateId.replace(/^grant_/, ''),
        templateName: template.name,
        evaluationCriteria: template.evaluationCriteria,
        fullMarkdown: markdown,
        wordLimit: template.wordLimit,
        background: getSectionContent(draft, 'background') || getSectionContent(draft, 'introduction'),
        methodology:
          getSectionContent(draft, 'methodology') || getSectionContent(draft, 'methods'),
        objectives: (getSectionContent(draft, 'objectives') || '')
          .split('\n')
          .map((l) => l.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean),
        expectedOutcomes: (getSectionContent(draft, 'outcomes') || '')
          .split('\n')
          .map((l) => l.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean),
        timeline: getSectionContent(draft, 'workplan') || getSectionContent(draft, 'timeline'),
        ...(sectionId
          ? {
              focusSection: sectionId,
              instruction:
                instruction ||
                template.sections.find((s) => s.id === sectionId)?.assistHint,
            }
          : {}),
      };
    }

    // paper_writing
    const sectionsFlag = {
      includeAbstract: true,
      includeIntroduction: true,
      includeMethods: true,
      includeResults: true,
      includeDiscussion: true,
      includeConclusion: true,
      includeReferences: false,
    };

    return {
      title: draft.title,
      researchQuestion: draft.researchQuestion,
      context: {
        background: getSectionContent(draft, 'introduction'),
        methodology: getSectionContent(draft, 'methods'),
        results: getSectionContent(draft, 'results'),
        relatedWork: instruction || '',
      },
      existingSections: {
        abstract: getSectionContent(draft, 'abstract'),
        introduction: getSectionContent(draft, 'introduction'),
        methods: getSectionContent(draft, 'methods'),
        results: getSectionContent(draft, 'results'),
        discussion: getSectionContent(draft, 'discussion'),
      },
      sections: sectionId
        ? {
            includeAbstract: sectionId === 'abstract',
            includeIntroduction: sectionId === 'introduction',
            includeMethods: sectionId === 'methods',
            includeResults: sectionId === 'results',
            includeDiscussion: sectionId === 'discussion',
            includeConclusion: sectionId === 'conclusion',
            includeReferences: false,
          }
        : sectionsFlag,
      style: {
        journal: draft.targetVenue || undefined,
        format: draft.citationStyle === 'Vancouver' ? 'APA' : draft.citationStyle,
        wordLimit: template.wordLimit,
        tone: 'academic' as const,
      },
      instruction,
    };
  }

  private static mapAgentOutputToSections(
    draft: WritingDraftContent,
    content: any,
    mode: AssistMode,
    sectionId?: string,
    _assistHint?: string
  ): Array<{ sectionId: string; content: string }> {
    const updates: Array<{ sectionId: string; content: string }> = [];
    if (!content) return updates;

    const paper = content.paper || content;
    const proposal = content.proposal || content;
    const review = content.review || content.literatureReview || content;

    const push = (id: string, text?: string) => {
      if (text && typeof text === 'string' && text.trim()) {
        updates.push({ sectionId: id, content: text.trim() });
      }
    };

    if (mode === 'section' && sectionId) {
      // Prefer explicit section text fields
      const candidates = [
        paper?.[sectionId]?.text,
        paper?.[sectionId],
        proposal?.[sectionId],
        review?.[sectionId],
        content?.[sectionId]?.text,
        content?.[sectionId],
        content?.text,
        content?.content,
        typeof content === 'string' ? content : null,
      ];
      const text = candidates.find((c) => typeof c === 'string' && c.trim()) as
        | string
        | undefined;
      if (text) {
        push(sectionId, text);
        return updates;
      }
    }

    // Full paper mapping
    push('title', paper?.title);
    push('abstract', paper?.abstract?.text || paper?.abstract);
    push('introduction', paper?.introduction?.text || paper?.introduction);
    push('methods', paper?.methods?.text || paper?.methods);
    push('results', paper?.results?.text || paper?.results);
    push('discussion', paper?.discussion?.text || paper?.discussion);
    push('conclusion', paper?.conclusion?.text || paper?.conclusion);

    // Proposal mapping
    push('summary', proposal?.executiveSummary);
    push('background', proposal?.background);
    if (Array.isArray(proposal?.objectives)) {
      push(
        'objectives',
        proposal.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
      );
    }
    push('methodology', proposal?.methodology);
    if (Array.isArray(proposal?.expectedOutcomes)) {
      push(
        'outcomes',
        proposal.expectedOutcomes.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')
      );
    }
    push('workplan', proposal?.timeline);
    push('resources', proposal?.budgetJustification);

    // Review / literature
    push('introduction', review?.introduction || review?.rationale);
    const findingsText = Array.isArray(review?.findings)
      ? review.findings
          .map(
            (f: any) =>
              `### ${f.theme || 'Theme'}\n${f.synthesis || ''}\n${(f.keyFindings || []).join('; ')}`
          )
          .join('\n\n')
      : review?.synthesis || review?.findings;
    push('results_synthesis', typeof findingsText === 'string' ? findingsText : undefined);
    push(
      'discussion',
      review?.discussion ||
        (Array.isArray(review?.gaps) ? `Research gaps:\n- ${review.gaps.join('\n- ')}` : undefined)
    );
    push('conclusion', review?.conclusion || review?.conclusions);
    push('abstract', review?.abstract);
    push('body', review?.abstract || proposal?.executiveSummary);
    if (Array.isArray(review?.references) && review.references.length) {
      push('methods_search', `Key references considered:\n${review.references.slice(0, 20).join('\n')}`);
    }

    // Only update empty sections on full mode unless section mode already returned
    if (mode === 'full') {
      return updates.filter((u) => {
        const existing = getSectionContent(draft, u.sectionId).trim();
        return !existing || existing.length < 40;
      });
    }

    return updates;
  }
}
