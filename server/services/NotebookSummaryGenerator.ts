/**
 * NotebookSummaryGenerator - Automated Lab Notebook Summary Generation
 * 
 * Generates intelligent summaries from lab notebook entries:
 * - Daily summaries
 * - Weekly reports
 * - Project progress reports
 * - Publication-ready sections
 */

import pool from '../../database/config.js';
import { AIProviderFactory } from './AIProviderFactory.js';
import { getApiForTask } from '../routes/apiTaskAssignments.js';

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

export interface NotebookSummary {
  summary: string;
  keyFindings: string[];
  nextSteps: string[];
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
}

export class NotebookSummaryGenerator {
  /**
   * Generate summary based on request type
   */
  static async generateSummary(request: SummaryRequest): Promise<NotebookSummary> {
    try {
      // Get notebook entries based on request
      const entries = await this.getRelevantEntries(request);

      if (entries.length === 0) {
        return {
          summary: 'No entries found for the specified period.',
          keyFindings: [],
          nextSteps: []
        };
      }

      // Get AI API assignment
      const apiAssignment = await getApiForTask(request.userId, 'content_writing');
      
      if (!apiAssignment) {
        // Fallback: Generate basic summary without AI
        return this.generateBasicSummary(entries, request);
      }

      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);

      // Generate summary based on type
      switch (request.summaryType) {
        case 'daily':
          return await this.generateDailySummary(entries, aiProvider, apiAssignment);
        case 'weekly':
          return await this.generateWeeklySummary(entries, aiProvider, apiAssignment);
        case 'project':
          return await this.generateProjectSummary(entries, request.projectId!, aiProvider, apiAssignment);
        case 'publication':
          return await this.generatePublicationSummary(entries, aiProvider, apiAssignment);
        default:
          return this.generateBasicSummary(entries, request);
      }
    } catch (error: any) {
      console.error('Error generating notebook summary:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Get relevant notebook entries based on request
   */
  private static async getRelevantEntries(request: SummaryRequest): Promise<any[]> {
    try {
      let query = `
        SELECT 
          id, title, content, entry_type, status, objectives, methodology,
          results, conclusions, next_steps, tags, created_at, updated_at
        FROM lab_notebook_entries
        WHERE author_id = $1
      `;
      const params: any[] = [request.userId];
      let paramIndex = 2;

      if (request.projectId) {
        query += ` AND project_id = $${paramIndex}`;
        params.push(request.projectId);
        paramIndex++;
      }

      if (request.entryIds && request.entryIds.length > 0) {
        query += ` AND id = ANY($${paramIndex})`;
        params.push(request.entryIds);
        paramIndex++;
      }

      if (request.dateRange) {
        query += ` AND created_at >= $${paramIndex} AND created_at <= $${paramIndex + 1}`;
        params.push(request.dateRange.start, request.dateRange.end);
        paramIndex += 2;
      } else if (request.summaryType === 'daily') {
        // Today's entries
        query += ` AND DATE(created_at) = CURRENT_DATE`;
      } else if (request.summaryType === 'weekly') {
        // Last 7 days
        query += ` AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting relevant entries:', error);
      return [];
    }
  }

  /**
   * Generate daily summary
   */
  private static async generateDailySummary(
    entries: any[],
    aiProvider: any,
    apiAssignment: any
  ): Promise<NotebookSummary> {
    const entriesText = entries.map(e => `
Title: ${e.title}
Type: ${e.entry_type}
Status: ${e.status}
Objectives: ${e.objectives || 'N/A'}
Results: ${e.results || 'N/A'}
Conclusions: ${e.conclusions || 'N/A'}
Next Steps: ${e.next_steps || 'N/A'}
`).join('\n---\n');

    const prompt = `You are a research assistant. Generate a concise daily summary of today's lab notebook entries.

ENTRIES:
${entriesText}

Generate:
1. A brief summary (2-3 sentences) of the day's work
2. Key findings (bullet points)
3. Next steps (bullet points)

Format as JSON:
{
  "summary": "...",
  "keyFindings": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

    const messages = [
      { role: 'system' as const, content: 'You are a research assistant that generates concise, actionable summaries.' },
      { role: 'user' as const, content: prompt }
    ];

    const response = await aiProvider.chat(messages, {
      apiKey: apiAssignment.apiKey,
      temperature: 0.5,
      maxTokens: 1000
    });

    const responseText = typeof response === 'string' ? response : (response as any).content || JSON.stringify(response);
    const parsed = this.parseJSONResponse(responseText);

    return {
      summary: parsed.summary || 'Daily summary generated.',
      keyFindings: parsed.keyFindings || [],
      nextSteps: parsed.nextSteps || [],
      metrics: {
        totalEntries: entries.length,
        experimentsCompleted: entries.filter(e => e.status === 'completed').length,
        experimentsInProgress: entries.filter(e => e.status === 'in_progress').length,
        keyResults: entries.filter(e => e.results && e.results.length > 50).length
      }
    };
  }

  /**
   * Generate weekly summary
   */
  private static async generateWeeklySummary(
    entries: any[],
    aiProvider: any,
    apiAssignment: any
  ): Promise<NotebookSummary> {
    const entriesByDay = this.groupEntriesByDay(entries);
    const entriesText = Object.entries(entriesByDay).map(([day, dayEntries]: [string, any]) => `
${day}:
${dayEntries.map((e: any) => `- ${e.title} (${e.entry_type}, ${e.status})`).join('\n')}
`).join('\n');

    const prompt = `You are a research assistant. Generate a comprehensive weekly summary of lab notebook entries.

WEEK'S ENTRIES:
${entriesText}

Generate:
1. A comprehensive summary (1-2 paragraphs) of the week's research activities
2. Key findings and achievements (bullet points)
3. Next steps and priorities for the coming week

Format as JSON:
{
  "summary": "...",
  "keyFindings": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

    const messages = [
      { role: 'system' as const, content: 'You are a research assistant that generates comprehensive weekly research summaries.' },
      { role: 'user' as const, content: prompt }
    ];

    const response = await aiProvider.chat(messages, {
      apiKey: apiAssignment.apiKey,
      temperature: 0.6,
      maxTokens: 2000
    });

    const responseText = typeof response === 'string' ? response : (response as any).content || JSON.stringify(response);
    const parsed = this.parseJSONResponse(responseText);

    return {
      summary: parsed.summary || 'Weekly summary generated.',
      keyFindings: parsed.keyFindings || [],
      nextSteps: parsed.nextSteps || [],
      metrics: {
        totalEntries: entries.length,
        experimentsCompleted: entries.filter(e => e.status === 'completed').length,
        experimentsInProgress: entries.filter(e => e.status === 'in_progress').length,
        keyResults: entries.filter(e => e.results && e.results.length > 50).length
      }
    };
  }

  /**
   * Generate project summary
   */
  private static async generateProjectSummary(
    entries: any[],
    projectId: string,
    aiProvider: any,
    apiAssignment: any
  ): Promise<NotebookSummary> {
    // Get project details
    const projectResult = await pool.query(
      `SELECT title, description FROM projects WHERE id = $1`,
      [projectId]
    );
    const project = projectResult.rows[0] || { title: 'Project', description: '' };

    const entriesText = entries.map(e => `
Title: ${e.title}
Type: ${e.entry_type}
Status: ${e.status}
Objectives: ${e.objectives || 'N/A'}
Methodology: ${e.methodology || 'N/A'}
Results: ${e.results || 'N/A'}
Conclusions: ${e.conclusions || 'N/A'}
`).join('\n---\n');

    const prompt = `You are a research assistant. Generate a comprehensive project progress summary.

PROJECT: ${project.title}
${project.description ? `Description: ${project.description}` : ''}

PROJECT ENTRIES:
${entriesText}

Generate:
1. A comprehensive summary of project progress (2-3 paragraphs)
2. Key findings and results (bullet points)
3. Next steps and recommendations (bullet points)

Format as JSON:
{
  "summary": "...",
  "keyFindings": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

    const messages = [
      { role: 'system' as const, content: 'You are a research assistant that generates project progress summaries.' },
      { role: 'user' as const, content: prompt }
    ];

    const response = await aiProvider.chat(messages, {
      apiKey: apiAssignment.apiKey,
      temperature: 0.6,
      maxTokens: 2000
    });

    const responseText = typeof response === 'string' ? response : (response as any).content || JSON.stringify(response);
    const parsed = this.parseJSONResponse(responseText);

    return {
      summary: parsed.summary || 'Project summary generated.',
      keyFindings: parsed.keyFindings || [],
      nextSteps: parsed.nextSteps || [],
      metrics: {
        totalEntries: entries.length,
        experimentsCompleted: entries.filter(e => e.status === 'completed').length,
        experimentsInProgress: entries.filter(e => e.status === 'in_progress').length,
        keyResults: entries.filter(e => e.results && e.results.length > 50).length
      }
    };
  }

  /**
   * Generate publication-ready summary
   */
  private static async generatePublicationSummary(
    entries: any[],
    aiProvider: any,
    apiAssignment: any
  ): Promise<NotebookSummary> {
    const completedEntries = entries.filter(e => e.status === 'completed' && e.results);
    
    const methodsText = completedEntries.map(e => `
${e.title}:
Methodology: ${e.methodology || 'N/A'}
`).join('\n');

    const resultsText = completedEntries.map(e => `
${e.title}:
Results: ${e.results || 'N/A'}
Conclusions: ${e.conclusions || 'N/A'}
`).join('\n');

    const prompt = `You are a research assistant. Generate publication-ready sections from lab notebook entries.

METHODS:
${methodsText}

RESULTS:
${resultsText}

Generate publication-ready sections:
1. Methods section (concise, scientific writing style)
2. Results section (clear, data-focused)
3. Discussion section (interpretation and implications)

Format as JSON:
{
  "summary": "Brief overview",
  "keyFindings": ["Main finding 1", "Main finding 2"],
  "sections": {
    "methods": "...",
    "results": "...",
    "discussion": "..."
  }
}`;

    const messages = [
      { role: 'system' as const, content: 'You are a research assistant that generates publication-ready scientific writing.' },
      { role: 'user' as const, content: prompt }
    ];

    const response = await aiProvider.chat(messages, {
      apiKey: apiAssignment.apiKey,
      temperature: 0.7,
      maxTokens: 3000
    });

    const responseText = typeof response === 'string' ? response : (response as any).content || JSON.stringify(response);
    const parsed = this.parseJSONResponse(responseText);

    return {
      summary: parsed.summary || 'Publication summary generated.',
      keyFindings: parsed.keyFindings || [],
      nextSteps: [],
      sections: parsed.sections || {}
    };
  }

  /**
   * Generate basic summary without AI (fallback)
   */
  private static generateBasicSummary(entries: any[], request: SummaryRequest): NotebookSummary {
    const completed = entries.filter(e => e.status === 'completed').length;
    const inProgress = entries.filter(e => e.status === 'in_progress').length;

    const summary = `${request.summaryType === 'daily' ? 'Today' : request.summaryType === 'weekly' ? 'This week' : 'Project'} summary: ${entries.length} entries, ${completed} completed, ${inProgress} in progress.`;

    const keyFindings = entries
      .filter(e => e.results && e.results.length > 50)
      .slice(0, 5)
      .map(e => e.title);

    const nextSteps = entries
      .filter(e => e.next_steps && e.next_steps.length > 20)
      .slice(0, 5)
      .map(e => e.next_steps);

    return {
      summary,
      keyFindings,
      nextSteps,
      metrics: {
        totalEntries: entries.length,
        experimentsCompleted: completed,
        experimentsInProgress: inProgress,
        keyResults: keyFindings.length
      }
    };
  }

  /**
   * Group entries by day
   */
  private static groupEntriesByDay(entries: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });

    return grouped;
  }

  /**
   * Parse JSON response from AI
   */
  private static parseJSONResponse(text: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to find JSON object in text
      const braceMatch = text.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        return JSON.parse(braceMatch[0]);
      }

      // Fallback: return parsed text
      return JSON.parse(text);
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return {
        summary: text.substring(0, 500),
        keyFindings: [],
        nextSteps: []
      };
    }
  }
}


