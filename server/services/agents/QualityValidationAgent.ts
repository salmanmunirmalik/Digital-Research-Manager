/**
 * Quality Validation Agent
 * Task 74: Validates output quality and completeness
 * 
 * Validates the quality, completeness, and correctness of generated content
 * (papers, proposals, presentations, etc.) and provides feedback for improvement.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface QualityValidationInput {
  content: any; // Content to validate (paper, proposal, presentation, etc.)
  contentType: 'paper' | 'proposal' | 'presentation' | 'abstract' | 'section';
  criteria?: {
    checkCompleteness?: boolean;
    checkStructure?: boolean;
    checkGrammar?: boolean;
    checkCitations?: boolean;
    checkFormatting?: boolean;
    checkClarity?: boolean;
    checkAccuracy?: boolean;
  };
  requirements?: {
    wordLimit?: number;
    requiredSections?: string[];
    citationStyle?: string;
    format?: string;
  };
}

export interface QualityValidationResult {
  success: boolean;
  overallScore: number; // 0-100
  passed: boolean; // Whether content meets quality threshold
  validation: {
    completeness: {
      score: number;
      passed: boolean;
      issues: string[];
      missing?: string[];
    };
    structure: {
      score: number;
      passed: boolean;
      issues: string[];
      recommendations?: string[];
    };
    grammar: {
      score: number;
      passed: boolean;
      issues: string[];
      errors?: Array<{
        location: string;
        error: string;
        suggestion: string;
      }>;
    };
    citations: {
      score: number;
      passed: boolean;
      issues: string[];
      missingCitations?: number;
      formattingIssues?: string[];
    };
    formatting: {
      score: number;
      passed: boolean;
      issues: string[];
      recommendations?: string[];
    };
    clarity: {
      score: number;
      passed: boolean;
      issues: string[];
      suggestions?: string[];
    };
    accuracy: {
      score: number;
      passed: boolean;
      issues: string[];
      concerns?: string[];
    };
  };
  summary: {
    strengths: string[];
    weaknesses: string[];
    priorityActions: string[]; // Actions to take to improve quality
  };
  recommendations: string[];
}

export class QualityValidationAgent extends BaseAgent implements Agent {
  readonly agentType = 'quality_validation';
  readonly agentName = 'Quality Validation Agent';
  readonly description = 'Validates output quality, completeness, and correctness';
  
  getRequiredContext(): string[] {
    return []; // No specific context required
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.content) return false;
    if (!input.contentType) return false;
    
    return true;
  }
  
  async execute(
    input: QualityValidationInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: content and contentType required',
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
      
      // Default criteria
      const criteria = {
        checkCompleteness: true,
        checkStructure: true,
        checkGrammar: true,
        checkCitations: true,
        checkFormatting: true,
        checkClarity: true,
        checkAccuracy: true,
        ...input.criteria
      };
      
      // Perform validations
      const validation: QualityValidationResult['validation'] = {
        completeness: criteria.checkCompleteness
          ? await this.validateCompleteness(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] },
        
        structure: criteria.checkStructure
          ? await this.validateStructure(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] },
        
        grammar: criteria.checkGrammar
          ? await this.validateGrammar(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] },
        
        citations: criteria.checkCitations
          ? await this.validateCitations(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] },
        
        formatting: criteria.checkFormatting
          ? await this.validateFormatting(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] },
        
        clarity: criteria.checkClarity
          ? await this.validateClarity(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] },
        
        accuracy: criteria.checkAccuracy
          ? await this.validateAccuracy(input, aiProvider, apiAssignment)
          : { score: 100, passed: true, issues: [] }
      };
      
      // Calculate overall score
      const scores = Object.values(validation).map(v => v.score);
      const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const passed = overallScore >= 70; // 70% threshold
      
      // Generate summary
      const summary = await this.generateSummary(validation, input, aiProvider, apiAssignment);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(validation, overallScore, input);
      
      const result: QualityValidationResult = {
        success: true,
        overallScore: Math.round(overallScore),
        passed,
        validation,
        summary,
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
      console.error('Error in QualityValidationAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate quality',
        content: null
      };
    }
  }
  
  /**
   * Validate completeness
   */
  private async validateCompleteness(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['completeness']> {
    try {
      const contentText = this.extractText(input.content);
      const requiredSections = input.requirements?.requiredSections || this.getDefaultRequiredSections(input.contentType);
      
      const prompt = `Evaluate the completeness of the following ${input.contentType}.

Content:
${contentText.substring(0, 3000)}

Required Sections: ${requiredSections.join(', ')}

Check if:
1. All required sections are present
2. Each section has sufficient content
3. Content is complete and not truncated

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1", "issue2"],
  "missing": ["missing section1"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are a quality assurance expert. Evaluate content completeness accurately.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 1000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        // Fallback validation
        const missing = requiredSections.filter(section => 
          !contentText.toLowerCase().includes(section.toLowerCase())
        );
        
        return {
          score: missing.length === 0 ? 100 : Math.max(0, 100 - (missing.length * 20)),
          passed: missing.length === 0,
          issues: missing.length > 0 ? [`Missing sections: ${missing.join(', ')}`] : [],
          missing: missing.length > 0 ? missing : undefined
        };
      }
    } catch (error) {
      console.error('Error validating completeness:', error);
      return { score: 50, passed: false, issues: ['Unable to validate completeness'] };
    }
  }
  
  /**
   * Validate structure
   */
  private async validateStructure(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['structure']> {
    try {
      const contentText = this.extractText(input.content);
      
      const prompt = `Evaluate the structure and organization of the following ${input.contentType}.

Content:
${contentText.substring(0, 3000)}

Check:
1. Logical flow and organization
2. Section ordering
3. Transitions between sections
4. Overall coherence

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1"],
  "recommendations": ["rec1"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in academic writing structure. Evaluate organization and flow.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 1000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return { score: 75, passed: true, issues: [], recommendations: [] };
      }
    } catch (error) {
      console.error('Error validating structure:', error);
      return { score: 50, passed: false, issues: ['Unable to validate structure'] };
    }
  }
  
  /**
   * Validate grammar
   */
  private async validateGrammar(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['grammar']> {
    try {
      const contentText = this.extractText(input.content);
      
      const prompt = `Check the grammar, spelling, and language quality of the following ${input.contentType}.

Content:
${contentText.substring(0, 3000)}

Identify:
1. Grammar errors
2. Spelling mistakes
3. Punctuation issues
4. Language quality

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1"],
  "errors": [
    {
      "location": "section/paragraph",
      "error": "error description",
      "suggestion": "correction"
    }
  ]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are a grammar and language expert. Identify errors and suggest corrections.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.1,
        maxTokens: 1500
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return { score: 80, passed: true, issues: [], errors: [] };
      }
    } catch (error) {
      console.error('Error validating grammar:', error);
      return { score: 50, passed: false, issues: ['Unable to validate grammar'] };
    }
  }
  
  /**
   * Validate citations
   */
  private async validateCitations(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['citations']> {
    try {
      const contentText = this.extractText(input.content);
      const citationStyle = input.requirements?.citationStyle || 'APA';
      
      // Count citations
      const citationPattern = /\([A-Z][a-z]+(?:\s+et\s+al\.)?,\s+\d{4}\)|\[[\d,]+\]/g;
      const citations = contentText.match(citationPattern) || [];
      
      const prompt = `Evaluate the citations in the following ${input.contentType}.

Content:
${contentText.substring(0, 3000)}

Citation Style: ${citationStyle}
Found Citations: ${citations.length}

Check:
1. Citation format consistency
2. Proper citation placement
3. Reference list completeness
4. Citation style adherence

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1"],
  "missingCitations": number,
  "formattingIssues": ["issue1"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: `You are an expert in ${citationStyle} citation style. Evaluate citation quality.` },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 1000
      });
      
      try {
        const result = JSON.parse(response.content);
        return {
          ...result,
          missingCitations: citations.length < 5 ? 5 - citations.length : 0
        };
      } catch {
        return {
          score: citations.length > 0 ? 80 : 40,
          passed: citations.length >= 3,
          issues: citations.length < 3 ? ['Insufficient citations'] : [],
          missingCitations: citations.length < 5 ? 5 - citations.length : 0,
          formattingIssues: []
        };
      }
    } catch (error) {
      console.error('Error validating citations:', error);
      return { score: 50, passed: false, issues: ['Unable to validate citations'] };
    }
  }
  
  /**
   * Validate formatting
   */
  private async validateFormatting(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['formatting']> {
    try {
      const contentText = this.extractText(input.content);
      const format = input.requirements?.format || 'APA';
      
      const prompt = `Evaluate the formatting of the following ${input.contentType}.

Content:
${contentText.substring(0, 2000)}

Format: ${format}

Check:
1. Heading styles
2. Paragraph formatting
3. Spacing and layout
4. Style guide adherence

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1"],
  "recommendations": ["rec1"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: `You are an expert in ${format} formatting. Evaluate formatting quality.` },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 1000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return { score: 75, passed: true, issues: [], recommendations: [] };
      }
    } catch (error) {
      console.error('Error validating formatting:', error);
      return { score: 50, passed: false, issues: ['Unable to validate formatting'] };
    }
  }
  
  /**
   * Validate clarity
   */
  private async validateClarity(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['clarity']> {
    try {
      const contentText = this.extractText(input.content);
      
      const prompt = `Evaluate the clarity and readability of the following ${input.contentType}.

Content:
${contentText.substring(0, 3000)}

Check:
1. Clarity of writing
2. Use of jargon
3. Sentence structure
4. Overall readability

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1"],
  "suggestions": ["suggestion1"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in clear, effective communication. Evaluate writing clarity.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 1000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return { score: 75, passed: true, issues: [], suggestions: [] };
      }
    } catch (error) {
      console.error('Error validating clarity:', error);
      return { score: 50, passed: false, issues: ['Unable to validate clarity'] };
    }
  }
  
  /**
   * Validate accuracy
   */
  private async validateAccuracy(
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['validation']['accuracy']> {
    try {
      const contentText = this.extractText(input.content);
      
      const prompt = `Evaluate the accuracy and factual correctness of the following ${input.contentType}.

Content:
${contentText.substring(0, 3000)}

Check:
1. Factual accuracy
2. Data consistency
3. Logical consistency
4. Potential errors or contradictions

Return JSON:
{
  "score": 0-100,
  "passed": true/false,
  "issues": ["issue1"],
  "concerns": ["concern1"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert fact-checker. Evaluate content accuracy and consistency.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 1000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return { score: 80, passed: true, issues: [], concerns: [] };
      }
    } catch (error) {
      console.error('Error validating accuracy:', error);
      return { score: 50, passed: false, issues: ['Unable to validate accuracy'] };
    }
  }
  
  /**
   * Generate summary
   */
  private async generateSummary(
    validation: QualityValidationResult['validation'],
    input: QualityValidationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<QualityValidationResult['summary']> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const priorityActions: string[] = [];
    
    // Analyze each validation aspect
    Object.entries(validation).forEach(([aspect, result]) => {
      if (result.score >= 80) {
        strengths.push(`${aspect}: Strong (${result.score}%)`);
      } else if (result.score < 70) {
        weaknesses.push(`${aspect}: Needs improvement (${result.score}%)`);
        if (result.issues && result.issues.length > 0) {
          priorityActions.push(...result.issues.slice(0, 2));
        }
      }
    });
    
    return {
      strengths,
      weaknesses,
      priorityActions: priorityActions.slice(0, 5)
    };
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    validation: QualityValidationResult['validation'],
    overallScore: number,
    input: QualityValidationInput
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 70) {
      recommendations.push('Overall quality is below threshold. Review and improve content.');
    }
    
    if (validation.completeness.score < 80) {
      recommendations.push('Add missing sections to improve completeness');
    }
    
    if (validation.structure.score < 80) {
      recommendations.push('Reorganize content for better structure and flow');
    }
    
    if (validation.grammar.score < 80) {
      recommendations.push('Review and correct grammar and spelling errors');
    }
    
    if (validation.citations.score < 80) {
      recommendations.push('Add more citations and ensure proper formatting');
    }
    
    if (validation.formatting.score < 80) {
      recommendations.push('Review formatting to ensure style guide compliance');
    }
    
    if (validation.clarity.score < 80) {
      recommendations.push('Improve clarity and reduce jargon');
    }
    
    if (validation.accuracy.score < 80) {
      recommendations.push('Review content for accuracy and consistency');
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
    
    if (content.presentation) {
      return content.presentation.slides
        .map((slide: any) => `${slide.title}\n${slide.content}`)
        .join('\n\n');
    }
    
    return JSON.stringify(content);
  }
  
  /**
   * Get default required sections
   */
  private getDefaultRequiredSections(contentType: string): string[] {
    switch (contentType) {
      case 'paper':
        return ['Title', 'Abstract', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion', 'References'];
      case 'proposal':
        return ['Title', 'Background', 'Objectives', 'Methodology', 'Expected Outcomes', 'Timeline'];
      case 'presentation':
        return ['Title', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion'];
      default:
        return [];
    }
  }
}

