/**
 * Base Agent Interface
 * Task 7: Create standardized interface for all AI agents
 * 
 * All specialized agents (PaperFindingAgent, AbstractWritingAgent, etc.)
 * implement this interface to ensure consistency and interoperability.
 */

import { AIProvider } from './AIProvider.js';
import { TaskAnalysis } from './TaskAnalysisEngine.js';
import { UserContext } from './UserContextRetriever.js';

export interface AgentConfig {
  provider?: string; // Specific provider to use (optional)
  model?: string; // Specific model to use (optional)
  temperature?: number;
  maxTokens?: number;
  [key: string]: any; // Allow agent-specific config
}

export interface AgentResult {
  success: boolean;
  content: any; // Agent-specific result format
  metadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    cost?: number;
    duration?: number;
    [key: string]: any;
  };
  error?: string;
}

export interface AgentContext {
  userContext?: UserContext;
  conversationHistory?: any[];
  additionalData?: Record<string, any>;
}

/**
 * Base Agent Interface
 * All specialized agents must implement this interface
 */
export interface Agent {
  /**
   * Agent identifier (e.g., 'paper_finding', 'abstract_writing')
   */
  readonly agentType: string;
  
  /**
   * Human-readable agent name
   */
  readonly agentName: string;
  
  /**
   * Agent description
   */
  readonly description: string;
  
  /**
   * Execute the agent's primary task
   * @param input Input data for the agent (varies by agent type)
   * @param context Additional context (user data, conversation history, etc.)
   * @param config Agent-specific configuration
   * @returns Agent result
   */
  execute(
    input: any,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult>;
  
  /**
   * Validate input before execution
   * @param input Input to validate
   * @returns True if input is valid
   */
  validateInput(input: any): boolean;
  
  /**
   * Get required context types for this agent
   * @returns Array of required context source types
   */
  getRequiredContext(): string[]; // e.g., ['papers', 'notebooks']
  
  /**
   * Get estimated cost for a task (optional)
   * @param input Input data
   * @param config Configuration
   * @returns Estimated cost in USD
   */
  estimateCost?(input: any, config?: AgentConfig): Promise<number>;
  
  /**
   * Get estimated duration for a task (optional)
   * @param input Input data
   * @param config Configuration
   * @returns Estimated duration in seconds
   */
  estimateDuration?(input: any, config?: AgentConfig): Promise<number>;
}

/**
 * Base Agent Implementation
 * Provides common functionality for all agents
 */
export abstract class BaseAgent implements Agent {
  abstract readonly agentType: string;
  abstract readonly agentName: string;
  abstract readonly description: string;
  
  protected aiProvider: AIProvider | null = null;
  
  /**
   * Initialize agent with AI provider
   */
  protected async initializeProvider(
    provider: string,
    apiKey: string
  ): Promise<void> {
    const { AIProviderFactory } = await import('./AIProviderFactory.js');
    this.aiProvider = AIProviderFactory.createProvider(provider, apiKey);
  }
  
  /**
   * Get AI provider for this agent
   */
  protected getProvider(): AIProvider {
    if (!this.aiProvider) {
      throw new Error('Agent provider not initialized. Call initializeProvider() first.');
    }
    return this.aiProvider;
  }
  
  /**
   * Execute the agent's primary task (must be implemented by subclasses)
   */
  abstract execute(
    input: any,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult>;
  
  /**
   * Validate input (must be implemented by subclasses)
   */
  abstract validateInput(input: any): boolean;
  
  /**
   * Get required context types (must be implemented by subclasses)
   */
  abstract getRequiredContext(): string[];
  
  /**
   * Build system prompt for the agent
   */
  protected buildSystemPrompt(taskAnalysis: TaskAnalysis, userContext?: UserContext): string {
    const taskDescriptions: Record<string, string> = {
      'paper_finding': 'You are a research assistant specialized in finding and analyzing academic papers. Provide comprehensive search results with summaries, relevance scores, and key findings.',
      'abstract_writing': 'You are a scientific writing assistant. Generate well-structured abstracts following academic standards (Background, Methods, Results, Conclusions).',
      'content_writing': 'You are a professional content writer. Create high-quality, well-structured content that is clear, concise, and engaging.',
      'idea_generation': 'You are a research ideation expert. Generate creative, feasible, and innovative research ideas with clear hypotheses and potential impact.',
      'proposal_writing': 'You are a grant writing specialist. Create comprehensive research proposals with clear objectives, methodology, expected outcomes, and budget justification.',
      'data_analysis': 'You are a data analysis expert. Analyze experimental data, identify patterns, provide statistical insights, and suggest interpretations.',
      'image_creation': 'You are an image generation assistant. Create visual content, scientific figures, and diagrams based on descriptions.',
      'paper_generation': 'You are a scientific paper writing assistant. Generate complete research papers with proper structure, citations, and academic rigor.',
      'presentation_generation': 'You are a presentation creator. Generate professional presentation content with clear slides and engaging narratives.',
      'code_generation': 'You are a code generation assistant. Write clean, well-documented, and efficient code.',
      'translation': 'You are a translation expert. Provide accurate, context-aware translations while preserving technical terminology.',
      'summarization': 'You are a summarization expert. Create concise, informative summaries that capture key points and main findings.'
    };
    
    const basePrompt = taskDescriptions[this.agentType] || 'You are a helpful research assistant.';
    const userName = userContext?.user?.first_name ? ` The user's name is ${userContext.user.first_name}.` : '';
    const institution = userContext?.user?.current_institution ? ` They work at ${userContext.user.current_institution}.` : '';
    
    return `${basePrompt}${userName}${institution} Provide accurate, helpful responses based on the user's research context.`;
  }
  
  /**
   * Build user prompt with context
   */
  protected buildUserPrompt(
    input: string,
    userContext?: UserContext,
    taskAnalysis?: TaskAnalysis
  ): string {
    let prompt = input;
    
    if (userContext && taskAnalysis?.requiresContext) {
      const contextParts: string[] = [];
      
      if (userContext.user?.research_interests && userContext.user.research_interests.length > 0) {
        contextParts.push(`Research Interests: ${userContext.user.research_interests.join(', ')}`);
      }
      
      if (userContext.relevantContent && userContext.relevantContent.length > 0) {
        contextParts.push('\n--- Relevant Research Context ---');
        userContext.relevantContent.slice(0, 3).forEach((item, idx) => {
          contextParts.push(`${idx + 1}. ${item.title}: ${item.content?.substring(0, 200)}...`);
        });
      }
      
      if (userContext.papers && userContext.papers.length > 0) {
        contextParts.push('\n--- Recent Papers ---');
        userContext.papers.slice(0, 3).forEach((paper, idx) => {
          contextParts.push(`${idx + 1}. ${paper.title} (${paper.journal || 'Unknown'}, ${paper.year || 'Unknown'})`);
        });
      }
      
      if (contextParts.length > 0) {
        prompt = `${input}\n\n--- Context ---\n${contextParts.join('\n')}`;
      }
    }
    
    return prompt;
  }
  
  /**
   * Handle errors consistently
   */
  protected handleError(error: any, operation: string): AgentResult {
    console.error(`[${this.agentName}] Error in ${operation}:`, error);
    return {
      success: false,
      content: null,
      error: error.message || `Failed to execute ${operation}`,
      metadata: {
        errorType: error.constructor?.name || 'UnknownError'
      }
    };
  }
}

