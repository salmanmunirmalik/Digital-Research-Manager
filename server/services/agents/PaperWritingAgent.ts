/**
 * Paper Writing Agent
 * Task 66: Write full research papers with proper structure
 * 
 * Generates complete research papers with all standard sections:
 * Title, Abstract, Introduction, Methods, Results, Discussion, Conclusion, References
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface PaperWritingInput {
  title?: string; // Paper title (optional, can be generated)
  researchQuestion?: string; // Main research question
  data?: any; // Experimental data (from DataReadingAgent)
  context?: {
    background?: string; // Background information
    methodology?: string; // Methodology description
    results?: string; // Results summary
    relatedWork?: string; // Related work/literature
  };
  sections?: {
    includeAbstract?: boolean;
    includeIntroduction?: boolean;
    includeMethods?: boolean;
    includeResults?: boolean;
    includeDiscussion?: boolean;
    includeConclusion?: boolean;
    includeReferences?: boolean;
  };
  style?: {
    journal?: string; // Target journal name
    format?: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Nature' | 'Science';
    wordLimit?: number; // Target word count
    tone?: 'formal' | 'academic' | 'technical';
  };
  existingSections?: {
    abstract?: string;
    introduction?: string;
    methods?: string;
    results?: string;
    discussion?: string;
  };
}

export interface PaperWritingResult {
  success: boolean;
  paper: {
    title: string;
    authors?: string[];
    abstract?: {
      text: string;
      wordCount: number;
    };
    introduction?: {
      text: string;
      wordCount: number;
      subsections?: string[];
    };
    methods?: {
      text: string;
      wordCount: number;
      subsections?: string[];
    };
    results?: {
      text: string;
      wordCount: number;
      subsections?: string[];
      figures?: Array<{
        number: number;
        caption: string;
        description: string;
      }>;
      tables?: Array<{
        number: number;
        caption: string;
        description: string;
      }>;
    };
    discussion?: {
      text: string;
      wordCount: number;
      subsections?: string[];
    };
    conclusion?: {
      text: string;
      wordCount: number;
    };
    references?: Array<{
      id: string;
      citation: string;
      inText?: string[]; // Sections where this reference is cited
    }>;
  };
  metadata: {
    totalWordCount: number;
    sectionCount: number;
    format: string;
    estimatedPages?: number;
  };
  recommendations?: string[];
}

export class PaperWritingAgent extends BaseAgent implements Agent {
  readonly agentType = 'paper_writing';
  readonly agentName = 'Paper Writing Agent';
  readonly description = 'Writes complete research papers with proper academic structure';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks', 'experiments', 'research_data'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    
    // Need at least research question or data
    if (!input.researchQuestion && !input.data && !input.context) {
      return false;
    }
    
    return true;
  }
  
  async execute(
    input: PaperWritingInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: research question, data, or context required',
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
      
      // Determine which sections to generate
      const sections = {
        includeAbstract: input.sections?.includeAbstract !== false,
        includeIntroduction: input.sections?.includeIntroduction !== false,
        includeMethods: input.sections?.includeMethods !== false,
        includeResults: input.sections?.includeResults !== false,
        includeDiscussion: input.sections?.includeDiscussion !== false,
        includeConclusion: input.sections?.includeConclusion !== false,
        includeReferences: input.sections?.includeReferences !== false
      };
      
      // Generate title if not provided
      const title = input.title || await this.generateTitle(input, aiProvider, apiAssignment);
      
      // Generate sections
      const paper: PaperWritingResult['paper'] = {
        title,
        authors: context.userContext?.user ? [
          `${context.userContext.user.first_name || ''} ${context.userContext.user.last_name || ''}`.trim()
        ] : undefined
      };
      
      let totalWordCount = 0;
      let sectionCount = 0;
      
      // Generate Abstract
      if (sections.includeAbstract && !input.existingSections?.abstract) {
        const abstract = await this.generateAbstract(input, context, aiProvider, apiAssignment);
        if (abstract) {
          paper.abstract = abstract;
          totalWordCount += abstract.wordCount;
          sectionCount++;
        }
      } else if (input.existingSections?.abstract) {
        paper.abstract = {
          text: input.existingSections.abstract,
          wordCount: input.existingSections.abstract.split(/\s+/).length
        };
        totalWordCount += paper.abstract.wordCount;
        sectionCount++;
      }
      
      // Generate Introduction
      if (sections.includeIntroduction && !input.existingSections?.introduction) {
        const introduction = await this.generateIntroduction(input, context, aiProvider, apiAssignment);
        if (introduction) {
          paper.introduction = introduction;
          totalWordCount += introduction.wordCount;
          sectionCount++;
        }
      } else if (input.existingSections?.introduction) {
        paper.introduction = {
          text: input.existingSections.introduction,
          wordCount: input.existingSections.introduction.split(/\s+/).length,
          subsections: []
        };
        totalWordCount += paper.introduction.wordCount;
        sectionCount++;
      }
      
      // Generate Methods
      if (sections.includeMethods && !input.existingSections?.methods) {
        const methods = await this.generateMethods(input, context, aiProvider, apiAssignment);
        if (methods) {
          paper.methods = methods;
          totalWordCount += methods.wordCount;
          sectionCount++;
        }
      } else if (input.existingSections?.methods) {
        paper.methods = {
          text: input.existingSections.methods,
          wordCount: input.existingSections.methods.split(/\s+/).length,
          subsections: []
        };
        totalWordCount += paper.methods.wordCount;
        sectionCount++;
      }
      
      // Generate Results
      if (sections.includeResults && !input.existingSections?.results) {
        const results = await this.generateResults(input, context, aiProvider, apiAssignment);
        if (results) {
          paper.results = results;
          totalWordCount += results.wordCount;
          sectionCount++;
        }
      } else if (input.existingSections?.results) {
        paper.results = {
          text: input.existingSections.results,
          wordCount: input.existingSections.results.split(/\s+/).length,
          subsections: [],
          figures: [],
          tables: []
        };
        totalWordCount += paper.results.wordCount;
        sectionCount++;
      }
      
      // Generate Discussion
      if (sections.includeDiscussion && !input.existingSections?.discussion) {
        const discussion = await this.generateDiscussion(input, context, aiProvider, apiAssignment);
        if (discussion) {
          paper.discussion = discussion;
          totalWordCount += discussion.wordCount;
          sectionCount++;
        }
      } else if (input.existingSections?.discussion) {
        paper.discussion = {
          text: input.existingSections.discussion,
          wordCount: input.existingSections.discussion.split(/\s+/).length,
          subsections: []
        };
        totalWordCount += paper.discussion.wordCount;
        sectionCount++;
      }
      
      // Generate Conclusion
      if (sections.includeConclusion) {
        const conclusion = await this.generateConclusion(input, context, aiProvider, apiAssignment);
        if (conclusion) {
          paper.conclusion = conclusion;
          totalWordCount += conclusion.wordCount;
          sectionCount++;
        }
      }
      
      // Generate References (placeholder - will be enhanced by ReferenceManagementAgent)
      if (sections.includeReferences) {
        paper.references = await this.generateReferences(input, context, aiProvider, apiAssignment);
      }
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(paper, input);
      
      const result: PaperWritingResult = {
        success: true,
        paper,
        metadata: {
          totalWordCount,
          sectionCount,
          format: input.style?.format || 'APA',
          estimatedPages: Math.ceil(totalWordCount / 250) // Rough estimate: 250 words per page
        },
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
      console.error('Error in PaperWritingAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to write paper',
        content: null
      };
    }
  }
  
  /**
   * Generate paper title
   */
  private async generateTitle(
    input: PaperWritingInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<string> {
    try {
      const prompt = `Generate a concise, informative research paper title based on the following information:

Research Question: ${input.researchQuestion || 'Not specified'}
${input.context?.background ? `Background: ${input.context.background}` : ''}

The title should be:
- Clear and descriptive
- 10-15 words maximum
- Follow academic conventions
- Capture the main contribution

Return only the title, no additional text.`;
      
      const response = await aiProvider.chat([
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.7,
        maxTokens: 100
      });
      
      return response.content.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    } catch (error) {
      console.error('Error generating title:', error);
      return input.researchQuestion || 'Research Paper';
    }
  }
  
  /**
   * Generate abstract
   */
  private async generateAbstract(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ text: string; wordCount: number } | null> {
    try {
      const wordLimit = input.style?.wordLimit ? Math.min(input.style.wordLimit, 300) : 250;
      
      const prompt = `Write a structured abstract for a research paper following academic standards.

Title: ${input.title || 'Research Paper'}
Research Question: ${input.researchQuestion || 'Not specified'}
${input.context?.methodology ? `Methodology: ${input.context.methodology}` : ''}
${input.context?.results ? `Results: ${input.context.results}` : ''}

The abstract should:
- Be ${wordLimit} words or less
- Follow structured format: Background, Methods, Results, Conclusions
- Be clear and concise
- Highlight key findings

Format: Structured abstract with clear sections.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert scientific writer. Write clear, concise abstracts following academic standards.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.5,
        maxTokens: 500
      });
      
      const text = response.content.trim();
      return {
        text,
        wordCount: text.split(/\s+/).length
      };
    } catch (error) {
      console.error('Error generating abstract:', error);
      return null;
    }
  }
  
  /**
   * Generate introduction
   */
  private async generateIntroduction(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ text: string; wordCount: number; subsections: string[] } | null> {
    try {
      const prompt = `Write an Introduction section for a research paper.

Title: ${input.title || 'Research Paper'}
Research Question: ${input.researchQuestion || 'Not specified'}
${input.context?.background ? `Background: ${input.context.background}` : ''}
${input.context?.relatedWork ? `Related Work: ${input.context.relatedWork}` : ''}

The introduction should:
- Provide background and context
- Review relevant literature
- Identify the research gap
- State the research question/hypothesis
- Outline the paper structure

Format: Well-structured paragraphs with logical flow.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert scientific writer. Write comprehensive, well-structured introductions.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.6,
        maxTokens: 1500
      });
      
      const text = response.content.trim();
      return {
        text,
        wordCount: text.split(/\s+/).length,
        subsections: ['Background', 'Literature Review', 'Research Gap', 'Objectives']
      };
    } catch (error) {
      console.error('Error generating introduction:', error);
      return null;
    }
  }
  
  /**
   * Generate methods section
   */
  private async generateMethods(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ text: string; wordCount: number; subsections: string[] } | null> {
    try {
      const prompt = `Write a Methods section for a research paper.

Title: ${input.title || 'Research Paper'}
Research Question: ${input.researchQuestion || 'Not specified'}
${input.context?.methodology ? `Methodology: ${input.context.methodology}` : ''}
${input.data ? `Data: ${JSON.stringify(input.data).substring(0, 500)}` : ''}

The methods section should:
- Describe the experimental design
- Detail procedures and protocols
- Specify materials and equipment
- Explain data collection methods
- Describe statistical analyses (if applicable)

Format: Clear, detailed, and reproducible.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert scientific writer. Write detailed, reproducible methods sections.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.4,
        maxTokens: 2000
      });
      
      const text = response.content.trim();
      return {
        text,
        wordCount: text.split(/\s+/).length,
        subsections: ['Study Design', 'Participants/Materials', 'Procedures', 'Data Analysis']
      };
    } catch (error) {
      console.error('Error generating methods:', error);
      return null;
    }
  }
  
  /**
   * Generate results section
   */
  private async generateResults(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ text: string; wordCount: number; subsections: string[]; figures: any[]; tables: any[] } | null> {
    try {
      const prompt = `Write a Results section for a research paper.

Title: ${input.title || 'Research Paper'}
Research Question: ${input.researchQuestion || 'Not specified'}
${input.context?.results ? `Results Summary: ${input.context.results}` : ''}
${input.data ? `Data: ${JSON.stringify(input.data).substring(0, 1000)}` : ''}

The results section should:
- Present findings objectively
- Include statistical results (if applicable)
- Reference figures and tables appropriately
- Be organized logically
- Highlight key findings

Format: Clear presentation of results with appropriate statistical reporting.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert scientific writer. Write clear, objective results sections.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 2000
      });
      
      const text = response.content.trim();
      return {
        text,
        wordCount: text.split(/\s+/).length,
        subsections: ['Descriptive Statistics', 'Main Findings', 'Statistical Analyses'],
        figures: [],
        tables: []
      };
    } catch (error) {
      console.error('Error generating results:', error);
      return null;
    }
  }
  
  /**
   * Generate discussion section
   */
  private async generateDiscussion(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ text: string; wordCount: number; subsections: string[] } | null> {
    try {
      const prompt = `Write a Discussion section for a research paper.

Title: ${input.title || 'Research Paper'}
Research Question: ${input.researchQuestion || 'Not specified'}
${input.context?.results ? `Results: ${input.context.results}` : ''}

The discussion should:
- Interpret the findings
- Compare with previous research
- Discuss implications
- Address limitations
- Suggest future directions

Format: Critical analysis and interpretation of results.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert scientific writer. Write insightful, critical discussions.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.6,
        maxTokens: 2000
      });
      
      const text = response.content.trim();
      return {
        text,
        wordCount: text.split(/\s+/).length,
        subsections: ['Interpretation', 'Comparison with Literature', 'Implications', 'Limitations', 'Future Directions']
      };
    } catch (error) {
      console.error('Error generating discussion:', error);
      return null;
    }
  }
  
  /**
   * Generate conclusion
   */
  private async generateConclusion(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<{ text: string; wordCount: number } | null> {
    try {
      const prompt = `Write a Conclusion section for a research paper.

Title: ${input.title || 'Research Paper'}
Research Question: ${input.researchQuestion || 'Not specified'}

The conclusion should:
- Summarize main findings
- Restate the contribution
- Highlight significance
- Be concise and impactful

Format: Clear, concise summary of the research contribution.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert scientific writer. Write clear, impactful conclusions.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.5,
        maxTokens: 500
      });
      
      const text = response.content.trim();
      return {
        text,
        wordCount: text.split(/\s+/).length
      };
    } catch (error) {
      console.error('Error generating conclusion:', error);
      return null;
    }
  }
  
  /**
   * Generate references (placeholder - will be enhanced by ReferenceManagementAgent)
   */
  private async generateReferences(
    input: PaperWritingInput,
    context: AgentContext,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<Array<{ id: string; citation: string; inText?: string[] }>> {
    // This is a placeholder - ReferenceManagementAgent will handle this properly
    return [];
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    paper: PaperWritingResult['paper'],
    input: PaperWritingInput
  ): string[] {
    const recommendations: string[] = [];
    
    if (!paper.abstract) {
      recommendations.push('Add an abstract to summarize the paper');
    }
    
    if (!paper.introduction) {
      recommendations.push('Add an introduction to provide context and background');
    }
    
    if (!paper.methods) {
      recommendations.push('Add a methods section to describe experimental procedures');
    }
    
    if (!paper.results) {
      recommendations.push('Add a results section to present findings');
    }
    
    if (!paper.discussion) {
      recommendations.push('Add a discussion section to interpret results');
    }
    
    if (paper.results && (!paper.results.figures || paper.results.figures.length === 0)) {
      recommendations.push('Consider adding figures to visualize results');
    }
    
    if (!paper.references || paper.references.length === 0) {
      recommendations.push('Add references to cite relevant literature');
    }
    
    if (input.style?.journal) {
      recommendations.push(`Format paper according to ${input.style.journal} guidelines`);
    }
    
    return recommendations;
  }
}

