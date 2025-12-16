/**
 * Idea Generation Agent
 * Task 61: Generate research ideas, hypotheses, and research directions
 * 
 * Creates creative, feasible, and innovative research ideas based on
 * user's research context, interests, and current work.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';

export interface IdeaGenerationInput {
  topic?: string; // Specific topic or field
  field?: string; // Research field
  constraints?: {
    timeframe?: string; // e.g., "6 months", "1 year"
    resources?: string[]; // Available resources
    expertise?: string[]; // User's expertise areas
  };
  numberOfIdeas?: number; // How many ideas to generate (default: 5)
  focus?: 'novel' | 'feasible' | 'high_impact' | 'interdisciplinary';
}

export interface ResearchIdea {
  title: string;
  description: string;
  hypothesis?: string;
  methodology?: string;
  expectedOutcomes?: string;
  feasibility: 'high' | 'medium' | 'low';
  novelty: 'high' | 'medium' | 'low';
  potentialImpact: 'high' | 'medium' | 'low';
  estimatedDuration?: string;
  requiredResources?: string[];
  relatedWork?: string[];
}

export class IdeaGenerationAgent extends BaseAgent implements Agent {
  readonly agentType = 'idea_generation';
  readonly agentName = 'Idea Generation Agent';
  readonly description = 'Generates creative, feasible, and innovative research ideas and hypotheses';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks']; // Needs research context
  }
  
  validateInput(input: any): boolean {
    // Input is optional - can generate ideas without specific input
    if (!input) return true;
    if (typeof input !== 'object') return false;
    return true;
  }
  
  async execute(
    input: IdeaGenerationInput = {},
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
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
      
      const userPrompt = this.buildIdeaGenerationPrompt(input, context?.userContext);
      
      // Call AI provider
      const startTime = Date.now();
      const response = await this.getProvider().chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        apiKey: apiKey,
        temperature: 0.8, // Higher temperature for creativity
        maxTokens: config?.maxTokens || 2000
      });
      
      const duration = Date.now() - startTime;
      
      // Parse ideas
      const ideas = this.parseIdeas(response.content, input.numberOfIdeas || 5);
      
      return {
        success: true,
        content: {
          ideas,
          totalGenerated: ideas.length,
          focus: input.focus || 'feasible'
        },
        metadata: {
          provider,
          tokensUsed: response.usage?.totalTokens,
          duration
        }
      };
    } catch (error: any) {
      return this.handleError(error, 'idea generation');
    }
  }
  
  /**
   * Build prompt for idea generation
   */
  private buildIdeaGenerationPrompt(
    input: IdeaGenerationInput,
    userContext?: UserContext
  ): string {
    let prompt = `Generate ${input.numberOfIdeas || 5} creative and feasible research ideas`;
    
    if (input.topic) {
      prompt += ` related to: "${input.topic}"`;
    } else if (input.field) {
      prompt += ` in the field of: "${input.field}"`;
    } else if (userContext?.user?.research_interests && userContext.user.research_interests.length > 0) {
      prompt += ` aligned with research interests: ${userContext.user.research_interests.join(', ')}`;
    } else {
      prompt += ` for innovative research`;
    }
    
    prompt += `.\n\n`;
    
    if (input.focus) {
      prompt += `Focus: ${input.focus}\n`;
      if (input.focus === 'novel') {
        prompt += `- Prioritize novel, unexplored research directions\n`;
      } else if (input.focus === 'feasible') {
        prompt += `- Prioritize ideas that are practical and achievable\n`;
      } else if (input.focus === 'high_impact') {
        prompt += `- Prioritize ideas with high potential impact\n`;
      } else if (input.focus === 'interdisciplinary') {
        prompt += `- Prioritize ideas that bridge multiple disciplines\n`;
      }
    }
    
    if (input.constraints) {
      prompt += `\nConstraints:\n`;
      if (input.constraints.timeframe) {
        prompt += `- Timeframe: ${input.constraints.timeframe}\n`;
      }
      if (input.constraints.resources) {
        prompt += `- Available resources: ${input.constraints.resources.join(', ')}\n`;
      }
      if (input.constraints.expertise) {
        prompt += `- Expertise areas: ${input.constraints.expertise.join(', ')}\n`;
      }
    }
    
    if (userContext?.papers && userContext.papers.length > 0) {
      prompt += `\n--- User's Recent Work ---\n`;
      userContext.papers.slice(0, 3).forEach((paper, idx) => {
        prompt += `${idx + 1}. ${paper.title}\n`;
      });
      prompt += `\nConsider building upon or extending this work.\n`;
    }
    
    prompt += `\nFor each idea, provide:\n`;
    prompt += `1. Title: Clear, descriptive title\n`;
    prompt += `2. Description: Brief overview (2-3 sentences)\n`;
    prompt += `3. Hypothesis: Testable hypothesis (if applicable)\n`;
    prompt += `4. Methodology: Suggested approach (brief)\n`;
    prompt += `5. Expected Outcomes: What results are expected\n`;
    prompt += `6. Feasibility: High/Medium/Low\n`;
    prompt += `7. Novelty: High/Medium/Low\n`;
    prompt += `8. Potential Impact: High/Medium/Low\n`;
    prompt += `9. Estimated Duration: Rough timeline\n`;
    prompt += `10. Required Resources: What's needed\n\n`;
    
    prompt += `Format as a numbered list, one idea per entry.`;
    
    return prompt;
  }
  
  /**
   * Parse ideas from response
   */
  private parseIdeas(response: string, maxIdeas: number): ResearchIdea[] {
    const ideas: ResearchIdea[] = [];
    
    // Try to parse structured response
    const ideaMatches = response.match(/(?:^|\n)(?:\d+\.|[-*])\s*(.+?)(?=\n(?:^\d+\.|^[-*]|$))/gs);
    
    if (ideaMatches) {
      for (let i = 0; i < Math.min(ideaMatches.length, maxIdeas); i++) {
        const idea = this.parseIdeaEntry(ideaMatches[i]);
        if (idea) {
          ideas.push(idea);
        }
      }
    } else {
      // Fallback parsing
      const sections = response.split(/\n(?=\d+\.)/);
      for (let i = 0; i < Math.min(sections.length, maxIdeas); i++) {
        const idea = this.parseIdeaEntry(sections[i]);
        if (idea) {
          ideas.push(idea);
        }
      }
    }
    
    return ideas.slice(0, maxIdeas);
  }
  
  /**
   * Parse individual idea entry
   */
  private parseIdeaEntry(entry: string): ResearchIdea | null {
    const titleMatch = entry.match(/(?:title|idea)[:\s]+(.+?)(?:\n|$)/i) || entry.match(/^(.+?)(?:\n|$)/);
    if (!titleMatch) return null;
    
    const descriptionMatch = entry.match(/(?:description|overview)[:\s]+(.+?)(?:\n(?:hypothesis|methodology|feasibility)|$)/is);
    const hypothesisMatch = entry.match(/(?:hypothesis)[:\s]+(.+?)(?:\n(?:methodology|feasibility|novelty)|$)/is);
    const methodologyMatch = entry.match(/(?:methodology|approach)[:\s]+(.+?)(?:\n(?:feasibility|novelty|impact)|$)/is);
    const outcomesMatch = entry.match(/(?:expected outcomes?|results?)[:\s]+(.+?)(?:\n(?:feasibility|novelty|impact)|$)/is);
    const feasibilityMatch = entry.match(/(?:feasibility)[:\s]+(high|medium|low)/i);
    const noveltyMatch = entry.match(/(?:novelty)[:\s]+(high|medium|low)/i);
    const impactMatch = entry.match(/(?:potential impact|impact)[:\s]+(high|medium|low)/i);
    const durationMatch = entry.match(/(?:duration|timeline)[:\s]+(.+?)(?:\n|$)/i);
    const resourcesMatch = entry.match(/(?:required resources?|resources?)[:\s]+(.+?)(?:\n|$)/i);
    
    return {
      title: titleMatch[1].trim(),
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      hypothesis: hypothesisMatch ? hypothesisMatch[1].trim() : undefined,
      methodology: methodologyMatch ? methodologyMatch[1].trim() : undefined,
      expectedOutcomes: outcomesMatch ? outcomesMatch[1].trim() : undefined,
      feasibility: (feasibilityMatch?.[1]?.toLowerCase() as any) || 'medium',
      novelty: (noveltyMatch?.[1]?.toLowerCase() as any) || 'medium',
      potentialImpact: (impactMatch?.[1]?.toLowerCase() as any) || 'medium',
      estimatedDuration: durationMatch ? durationMatch[1].trim() : undefined,
      requiredResources: resourcesMatch ? resourcesMatch[1].split(/[,;]/).map(r => r.trim()) : undefined
    };
  }
  
  /**
   * Get provider for idea generation task
   */
  private async getProviderForTask(userId: string): Promise<string> {
    const assignment = await getApiForTask(userId, 'idea_generation');
    return assignment?.provider || 'google_gemini'; // Gemini is good for creative tasks
  }
}

