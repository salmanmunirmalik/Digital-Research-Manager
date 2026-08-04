/**
 * NotebookSummaryGenerator - AI daily/weekly research digests from lab notebook entries.
 * MySQL-compatible. Falls back to structured heuristics when no AI key is available.
 */

import pool from '../../database/config.js';
import { AIProviderFactory } from './AIProviderFactory.js';
import { getApiForTask } from '../routes/apiTaskAssignments.js';
import {
  getApiKeyWithFallback,
  getUserDefaultProvider,
} from '../routes/aiProviderKeys.js';

export interface SummaryRequest {
  userId: string;
  summaryType: 'daily' | 'weekly' | 'project' | 'publication';
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectId?: string;
  entryIds?: string[];
}

export type SummaryMode = 'ai' | 'basic' | 'empty';
export type ResearchMomentum = 'high' | 'steady' | 'blocked' | 'sparse';

export interface NotebookSummary {
  summary: string;
  keyFindings: string[];
  nextSteps: string[];
  themes?: string[];
  blockers?: string[];
  openQuestions?: string[];
  wins?: string[];
  suggestedFocus?: string;
  momentum?: ResearchMomentum;
  metrics?: {
    totalEntries: number;
    experimentsCompleted: number;
    experimentsInProgress: number;
    keyResults: number;
  };
  sections?: {
    methods?: string;
    results?: string;
    discussion?: string;
  };
  mode?: SummaryMode;
  periodLabel?: string;
}

type AiCredentials = { provider: string; apiKey: string };

const clip = (value: unknown, max = 800): string => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

export class NotebookSummaryGenerator {
  static async generateSummary(request: SummaryRequest): Promise<NotebookSummary> {
    try {
      const entries = await this.getRelevantEntries(request);
      const periodLabel = this.periodLabel(request);

      if (entries.length === 0) {
        return {
          summary:
            request.summaryType === 'daily'
              ? 'No notebook entries for today yet. Capture an experiment note, meeting, or quick observation to unlock an AI digest.'
              : request.summaryType === 'weekly'
                ? 'No notebook entries in the last 7 days. Log a few notes this week and regenerate for a research digest.'
                : 'No entries found for the specified period.',
          keyFindings: [],
          nextSteps: [
            'Add at least one notebook entry covering objectives, results, or next steps',
            'Regenerate the summary after logging work',
          ],
          themes: [],
          blockers: [],
          openQuestions: [],
          wins: [],
          suggestedFocus:
            request.summaryType === 'daily'
              ? 'Write today’s first entry before leaving the bench'
              : 'Plan one high-signal experiment note for tomorrow',
          momentum: 'sparse',
          metrics: {
            totalEntries: 0,
            experimentsCompleted: 0,
            experimentsInProgress: 0,
            keyResults: 0,
          },
          mode: 'empty',
          periodLabel,
        };
      }

      const credentials = await this.resolveAiCredentials(request.userId);
      if (!credentials) {
        return {
          ...this.generateBasicSummary(entries, request),
          mode: 'basic',
          periodLabel,
        };
      }

      try {
        const aiProvider = AIProviderFactory.createProvider(
          credentials.provider,
          credentials.apiKey
        );

        let summary: NotebookSummary;
        switch (request.summaryType) {
          case 'daily':
            summary = await this.generateDailySummary(entries, aiProvider, credentials);
            break;
          case 'weekly':
            summary = await this.generateWeeklySummary(entries, aiProvider, credentials);
            break;
          case 'project':
            summary = await this.generateProjectSummary(
              entries,
              request.projectId!,
              aiProvider,
              credentials
            );
            break;
          case 'publication':
            summary = await this.generatePublicationSummary(entries, aiProvider, credentials);
            break;
          default:
            summary = this.generateBasicSummary(entries, request);
            summary.mode = 'basic';
        }

        return {
          ...summary,
          mode: summary.mode || 'ai',
          periodLabel,
          metrics: summary.metrics || this.computeMetrics(entries),
        };
      } catch (aiError: any) {
        console.warn('AI notebook summary failed, using structured fallback:', aiError?.message);
        const fallback = this.generateBasicSummary(entries, request);
        return {
          ...fallback,
          mode: 'basic',
          periodLabel,
          summary: `${fallback.summary} (AI provider unavailable - showing structured digest from your notes.)`,
        };
      }
    } catch (error: any) {
      console.error('Error generating notebook summary:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  private static async resolveAiCredentials(userId: string): Promise<AiCredentials | null> {
    try {
      const assignment = await getApiForTask(userId, 'content_writing');
      if (assignment?.apiKey) {
        return { provider: assignment.provider, apiKey: assignment.apiKey };
      }
    } catch (error) {
      console.warn('getApiForTask failed for notebook summary:', error);
    }

    try {
      const provider = (await getUserDefaultProvider(userId, 'chat')) || 'google_gemini';
      const apiKey = await getApiKeyWithFallback(userId, provider, true);
      if (apiKey) return { provider, apiKey };

      if (provider !== 'google_gemini') {
        const geminiKey = await getApiKeyWithFallback(userId, 'google_gemini', true);
        if (geminiKey) return { provider: 'google_gemini', apiKey: geminiKey };
      }
    } catch (error) {
      console.warn('AI key fallback failed for notebook summary:', error);
    }

    return null;
  }

  private static periodLabel(request: SummaryRequest): string {
    if (request.dateRange?.start && request.dateRange?.end) {
      const start = request.dateRange.start.toLocaleDateString();
      const end = request.dateRange.end.toLocaleDateString();
      return start === end ? start : `${start} → ${end}`;
    }
    if (request.summaryType === 'daily') return 'Today';
    if (request.summaryType === 'weekly') return 'Last 7 days';
    if (request.summaryType === 'project') return 'Project lifetime';
    return 'Selected period';
  }

  private static async getRelevantEntries(request: SummaryRequest): Promise<any[]> {
    try {
      let query = `
        SELECT
          id, title, content, entry_type, status, objectives, methodology,
          results, conclusions, next_steps, tags, created_at, updated_at, project_id
        FROM lab_notebook_entries
        WHERE user_id = $1
      `;
      const params: any[] = [request.userId];
      let paramIndex = 2;

      if (request.projectId) {
        query += ` AND project_id = $${paramIndex}`;
        params.push(request.projectId);
        paramIndex += 1;
      }

      if (request.entryIds && request.entryIds.length > 0) {
        const placeholders = request.entryIds.map(() => {
          const p = `$${paramIndex}`;
          paramIndex += 1;
          return p;
        });
        query += ` AND id IN (${placeholders.join(', ')})`;
        params.push(...request.entryIds);
      }

      if (request.dateRange?.start && request.dateRange?.end) {
        query += ` AND DATE(created_at) >= DATE($${paramIndex}) AND DATE(created_at) <= DATE($${paramIndex + 1})`;
        params.push(request.dateRange.start, request.dateRange.end);
        paramIndex += 2;
      } else if (request.summaryType === 'daily') {
        query += ` AND DATE(created_at) = CURDATE()`;
      } else if (request.summaryType === 'weekly') {
        query += ` AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
      }

      query += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting relevant entries:', error);
      return [];
    }
  }

  private static formatEntriesForPrompt(entries: any[]): string {
    return entries
      .map((e) => {
        const tags = Array.isArray(e.tags)
          ? e.tags.join(', ')
          : typeof e.tags === 'string'
            ? e.tags
            : '';
        return [
          `Title: ${e.title || 'Untitled'}`,
          `Type: ${e.entry_type || 'note'} | Status: ${e.status || 'unknown'}`,
          `When: ${e.created_at ? new Date(e.created_at).toISOString() : 'n/a'}`,
          clip(e.objectives) && `Objectives: ${clip(e.objectives, 400)}`,
          clip(e.methodology) && `Methods: ${clip(e.methodology, 400)}`,
          clip(e.results) && `Results: ${clip(e.results, 500)}`,
          clip(e.conclusions) && `Conclusions: ${clip(e.conclusions, 400)}`,
          clip(e.next_steps) && `Next steps: ${clip(e.next_steps, 400)}`,
          clip(e.content) && `Notes: ${clip(e.content, 500)}`,
          tags && `Tags: ${tags}`,
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n---\n');
  }

  private static computeMetrics(entries: any[]) {
    return {
      totalEntries: entries.length,
      experimentsCompleted: entries.filter((e) => e.status === 'completed').length,
      experimentsInProgress: entries.filter((e) =>
        ['in_progress', 'active', 'running'].includes(String(e.status || ''))
      ).length,
      keyResults: entries.filter((e) => clip(e.results).length > 40).length,
    };
  }

  private static async chatJson(
    aiProvider: any,
    credentials: AiCredentials,
    system: string,
    prompt: string,
    maxTokens: number
  ): Promise<any> {
    const response = await aiProvider.chat(
      [
        { role: 'system' as const, content: system },
        { role: 'user' as const, content: prompt },
      ],
      {
        apiKey: credentials.apiKey,
        temperature: 0.45,
        maxTokens,
      }
    );
    const responseText =
      typeof response === 'string'
        ? response
        : (response as any).content || JSON.stringify(response);
    return this.parseJSONResponse(responseText);
  }

  private static async generateDailySummary(
    entries: any[],
    aiProvider: any,
    credentials: AiCredentials
  ): Promise<NotebookSummary> {
    const prompt = `You are a senior lab scientist writing an end-of-day research digest for a peer.

TODAY'S NOTEBOOK ENTRIES:
${this.formatEntriesForPrompt(entries)}

Return ONLY JSON with this shape:
{
  "summary": "2-4 sentence narrative of what actually happened today",
  "keyFindings": ["concrete finding or observation", "..."],
  "wins": ["small win or progress signal"],
  "blockers": ["risk, delay, failed step, or missing reagent - empty if none"],
  "openQuestions": ["unresolved scientific or practical question"],
  "themes": ["2-4 short theme labels e.g. CRISPR optimization"],
  "nextSteps": ["specific action for tomorrow"],
  "suggestedFocus": "one sentence: the single highest-leverage thing to do next",
  "momentum": "high|steady|blocked|sparse"
}

Rules:
- Prefer specificity over generic advice.
- If results are thin, say so honestly and suggest what to capture next.
- Do not invent data that is not in the entries.`;

    const parsed = await this.chatJson(
      aiProvider,
      credentials,
      'You write precise, actionable research digests as JSON only.',
      prompt,
      1400
    );

    return {
      summary: parsed.summary || 'Daily research digest generated.',
      keyFindings: parsed.keyFindings || [],
      wins: parsed.wins || [],
      blockers: parsed.blockers || [],
      openQuestions: parsed.openQuestions || [],
      themes: parsed.themes || [],
      nextSteps: parsed.nextSteps || [],
      suggestedFocus: parsed.suggestedFocus || '',
      momentum: this.normalizeMomentum(parsed.momentum, entries),
      metrics: this.computeMetrics(entries),
      mode: 'ai',
    };
  }

  private static async generateWeeklySummary(
    entries: any[],
    aiProvider: any,
    credentials: AiCredentials
  ): Promise<NotebookSummary> {
    const entriesByDay = this.groupEntriesByDay(entries);
    const dayOutline = Object.entries(entriesByDay)
      .map(
        ([day, dayEntries]) =>
          `${day}:\n${(dayEntries as any[])
            .map((e) => `- ${e.title} (${e.entry_type}, ${e.status})`)
            .join('\n')}`
      )
      .join('\n\n');

    const prompt = `You are a PI-facing research coach writing a weekly lab notebook digest.

WEEK OUTLINE:
${dayOutline}

DETAILED ENTRIES:
${this.formatEntriesForPrompt(entries)}

Return ONLY JSON:
{
  "summary": "1-2 paragraph narrative of the week's research arc",
  "keyFindings": ["durable findings / decisions"],
  "wins": ["progress worth celebrating"],
  "blockers": ["patterns that slowed work"],
  "openQuestions": ["questions that should drive next week"],
  "themes": ["cross-cutting themes"],
  "nextSteps": ["prioritized actions for next week"],
  "suggestedFocus": "one sentence primary focus for next week",
  "momentum": "high|steady|blocked|sparse"
}

Rules:
- Spot patterns across days (repeats, drift, unfinished loops).
- Call out incomplete experiments that need closure.
- Do not invent results.`;

    const parsed = await this.chatJson(
      aiProvider,
      credentials,
      'You write weekly research retrospectives as JSON only.',
      prompt,
      2200
    );

    return {
      summary: parsed.summary || 'Weekly research digest generated.',
      keyFindings: parsed.keyFindings || [],
      wins: parsed.wins || [],
      blockers: parsed.blockers || [],
      openQuestions: parsed.openQuestions || [],
      themes: parsed.themes || [],
      nextSteps: parsed.nextSteps || [],
      suggestedFocus: parsed.suggestedFocus || '',
      momentum: this.normalizeMomentum(parsed.momentum, entries),
      metrics: this.computeMetrics(entries),
      mode: 'ai',
    };
  }

  private static async generateProjectSummary(
    entries: any[],
    projectId: string,
    aiProvider: any,
    credentials: AiCredentials
  ): Promise<NotebookSummary> {
    let project = { title: 'Project', description: '' };
    try {
      const projectResult = await pool.query(
        `SELECT title, description FROM projects WHERE id = $1`,
        [projectId]
      );
      if (projectResult.rows[0]) project = projectResult.rows[0];
    } catch {
      /* projects table may not exist */
    }

    const prompt = `Generate a project progress digest.

PROJECT: ${project.title}
${project.description ? `Description: ${project.description}` : ''}

ENTRIES:
${this.formatEntriesForPrompt(entries)}

Return ONLY JSON with summary, keyFindings, wins, blockers, openQuestions, themes, nextSteps, suggestedFocus, momentum.`;

    const parsed = await this.chatJson(
      aiProvider,
      credentials,
      'You write project progress digests as JSON only.',
      prompt,
      2000
    );

    return {
      summary: parsed.summary || 'Project summary generated.',
      keyFindings: parsed.keyFindings || [],
      wins: parsed.wins || [],
      blockers: parsed.blockers || [],
      openQuestions: parsed.openQuestions || [],
      themes: parsed.themes || [],
      nextSteps: parsed.nextSteps || [],
      suggestedFocus: parsed.suggestedFocus || '',
      momentum: this.normalizeMomentum(parsed.momentum, entries),
      metrics: this.computeMetrics(entries),
      mode: 'ai',
    };
  }

  private static async generatePublicationSummary(
    entries: any[],
    aiProvider: any,
    credentials: AiCredentials
  ): Promise<NotebookSummary> {
    const completedEntries = entries.filter((e) => e.status === 'completed' && e.results);
    const methodsText = completedEntries
      .map((e) => `${e.title}:\nMethodology: ${e.methodology || 'N/A'}`)
      .join('\n');
    const resultsText = completedEntries
      .map(
        (e) =>
          `${e.title}:\nResults: ${e.results || 'N/A'}\nConclusions: ${e.conclusions || 'N/A'}`
      )
      .join('\n');

    const prompt = `Generate publication-ready sections from lab notebook entries.

METHODS:
${methodsText}

RESULTS:
${resultsText}

Return ONLY JSON:
{
  "summary": "Brief overview",
  "keyFindings": ["Main finding 1"],
  "nextSteps": [],
  "sections": { "methods": "...", "results": "...", "discussion": "..." }
}`;

    const parsed = await this.chatJson(
      aiProvider,
      credentials,
      'You write publication-ready scientific sections as JSON only.',
      prompt,
      3000
    );

    return {
      summary: parsed.summary || 'Publication summary generated.',
      keyFindings: parsed.keyFindings || [],
      nextSteps: [],
      sections: parsed.sections || {},
      metrics: this.computeMetrics(entries),
      mode: 'ai',
    };
  }

  private static generateBasicSummary(
    entries: any[],
    request: SummaryRequest
  ): NotebookSummary {
    const metrics = this.computeMetrics(entries);
    const period =
      request.summaryType === 'daily'
        ? 'Today'
        : request.summaryType === 'weekly'
          ? 'This week'
          : 'This period';

    const keyFindings = entries
      .filter((e) => clip(e.results).length > 40 || clip(e.conclusions).length > 40)
      .slice(0, 6)
      .map((e) => `${e.title}: ${clip(e.results || e.conclusions, 140)}`);

    const nextSteps = entries
      .filter((e) => clip(e.next_steps).length > 15)
      .slice(0, 6)
      .map((e) => clip(e.next_steps, 160));

    const blockers = entries
      .filter((e) =>
        /fail|block|issue|problem|delay|contaminat|error/i.test(
          `${e.title} ${e.content} ${e.results} ${e.conclusions}`
        )
      )
      .slice(0, 4)
      .map((e) => e.title);

    const themes = [
      ...new Set(
        entries
          .map((e) => e.entry_type)
          .filter(Boolean)
          .map((t: string) => String(t).replace(/_/g, ' '))
      ),
    ].slice(0, 5);

    const momentum = this.normalizeMomentum(undefined, entries);

    return {
      summary: `${period}: ${metrics.totalEntries} notebook entries · ${metrics.experimentsCompleted} completed · ${metrics.experimentsInProgress} in progress · ${metrics.keyResults} with recorded results. AI key not configured - showing a structured digest from your notes. Add an AI provider key in Settings for a richer narrative.`,
      keyFindings:
        keyFindings.length > 0
          ? keyFindings
          : entries.slice(0, 5).map((e) => e.title || 'Untitled entry'),
      wins: entries
        .filter((e) => e.status === 'completed')
        .slice(0, 4)
        .map((e) => e.title),
      blockers,
      openQuestions: entries
        .filter((e) => /\?|unclear|unknown|investigat/i.test(`${e.content} ${e.next_steps}`))
        .slice(0, 4)
        .map((e) => e.title),
      themes,
      nextSteps:
        nextSteps.length > 0
          ? nextSteps
          : ['Review open entries and capture explicit next steps'],
      suggestedFocus:
        nextSteps[0] ||
        (metrics.experimentsInProgress > 0
          ? 'Close or advance the in-progress experiments first'
          : 'Log one high-detail experiment note tomorrow'),
      momentum,
      metrics,
      mode: 'basic',
    };
  }

  private static normalizeMomentum(
    value: unknown,
    entries: any[]
  ): ResearchMomentum {
    const allowed: ResearchMomentum[] = ['high', 'steady', 'blocked', 'sparse'];
    if (typeof value === 'string' && allowed.includes(value as ResearchMomentum)) {
      return value as ResearchMomentum;
    }
    if (entries.length <= 1) return 'sparse';
    const blocked = entries.some((e) =>
      /fail|block|stuck|contaminat/i.test(`${e.title} ${e.results} ${e.conclusions}`)
    );
    if (blocked) return 'blocked';
    const completed = entries.filter((e) => e.status === 'completed').length;
    if (completed >= Math.ceil(entries.length / 2)) return 'high';
    return 'steady';
  }

  private static groupEntriesByDay(entries: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    entries.forEach((entry) => {
      const date = new Date(entry.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(entry);
    });
    return grouped;
  }

  private static parseJSONResponse(text: string): any {
    try {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1]);
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) return JSON.parse(braceMatch[0]);
      return JSON.parse(text);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return {
        summary: String(text || '').substring(0, 500),
        keyFindings: [],
        nextSteps: [],
      };
    }
  }
}
