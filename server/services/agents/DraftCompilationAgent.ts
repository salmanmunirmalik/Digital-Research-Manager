/**
 * Draft Compilation Agent
 * Task 69: Compile sections into publication-ready draft
 * 
 * Compiles individual paper sections into a complete, formatted,
 * publication-ready research paper draft.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface DraftCompilationInput {
  sections: {
    title?: string;
    abstract?: string;
    introduction?: string;
    methods?: string;
    results?: string;
    discussion?: string;
    conclusion?: string;
    references?: string;
    acknowledgments?: string;
  };
  metadata?: {
    authors?: string[];
    affiliations?: string[];
    keywords?: string[];
    correspondingAuthor?: string;
  };
  style?: {
    format?: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Nature' | 'Science';
    journal?: string; // Target journal
    wordLimit?: number;
    lineSpacing?: 'single' | 'double' | '1.5';
    fontSize?: number;
  };
  figures?: Array<{
    number: number;
    caption: string;
    placement?: string; // Section where figure should be placed
  }>;
  tables?: Array<{
    number: number;
    caption: string;
    placement?: string;
  }>;
}

export interface DraftCompilationResult {
  success: boolean;
  draft: {
    formatted: string; // Complete formatted paper
    sections: {
      title?: string;
      authors?: string;
      abstract?: string;
      introduction?: string;
      methods?: string;
      results?: string;
      discussion?: string;
      conclusion?: string;
      references?: string;
      acknowledgments?: string;
    };
    wordCount: number;
    pageCount: number;
  };
  metadata: {
    format: string;
    totalSections: number;
    hasAllRequiredSections: boolean;
    missingSections: string[];
  };
  recommendations?: string[];
}

export class DraftCompilationAgent extends BaseAgent implements Agent {
  readonly agentType = 'draft_compilation';
  readonly agentName = 'Draft Compilation Agent';
  readonly description = 'Compiles paper sections into a complete, publication-ready draft';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.sections || typeof input.sections !== 'object') return false;
    
    // Need at least one section
    const hasSection = Object.values(input.sections).some(section => 
      section && typeof section === 'string' && section.trim().length > 0
    );
    
    return hasSection;
  }
  
  async execute(
    input: DraftCompilationInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: at least one section is required',
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
      const format = input.style?.format || 'APA';
      
      // Compile sections into formatted draft
      const compiledDraft = await this.compileDraft(input, format, aiProvider, apiAssignment);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(input, compiledDraft);
      
      // Check for missing required sections
      const requiredSections = ['title', 'abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'];
      const missingSections = requiredSections.filter(section => 
        !input.sections[section as keyof typeof input.sections] || 
        input.sections[section as keyof typeof input.sections]!.trim().length === 0
      );
      
      const result: DraftCompilationResult = {
        success: true,
        draft: compiledDraft,
        metadata: {
          format,
          totalSections: Object.keys(input.sections).filter(key => 
            input.sections[key as keyof typeof input.sections]
          ).length,
          hasAllRequiredSections: missingSections.length === 0,
          missingSections
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
      console.error('Error in DraftCompilationAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to compile draft',
        content: null
      };
    }
  }
  
  /**
   * Compile sections into formatted draft
   */
  private async compileDraft(
    input: DraftCompilationInput,
    format: string,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<DraftCompilationResult['draft']> {
    try {
      // Build formatted paper
      const sections: DraftCompilationResult['draft']['sections'] = {};
      let formattedText = '';
      
      // Title
      if (input.sections.title) {
        sections.title = input.sections.title;
        formattedText += `${input.sections.title}\n\n`;
      }
      
      // Authors
      if (input.metadata?.authors && input.metadata.authors.length > 0) {
        const authors = input.metadata.authors.join(', ');
        sections.authors = authors;
        formattedText += `${authors}\n\n`;
        
        if (input.metadata.affiliations && input.metadata.affiliations.length > 0) {
          formattedText += `${input.metadata.affiliations.join('\n')}\n\n`;
        }
      }
      
      // Abstract
      if (input.sections.abstract) {
        sections.abstract = input.sections.abstract;
        formattedText += `ABSTRACT\n\n${input.sections.abstract}\n\n`;
      }
      
      // Keywords
      if (input.metadata?.keywords && input.metadata.keywords.length > 0) {
        formattedText += `Keywords: ${input.metadata.keywords.join(', ')}\n\n`;
      }
      
      // Introduction
      if (input.sections.introduction) {
        sections.introduction = input.sections.introduction;
        formattedText += `1. INTRODUCTION\n\n${input.sections.introduction}\n\n`;
      }
      
      // Methods
      if (input.sections.methods) {
        sections.methods = input.sections.methods;
        formattedText += `2. METHODS\n\n${input.sections.methods}\n\n`;
      }
      
      // Results
      if (input.sections.results) {
        sections.results = input.sections.results;
        formattedText += `3. RESULTS\n\n${input.sections.results}\n\n`;
        
        // Insert figures and tables if specified
        if (input.figures && input.figures.length > 0) {
          formattedText += '\n';
          input.figures.forEach(fig => {
            formattedText += `Figure ${fig.number}. ${fig.caption}\n\n`;
          });
        }
        
        if (input.tables && input.tables.length > 0) {
          formattedText += '\n';
          input.tables.forEach(tbl => {
            formattedText += `Table ${tbl.number}. ${tbl.caption}\n\n`;
          });
        }
      }
      
      // Discussion
      if (input.sections.discussion) {
        sections.discussion = input.sections.discussion;
        formattedText += `4. DISCUSSION\n\n${input.sections.discussion}\n\n`;
      }
      
      // Conclusion
      if (input.sections.conclusion) {
        sections.conclusion = input.sections.conclusion;
        formattedText += `5. CONCLUSION\n\n${input.sections.conclusion}\n\n`;
      }
      
      // Acknowledgments
      if (input.sections.acknowledgments) {
        sections.acknowledgments = input.sections.acknowledgments;
        formattedText += `ACKNOWLEDGMENTS\n\n${input.sections.acknowledgments}\n\n`;
      }
      
      // References
      if (input.sections.references) {
        sections.references = input.sections.references;
        formattedText += `REFERENCES\n\n${input.sections.references}\n\n`;
      }
      
      // Use AI to refine formatting if needed
      if (input.style?.journal || format !== 'APA') {
        const refined = await this.refineFormatting(
          formattedText,
          format,
          input.style?.journal,
          aiProvider,
          apiAssignment
        );
        formattedText = refined;
      }
      
      // Calculate word and page count
      const wordCount = formattedText.split(/\s+/).length;
      const pageCount = Math.ceil(wordCount / 250); // Rough estimate: 250 words per page
      
      return {
        formatted: formattedText,
        sections,
        wordCount,
        pageCount
      };
    } catch (error) {
      console.error('Error compiling draft:', error);
      throw error;
    }
  }
  
  /**
   * Refine formatting according to journal/style guide
   */
  private async refineFormatting(
    content: string,
    format: string,
    journal: string | undefined,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<string> {
    try {
      const prompt = `Format the following research paper according to ${format} style${journal ? ` and ${journal} journal guidelines` : ''}.

Content:
${content.substring(0, 5000)}

Please ensure:
- Proper section headings and numbering
- Consistent formatting throughout
- Appropriate spacing and layout
- Journal-specific requirements (if applicable)

Return the fully formatted paper.`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: `You are an expert in ${format} formatting and journal style guides. Format papers professionally.` },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.2,
        maxTokens: 6000
      });
      
      return response.content.trim();
    } catch (error) {
      console.error('Error refining formatting:', error);
      return content; // Return original if refinement fails
    }
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    input: DraftCompilationInput,
    draft: DraftCompilationResult['draft']
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for missing sections
    if (!input.sections.abstract) {
      recommendations.push('Add an abstract to summarize the paper');
    }
    
    if (!input.sections.introduction) {
      recommendations.push('Add an introduction to provide context');
    }
    
    if (!input.sections.methods) {
      recommendations.push('Add a methods section to describe procedures');
    }
    
    if (!input.sections.results) {
      recommendations.push('Add a results section to present findings');
    }
    
    if (!input.sections.discussion) {
      recommendations.push('Add a discussion section to interpret results');
    }
    
    if (!input.sections.conclusion) {
      recommendations.push('Add a conclusion to summarize key points');
    }
    
    if (!input.sections.references) {
      recommendations.push('Add references to cite relevant literature');
    }
    
    // Check word count
    if (input.style?.wordLimit && draft.wordCount > input.style.wordLimit) {
      recommendations.push(`Paper exceeds word limit (${draft.wordCount} > ${input.style.wordLimit}). Consider condensing.`);
    }
    
    // Check for figures/tables
    if (draft.sections.results && (!input.figures || input.figures.length === 0)) {
      recommendations.push('Consider adding figures to visualize results');
    }
    
    // Check metadata
    if (!input.metadata?.authors || input.metadata.authors.length === 0) {
      recommendations.push('Add author information');
    }
    
    if (!input.metadata?.keywords || input.metadata.keywords.length === 0) {
      recommendations.push('Add keywords for discoverability');
    }
    
    return recommendations;
  }
}

