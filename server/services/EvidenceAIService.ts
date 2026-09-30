/**
 * Evidence Pack AI — summarize, captions, claim checks, Results drafts.
 * Grounded on pack artifacts only (no invented data).
 */

import { AIProviderFactory } from './AIProviderFactory.js';
import { getApiForTask } from '../routes/apiTaskAssignments.js';

export type EvidenceAIAction =
  | 'summarize'
  | 'captions'
  | 'claim_check'
  | 'draft_results';

export interface EvidenceAIRequest {
  userId: string;
  action: EvidenceAIAction;
  title?: string;
  summary?: string;
  methodology?: string;
  conclusions?: string;
  /** Pre-built pack text context from the client */
  packContext: string;
}

export interface EvidenceAIResult {
  action: EvidenceAIAction;
  content: string;
  /** Structured fields when the model returns usable JSON */
  structured?: Record<string, unknown>;
  provider?: string;
}

const ACTION_INSTRUCTIONS: Record<EvidenceAIAction, string> = {
  summarize: `Write a concise scientific pack summary for a lab notebook.
Return JSON:
{
  "summary": "1-2 sentences covering what was measured and the main outcome",
  "key_findings": ["...", "..."],
  "open_questions": ["..."]
}
Only use information present in the pack. If empty, say so.`,

  captions: `Propose figure titles and legends for IMAGE artifacts, and short titles for TABLES.
Return JSON:
{
  "figures": [{ "artifactId": "...", "title": "...", "legend": "..." }],
  "tables": [{ "artifactId": "...", "title": "..." }]
}
Use artifact ids from the pack. Do not invent numbers not in the pack.`,

  claim_check: `Check TEXT findings against tables/sheets/figures in the pack.
Return JSON:
{
  "overall": "supported" | "partially_supported" | "unsupported" | "insufficient_data",
  "issues": [
    { "severity": "high"|"medium"|"low", "claim": "...", "problem": "...", "suggestion": "..." }
  ],
  "notes": "short overall assessment"
}
Flag polarity mismatches, missing n/controls, claims without cited evidence.`,

  draft_results: `Draft a publication-style Results paragraph and suggested conclusions from this pack.
Return JSON:
{
  "results_section": "markdown paragraphs suitable for a paper Results section",
  "suggested_conclusions": "2-4 sentences",
  "suggested_methodology_notes": "optional methods notes inferred from pack metadata"
}
Ground every quantitative statement in pack content. Mark uncertainty explicitly.`,
};

function extractJson(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim()) as Record<string, unknown>;
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export class EvidenceAIService {
  static async run(request: EvidenceAIRequest): Promise<EvidenceAIResult> {
    if (!request.packContext?.trim()) {
      throw new Error('Pack context is required');
    }

    const apiAssignment =
      (await getApiForTask(request.userId, 'data_analysis')) ||
      (await getApiForTask(request.userId, 'content_writing'));

    if (!apiAssignment) {
      throw new Error(
        'No AI API configured. Add an API key and assign it to data analysis or content writing in Settings.'
      );
    }

    const provider = AIProviderFactory.createProvider(
      apiAssignment.provider,
      apiAssignment.apiKey
    );

    const system = `You are a careful scientific research assistant helping a lab scientist work with an evidence pack.
Rules:
- Use ONLY facts present in the pack context.
- Never invent statistics, sample sizes, p-values, or modalities.
- Prefer clear, precise scientific language.
- Always respond with valid JSON as specified.`;

    const user = [
      `Action: ${request.action}`,
      request.title ? `Pack title: ${request.title}` : '',
      request.summary ? `Existing summary: ${request.summary}` : '',
      request.methodology ? `Methodology: ${request.methodology}` : '',
      request.conclusions ? `Conclusions: ${request.conclusions}` : '',
      '',
      ACTION_INSTRUCTIONS[request.action],
      '',
      '=== EVIDENCE PACK ===',
      request.packContext,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await provider.chat(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 2500,
      }
    );

    const content = response.content || '';
    const structured = extractJson(content);

    return {
      action: request.action,
      content,
      structured,
      provider: apiAssignment.provider,
    };
  }
}
