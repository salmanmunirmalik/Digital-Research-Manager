/**
 * Literature Review Agent
 * Task 8: Comprehensive literature review and synthesis
 * 
 * Conducts systematic literature reviews, synthesizes findings from multiple papers,
 * identifies research gaps, and creates comprehensive review documents.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';

export interface LiteratureReviewInput {
  topic: string;
  researchQuestion?: string;
  scope?: {
    timeRange?: { start?: number; end?: number };
    fields?: string[];
    keywords?: string[];
  };
  focus?: 'comprehensive' | 'systematic' | 'narrative' | 'meta_analysis';
  sections?: string[]; // Custom sections to include
  maxPapers?: number; // Maximum number of papers to review
}

export interface LiteratureReviewResult {
  review: {
    title: string;
    abstract: string;
    introduction: string;
    methodology?: string;
    findings: {
      theme: string;
      papers: Array<{
        title: string;
        authors: string[];
        year?: number;
        keyFindings: string[];
        relevance: number;
      }>;
      synthesis: string;
    }[];
    gaps: string[];
    conclusions: string;
    references: string[];
  };
  statistics: {
    totalPapersReviewed: number;
    papersByYear: Record<number, number>;
    topAuthors: string[];
    keyThemes: string[];
  };
  wordCount: number;
}

export class LiteratureReviewAgent extends BaseAgent implements Agent {
  readonly agentType = 'literature_review';
  readonly agentName = 'Literature Review Agent';
  readonly description = 'Conducts comprehensive literature reviews and synthesizes findings from multiple research papers';
  
  getRequiredContext(): string[] {
    return ['papers']; // Needs access to user's paper library
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.topic || typeof input.topic !== 'string' || input.topic.trim().length === 0) {
      return false;
    }
    return true;
  }
  
  async execute(
    input: LiteratureReviewInput,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      if (!this.validateInput(input)) {
        return {
          success: false,
          content: null,
          error: 'Invalid input: topic is required and must be a non-empty string'
        };
      }
      
      const userId = context?.additionalData?.userId;
      if (!userId) {
        return {
          success: false,
          content: null,
          error: 'User ID is required in context'
        };
      }
      
      // Initialize provider
      const provider = config?.provider || await this.getProviderForTask(userId);
      const apiKey = await getUserApiKey(userId, provider);
      
      if (!apiKey) {
        return {
          success: false,
          content: null,
          error: `No API key found for provider: ${provider}`
        };
      }
      
      await this.initializeProvider(provider, apiKey);
      
      // Build prompt
      const systemPrompt = this.buildSystemPrompt(
        { taskType: 'literature_review' } as TaskAnalysis,
        context?.userContext
      );
      
      const userPrompt = this.buildLiteratureReviewPrompt(input, context?.userContext);
      
      // Call AI provider (may need multiple calls for comprehensive reviews)
      const startTime = Date.now();
      const response = await this.getProvider().chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        apiKey: apiKey,
        temperature: 0.7,
        maxTokens: config?.maxTokens || 4000
      });
      
      const duration = Date.now() - startTime;
      
      // Parse review
      const reviewResult = this.parseLiteratureReview(response.content, input);
      
      return {
        success: true,
        content: reviewResult,
        metadata: {
          provider,
          tokensUsed: response.usage?.totalTokens,
          duration,
          wordCount: reviewResult.wordCount
        }
      };
    } catch (error: any) {
      return this.handleError(error, 'literature review');
    }
  }
  
  /**
   * Build prompt for literature review
   */
  private buildLiteratureReviewPrompt(
    input: LiteratureReviewInput,
    userContext?: UserContext
  ): string {
    let prompt = `Conduct a ${input.focus || 'comprehensive'} literature review on: "${input.topic}"\n\n`;
    
    if (input.researchQuestion) {
      prompt += `Research Question: ${input.researchQuestion}\n\n`;
    }
    
    if (input.scope) {
      prompt += `Scope:\n`;
      if (input.scope.timeRange) {
        if (input.scope.timeRange.start) {
          prompt += `- Time range: ${input.scope.timeRange.start}`;
        }
        if (input.scope.timeRange.end) {
          prompt += ` - ${input.scope.timeRange.end}`;
        }
        prompt += `\n`;
      }
      if (input.scope.fields) {
        prompt += `- Fields: ${input.scope.fields.join(', ')}\n`;
      }
      if (input.scope.keywords) {
        prompt += `- Keywords: ${input.scope.keywords.join(', ')}\n`;
      }
      prompt += `\n`;
    }
    
    if (input.maxPapers) {
      prompt += `Review up to ${input.maxPapers} relevant papers.\n\n`;
    }
    
    prompt += `Create a comprehensive literature review with the following structure:\n\n`;
    prompt += `1. **Title**: Clear, descriptive title for the review\n\n`;
    prompt += `2. **Abstract**: Brief summary (200-300 words)\n\n`;
    prompt += `3. **Introduction**:\n`;
    prompt += `   - Context and background\n`;
    prompt += `   - Research question(s)\n`;
    prompt += `   - Objectives of the review\n`;
    prompt += `   - Scope and methodology\n\n`;
    
    if (input.focus === 'systematic' || input.focus === 'meta_analysis') {
      prompt += `4. **Methodology**:\n`;
      prompt += `   - Search strategy\n`;
      prompt += `   - Inclusion/exclusion criteria\n`;
      prompt += `   - Quality assessment approach\n\n`;
    }
    
    prompt += `5. **Findings** (Organized by themes):\n`;
    prompt += `   For each theme:\n`;
    prompt += `   - Theme name\n`;
    prompt += `   - Relevant papers (title, authors, year, key findings)\n`;
    prompt += `   - Synthesis of findings across papers\n`;
    prompt += `   - Patterns, trends, and contradictions\n\n`;
    
    prompt += `6. **Research Gaps**:\n`;
    prompt += `   - Identified gaps in current research\n`;
    prompt += `   - Areas requiring further investigation\n`;
    prompt += `   - Unanswered questions\n\n`;
    
    prompt += `7. **Conclusions**:\n`;
    prompt += `   - Summary of main findings\n`;
    prompt += `   - Implications for research and practice\n`;
    prompt += `   - Future research directions\n\n`;
    
    prompt += `8. **References**:\n`;
    prompt += `   - Complete list of all papers cited\n`;
    prompt += `   - Proper citation format\n\n`;
    
    if (userContext?.papers && userContext.papers.length > 0) {
      prompt += `--- User's Relevant Papers ---\n`;
      userContext.papers.slice(0, 10).forEach((paper, idx) => {
        prompt += `${idx + 1}. ${paper.title} (${paper.journal || 'Unknown'}, ${paper.year || 'Unknown'})\n`;
      });
      prompt += `\nConsider these papers in your review.\n\n`;
    }
    
    prompt += `Ensure the review:\n`;
    prompt += `- Is comprehensive and well-structured\n`;
    prompt += `- Synthesizes findings across multiple papers\n`;
    prompt += `- Identifies patterns and contradictions\n`;
    prompt += `- Highlights research gaps clearly\n`;
    prompt += `- Uses appropriate academic language\n`;
    prompt += `- Provides actionable insights\n`;
    
    return prompt;
  }
  
  /**
   * Parse literature review from response
   */
  private parseLiteratureReview(response: string, input: LiteratureReviewInput): LiteratureReviewResult {
    const wordCount = response.split(/\s+/).length;
    
    // Extract sections
    const titleMatch = response.match(/(?:^|#\s+)(title|literature review)[:\s]+(.+?)(?:\n|$)/i) || 
                      response.match(/^(.+?)(?:\n|$)/);
    const abstractMatch = response.match(/(?:abstract|summary)[:\s]+(.+?)(?=\n(?:introduction|methodology|findings)|$)/is);
    const introductionMatch = response.match(/(?:introduction|background)[:\s]+(.+?)(?=\n(?:methodology|findings|gaps)|$)/is);
    const methodologyMatch = response.match(/(?:methodology|methods?)[:\s]+(.+?)(?=\n(?:findings|gaps|conclusions?)|$)/is);
    const gapsMatch = response.match(/(?:research gaps?|gaps?)[:\s]+(.+?)(?=\n(?:conclusions?|references?)|$)/is);
    const conclusionsMatch = response.match(/(?:conclusions?|conclusion)[:\s]+(.+?)(?=\n(?:references?|$)|$)/is);
    const referencesMatch = response.match(/(?:references?|bibliography)[:\s]+(.+?)$/is);
    
    // Extract findings by theme
    const findings: any[] = [];
    const findingsSection = response.match(/(?:findings|results?)[:\s]+(.+?)(?=\n(?:gaps?|conclusions?)|$)/is);
    
    if (findingsSection) {
      // Try to extract themes
      const themeMatches = findingsSection[1].match(/(?:theme|topic|section)[:\s]+(.+?)(?=\n(?:theme|topic|section|gaps?)|$)/gis);
      
      if (themeMatches) {
        themeMatches.forEach(themeText => {
          const themeNameMatch = themeText.match(/^(.+?)(?:\n|$)/);
          const papersMatch = themeText.match(/(?:papers?|studies?)[:\s]+(.+?)(?=\n(?:synthesis|summary)|$)/is);
          const synthesisMatch = themeText.match(/(?:synthesis|summary)[:\s]+(.+?)(?=\n|$)/is);
          
          if (themeNameMatch) {
            findings.push({
              theme: themeNameMatch[1].trim(),
              papers: this.parsePapersFromText(papersMatch ? papersMatch[1] : ''),
              synthesis: synthesisMatch ? synthesisMatch[1].trim() : ''
            });
          }
        });
      }
    }
    
    // Parse references
    const references: string[] = [];
    if (referencesMatch) {
      const refText = referencesMatch[1];
      const refList = refText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (refList) {
        references.push(...refList.map(ref => ref.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Extract gaps
    const gaps: string[] = [];
    if (gapsMatch) {
      const gapsText = gapsMatch[1];
      const gapsList = gapsText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (gapsList) {
        gaps.push(...gapsList.map(gap => gap.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Calculate statistics
    const statistics = this.calculateStatistics(findings, references);
    
    return {
      review: {
        title: titleMatch ? titleMatch[titleMatch.length - 1].trim() : `Literature Review: ${input.topic}`,
        abstract: abstractMatch ? abstractMatch[1].trim() : '',
        introduction: introductionMatch ? introductionMatch[1].trim() : '',
        methodology: methodologyMatch ? methodologyMatch[1].trim() : undefined,
        findings: findings.length > 0 ? findings : [],
        gaps: gaps.length > 0 ? gaps : [],
        conclusions: conclusionsMatch ? conclusionsMatch[1].trim() : '',
        references: references.length > 0 ? references : []
      },
      statistics,
      wordCount
    };
  }
  
  /**
   * Parse papers from text
   */
  private parsePapersFromText(text: string): any[] {
    const papers: any[] = [];
    const paperMatches = text.match(/(?:^|\n)(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
    
    if (paperMatches) {
      paperMatches.forEach(match => {
        const titleMatch = match.match(/(.+?)(?:\s*\(|$)/);
        const authorsMatch = match.match(/\(([^)]+)\)/);
        const yearMatch = match.match(/(\d{4})/);
        
        if (titleMatch) {
          papers.push({
            title: titleMatch[1].trim(),
            authors: authorsMatch ? authorsMatch[1].split(',').map(a => a.trim()) : [],
            year: yearMatch ? parseInt(yearMatch[1]) : undefined,
            keyFindings: [],
            relevance: 0.5
          });
        }
      });
    }
    
    return papers;
  }
  
  /**
   * Calculate review statistics
   */
  private calculateStatistics(findings: any[], references: string[]): any {
    const papersByYear: Record<number, number> = {};
    const authors: string[] = [];
    
    findings.forEach(finding => {
      finding.papers.forEach((paper: any) => {
        if (paper.year) {
          papersByYear[paper.year] = (papersByYear[paper.year] || 0) + 1;
        }
        if (paper.authors) {
          authors.push(...paper.authors);
        }
      });
    });
    
    // Count author occurrences
    const authorCounts: Record<string, number> = {};
    authors.forEach(author => {
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });
    
    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([author]) => author);
    
    const keyThemes = findings.map(f => f.theme);
    
    return {
      totalPapersReviewed: references.length || findings.reduce((sum, f) => sum + f.papers.length, 0),
      papersByYear,
      topAuthors,
      keyThemes
    };
  }
  
  /**
   * Get provider for literature review task
   */
  private async getProviderForTask(userId: string): Promise<string> {
    const assignment = await getApiForTask(userId, 'literature_review');
    return assignment?.provider || 'anthropic_claude'; // Claude is good for comprehensive analysis
  }
}

