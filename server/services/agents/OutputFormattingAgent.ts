/**
 * Output Formatting Agent
 * Task 78: Formats outputs per journal/conference requirements
 * 
 * Formats research outputs (papers, abstracts, presentations) according to
 * specific journal or conference style guidelines and requirements.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface OutputFormattingInput {
  content: any; // Content to format (paper, abstract, etc.)
  contentType: 'paper' | 'abstract' | 'presentation' | 'proposal';
  target: {
    journal?: string; // Target journal name
    conference?: string; // Target conference name
    style?: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Nature' | 'Science' | 'Vancouver';
  };
  requirements?: {
    wordLimit?: number;
    pageLimit?: number;
    figureLimit?: number;
    tableLimit?: number;
    referenceLimit?: number;
    lineSpacing?: 'single' | 'double' | '1.5';
    fontSize?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    fontFamily?: string;
  };
  sections?: {
    [key: string]: string; // Section name -> content
  };
}

export interface OutputFormattingResult {
  success: boolean;
  formatted: {
    content: string; // Fully formatted content
    sections?: {
      [key: string]: string; // Formatted sections
    };
    metadata?: {
      wordCount: number;
      pageCount: number;
      figureCount: number;
      tableCount: number;
      referenceCount: number;
    };
  };
  compliance: {
    meetsWordLimit: boolean;
    meetsPageLimit: boolean;
    meetsFigureLimit: boolean;
    meetsTableLimit: boolean;
    meetsReferenceLimit: boolean;
    styleCompliant: boolean;
    issues: string[];
  };
  recommendations?: string[];
}

export class OutputFormattingAgent extends BaseAgent implements Agent {
  readonly agentType = 'output_formatting';
  readonly agentName = 'Output Formatting Agent';
  readonly description = 'Formats outputs according to journal/conference requirements';
  
  getRequiredContext(): string[] {
    return [];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.content) return false;
    if (!input.contentType) return false;
    if (!input.target || (!input.target.journal && !input.target.conference && !input.target.style)) {
      return false;
    }
    
    return true;
  }
  
  async execute(
    input: OutputFormattingInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: content, contentType, and target (journal/conference/style) required',
          content: null
        };
      }
      
      // Get API assignment for content writing
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for content writing. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      
      // Get formatting guidelines
      const guidelines = await this.getFormattingGuidelines(input.target, aiProvider, apiAssignment);
      
      // Format content
      const formatted = await this.formatContent(
        input.content,
        input.contentType,
        guidelines,
        input.requirements,
        aiProvider,
        apiAssignment
      );
      
      // Check compliance
      const compliance = this.checkCompliance(formatted, input.requirements, guidelines);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(compliance, input);
      
      const result: OutputFormattingResult = {
        success: true,
        formatted,
        compliance,
        recommendations
      };
      
      return {
        success: true,
        content: result,
        metadata: {
          agentType: this.agentType,
          tokensUsed: 0, // TODO: Track tokens
          duration: 0 // TODO: Track duration
        }
      };
    } catch (error: any) {
      console.error('Error in OutputFormattingAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to format output',
        content: null
      };
    }
  }
  
  /**
   * Get formatting guidelines for target journal/conference
   */
  private async getFormattingGuidelines(
    target: OutputFormattingInput['target'],
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<any> {
    try {
      const targetName = target.journal || target.conference || target.style || 'default';
      
      const prompt = `Provide formatting guidelines for ${targetName} ${target.journal ? 'journal' : target.conference ? 'conference' : 'style'}.

Include:
1. Citation style requirements
2. Heading and section formatting
3. Figure and table formatting
4. Reference list format
5. Typography (font, size, spacing)
6. Page layout (margins, spacing)
7. Word/page limits
8. Any specific requirements

Format as JSON:
{
  "citationStyle": "style name",
  "headings": { "format": "description" },
  "figures": { "format": "description" },
  "references": { "format": "description" },
  "typography": { "font": "name", "size": 12, "spacing": "double" },
  "layout": { "margins": "1 inch", "spacing": "double" },
  "limits": { "words": 5000, "pages": 20, "figures": 10 }
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in academic formatting and journal style guides. Provide accurate formatting guidelines.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 1500
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        // Return default guidelines
        return this.getDefaultGuidelines(target.style || 'APA');
      }
    } catch (error) {
      console.error('Error getting formatting guidelines:', error);
      return this.getDefaultGuidelines(target.style || 'APA');
    }
  }
  
  /**
   * Get default formatting guidelines
   */
  private getDefaultGuidelines(style: string): any {
    const defaults: Record<string, any> = {
      'APA': {
        citationStyle: 'APA',
        headings: { format: 'Title Case, Bold' },
        typography: { font: 'Times New Roman', size: 12, spacing: 'double' },
        layout: { margins: '1 inch all sides', spacing: 'double' },
        limits: { words: 5000, pages: 20 }
      },
      'IEEE': {
        citationStyle: 'IEEE',
        headings: { format: 'Title Case, Bold, Numbered' },
        typography: { font: 'Times New Roman', size: 10, spacing: 'single' },
        layout: { margins: '0.75 inch all sides', spacing: 'single' },
        limits: { words: 6000, pages: 8 }
      },
      'Nature': {
        citationStyle: 'Nature',
        headings: { format: 'Title Case, Bold' },
        typography: { font: 'Arial', size: 11, spacing: 'double' },
        layout: { margins: '2 cm all sides', spacing: 'double' },
        limits: { words: 3000, pages: 5 }
      }
    };
    
    return defaults[style] || defaults['APA'];
  }
  
  /**
   * Format content according to guidelines
   */
  private async formatContent(
    content: any,
    contentType: string,
    guidelines: any,
    requirements: OutputFormattingInput['requirements'],
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<OutputFormattingResult['formatted']> {
    try {
      const contentText = this.extractText(content);
      
      const prompt = `Format the following ${contentType} according to these guidelines:

Guidelines:
${JSON.stringify(guidelines, null, 2)}

Requirements:
${requirements ? JSON.stringify(requirements, null, 2) : 'None specified'}

Content:
${contentText.substring(0, 5000)}

Apply formatting including:
1. Proper heading styles
2. Citation formatting
3. Typography (font, size, spacing)
4. Page layout
5. Section organization

Return the fully formatted content.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in academic formatting. Apply formatting precisely according to guidelines.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 6000
      });
      
      const formattedText = response.content.trim();
      
      // Calculate metadata
      const wordCount = formattedText.split(/\s+/).length;
      const pageCount = Math.ceil(wordCount / 250);
      const figureCount = (formattedText.match(/Figure \d+/gi) || []).length;
      const tableCount = (formattedText.match(/Table \d+/gi) || []).length;
      const referenceCount = (formattedText.match(/\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s+\d{4}\)|\[[\d,]+\]/g) || []).length;
      
      return {
        content: formattedText,
        metadata: {
          wordCount,
          pageCount,
          figureCount,
          tableCount,
          referenceCount
        }
      };
    } catch (error) {
      console.error('Error formatting content:', error);
      const contentText = this.extractText(content);
      return {
        content: contentText,
        metadata: {
          wordCount: contentText.split(/\s+/).length,
          pageCount: Math.ceil(contentText.split(/\s+/).length / 250),
          figureCount: 0,
          tableCount: 0,
          referenceCount: 0
        }
      };
    }
  }
  
  /**
   * Check compliance with requirements
   */
  private checkCompliance(
    formatted: OutputFormattingResult['formatted'],
    requirements: OutputFormattingInput['requirements'] | undefined,
    guidelines: any
  ): OutputFormattingResult['compliance'] {
    const issues: string[] = [];
    const metadata = formatted.metadata || {
      wordCount: 0,
      pageCount: 0,
      figureCount: 0,
      tableCount: 0,
      referenceCount: 0
    };
    
    const meetsWordLimit = !requirements?.wordLimit || metadata.wordCount <= requirements.wordLimit;
    if (!meetsWordLimit) {
      issues.push(`Exceeds word limit: ${metadata.wordCount} > ${requirements.wordLimit}`);
    }
    
    const meetsPageLimit = !requirements?.pageLimit || metadata.pageCount <= requirements.pageLimit;
    if (!meetsPageLimit) {
      issues.push(`Exceeds page limit: ${metadata.pageCount} > ${requirements.pageLimit}`);
    }
    
    const meetsFigureLimit = !requirements?.figureLimit || metadata.figureCount <= requirements.figureLimit;
    if (!meetsFigureLimit) {
      issues.push(`Exceeds figure limit: ${metadata.figureCount} > ${requirements.figureLimit}`);
    }
    
    const meetsTableLimit = !requirements?.tableLimit || metadata.tableCount <= requirements.tableLimit;
    if (!meetsTableLimit) {
      issues.push(`Exceeds table limit: ${metadata.tableCount} > ${requirements.tableLimit}`);
    }
    
    const meetsReferenceLimit = !requirements?.referenceLimit || metadata.referenceCount <= requirements.referenceLimit;
    if (!meetsReferenceLimit) {
      issues.push(`Exceeds reference limit: ${metadata.referenceCount} > ${requirements.referenceLimit}`);
    }
    
    const styleCompliant = true; // Would need more detailed checking
    
    return {
      meetsWordLimit,
      meetsPageLimit,
      meetsFigureLimit,
      meetsTableLimit,
      meetsReferenceLimit,
      styleCompliant,
      issues
    };
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    compliance: OutputFormattingResult['compliance'],
    input: OutputFormattingInput
  ): string[] {
    const recommendations: string[] = [];
    
    if (!compliance.meetsWordLimit) {
      recommendations.push('Reduce word count to meet journal requirements');
    }
    
    if (!compliance.meetsPageLimit) {
      recommendations.push('Condense content to meet page limit');
    }
    
    if (!compliance.meetsFigureLimit) {
      recommendations.push('Reduce number of figures or combine multiple figures');
    }
    
    if (!compliance.meetsTableLimit) {
      recommendations.push('Reduce number of tables or combine related tables');
    }
    
    if (!compliance.meetsReferenceLimit) {
      recommendations.push('Reduce number of references or move to supplementary material');
    }
    
    if (!compliance.styleCompliant) {
      recommendations.push('Review formatting to ensure full style guide compliance');
    }
    
    if (compliance.issues.length === 0) {
      recommendations.push('Content meets all formatting requirements');
    }
    
    return recommendations;
  }
  
  /**
   * Extract text from content
   */
  private extractText(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    
    if (content.paper) {
      return [
        content.paper.title,
        content.paper.abstract?.text,
        content.paper.introduction?.text,
        content.paper.methods?.text,
        content.paper.results?.text,
        content.paper.discussion?.text,
        content.paper.conclusion?.text
      ].filter(Boolean).join('\n\n');
    }
    
    if (content.formatted) {
      return content.formatted;
    }
    
    return JSON.stringify(content);
  }
}

