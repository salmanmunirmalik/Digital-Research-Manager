/**
 * Abstract Writing Agent
 * Task 60: Generate abstracts from research data, papers, or experiments
 * 
 * Creates well-structured abstracts following academic standards
 * (Background, Methods, Results, Conclusions format).
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';

export interface AbstractWritingInput {
  title?: string;
  content: string; // Research data, experiment description, or paper content
  type?: 'research' | 'experiment' | 'review' | 'case_study';
  wordLimit?: number; // Target word count (typically 150-300)
  style?: 'structured' | 'narrative'; // Structured (Background/Methods/Results/Conclusions) or narrative
}

export interface AbstractResult {
  abstract: string;
  wordCount: number;
  sections?: {
    background?: string;
    methods?: string;
    results?: string;
    conclusions?: string;
  };
  keywords?: string[];
}

export class AbstractWritingAgent extends BaseAgent implements Agent {
  readonly agentType = 'abstract_writing';
  readonly agentName = 'Abstract Writing Agent';
  readonly description = 'Generates well-structured abstracts from research data, experiments, or papers';
  
  getRequiredContext(): string[] {
    return ['notebooks', 'experiments']; // Needs experimental data
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.content || typeof input.content !== 'string' || input.content.trim().length < 50) {
      return false;
    }
    return true;
  }
  
  async execute(
    input: AbstractWritingInput,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      if (!this.validateInput(input)) {
        return {
          success: false,
          content: null,
          error: 'Invalid input: content is required and must be at least 50 characters'
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
        { taskType: this.agentType } as TaskAnalysis,
        context?.userContext
      );
      
      const userPrompt = this.buildAbstractPrompt(input, context?.userContext);
      
      // Call AI provider
      const startTime = Date.now();
      const response = await this.getProvider().chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        apiKey: apiKey,
        temperature: 0.7,
        maxTokens: config?.maxTokens || 1000
      });
      
      const duration = Date.now() - startTime;
      
      // Parse and structure abstract
      const abstractResult = this.parseAbstract(response.content, input);
      
      return {
        success: true,
        content: abstractResult,
        metadata: {
          provider,
          tokensUsed: response.usage?.totalTokens,
          duration,
          wordCount: abstractResult.wordCount
        }
      };
    } catch (error: any) {
      return this.handleError(error, 'abstract writing');
    }
  }
  
  /**
   * Build prompt for abstract writing
   */
  private buildAbstractPrompt(
    input: AbstractWritingInput,
    userContext?: UserContext
  ): string {
    let prompt = `Write a professional academic abstract based on the following research content:\n\n`;
    prompt += `--- Research Content ---\n${input.content}\n\n`;
    
    if (input.title) {
      prompt += `Title: ${input.title}\n\n`;
    }
    
    prompt += `Requirements:\n`;
    prompt += `- Type: ${input.type || 'research'}\n`;
    prompt += `- Style: ${input.style || 'structured'}\n`;
    
    if (input.wordLimit) {
      prompt += `- Word limit: ${input.wordLimit} words (strictly adhere to this limit)\n`;
    } else {
      prompt += `- Word limit: 200-300 words (typical for academic abstracts)\n`;
    }
    
    if (input.style === 'structured' || !input.style) {
      prompt += `- Format: Structured with clear sections:\n`;
      prompt += `  * Background: Context and objectives\n`;
      prompt += `  * Methods: Approach and methodology\n`;
      prompt += `  * Results: Key findings\n`;
      prompt += `  * Conclusions: Implications and significance\n`;
    } else {
      prompt += `- Format: Narrative style (flowing paragraph)\n`;
    }
    
    prompt += `\nEnsure the abstract:\n`;
    prompt += `- Is clear and concise\n`;
    prompt += `- Uses appropriate scientific terminology\n`;
    prompt += `- Highlights the most important findings\n`;
    prompt += `- Is suitable for academic publication\n`;
    
    if (userContext?.user?.research_interests) {
      prompt += `\nUser's research focus: ${userContext.user.research_interests.join(', ')}\n`;
      prompt += `Ensure the abstract aligns with this research focus.\n`;
    }
    
    return prompt;
  }
  
  /**
   * Parse abstract response
   */
  private parseAbstract(response: string, input: AbstractWritingInput): AbstractResult {
    const wordCount = response.split(/\s+/).length;
    
    // Try to extract structured sections
    const sections: any = {};
    
    if (input.style === 'structured' || !input.style) {
      const backgroundMatch = response.match(/(?:background|introduction|context)[:\s]+(.+?)(?=\n(?:methods?|results?|conclusions?)|$)/is);
      const methodsMatch = response.match(/(?:methods?|methodology)[:\s]+(.+?)(?=\n(?:results?|conclusions?|background)|$)/is);
      const resultsMatch = response.match(/(?:results?|findings)[:\s]+(.+?)(?=\n(?:conclusions?|background|methods?)|$)/is);
      const conclusionsMatch = response.match(/(?:conclusions?|conclusion|implications?)[:\s]+(.+?)(?=\n(?:background|methods?|results?)|$)/is);
      
      if (backgroundMatch) sections.background = backgroundMatch[1].trim();
      if (methodsMatch) sections.methods = methodsMatch[1].trim();
      if (resultsMatch) sections.results = resultsMatch[1].trim();
      if (conclusionsMatch) sections.conclusions = conclusionsMatch[1].trim();
    }
    
    // Extract keywords (if mentioned)
    const keywordsMatch = response.match(/(?:keywords?|key terms)[:\s]+(.+?)(?:\n|$)/i);
    const keywords = keywordsMatch 
      ? keywordsMatch[1].split(/[,;]/).map(k => k.trim()).filter(k => k.length > 0)
      : undefined;
    
    return {
      abstract: response.trim(),
      wordCount,
      sections: Object.keys(sections).length > 0 ? sections : undefined,
      keywords
    };
  }
  
  /**
   * Get provider for abstract writing task
   */
  private async getProviderForTask(userId: string): Promise<string> {
    const assignment = await getApiForTask(userId, 'abstract_writing');
    return assignment?.provider || 'openai'; // OpenAI is best for writing
  }
}

