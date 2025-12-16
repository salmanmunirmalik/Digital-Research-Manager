/**
 * Proposal Writing Agent
 * Task 62: Generate research proposals, grant applications, and project plans
 * 
 * Creates comprehensive research proposals with clear objectives,
 * methodology, expected outcomes, and budget justification.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';

export interface ProposalWritingInput {
  title: string;
  researchQuestion?: string;
  objectives?: string[]; // Research objectives
  background?: string; // Background and context
  methodology?: string; // Proposed methodology
  expectedOutcomes?: string[]; // Expected results
  timeline?: string; // Project timeline
  budget?: {
    total?: number;
    categories?: Record<string, number>;
  };
  grantType?: 'research' | 'fellowship' | 'equipment' | 'travel' | 'conference';
  fundingAgency?: string; // Target funding agency
  wordLimit?: number; // Proposal word limit
}

export interface ProposalResult {
  proposal: {
    title: string;
    executiveSummary: string;
    background: string;
    objectives: string[];
    methodology: string;
    expectedOutcomes: string[];
    timeline: string;
    budgetJustification?: string;
    references?: string[];
  };
  wordCount: number;
  sections: {
    executiveSummary?: number;
    background?: number;
    methodology?: number;
    outcomes?: number;
  };
}

export class ProposalWritingAgent extends BaseAgent implements Agent {
  readonly agentType = 'proposal_writing';
  readonly agentName = 'Proposal Writing Agent';
  readonly description = 'Generates comprehensive research proposals, grant applications, and project plans';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks', 'experiments', 'protocols']; // Needs extensive research context
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
      return false;
    }
    return true;
  }
  
  async execute(
    input: ProposalWritingInput,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      if (!this.validateInput(input)) {
        return {
          success: false,
          content: null,
          error: 'Invalid input: title is required and must be a non-empty string'
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
      
      const userPrompt = this.buildProposalPrompt(input, context?.userContext);
      
      // Call AI provider (may need multiple calls for long proposals)
      const startTime = Date.now();
      const response = await this.getProvider().chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        apiKey: apiKey,
        temperature: 0.7,
        maxTokens: config?.maxTokens || 4000 // Longer for proposals
      });
      
      const duration = Date.now() - startTime;
      
      // Parse proposal
      const proposalResult = this.parseProposal(response.content, input);
      
      return {
        success: true,
        content: proposalResult,
        metadata: {
          provider,
          tokensUsed: response.usage?.totalTokens,
          duration,
          wordCount: proposalResult.wordCount
        }
      };
    } catch (error: any) {
      return this.handleError(error, 'proposal writing');
    }
  }
  
  /**
   * Build prompt for proposal writing
   */
  private buildProposalPrompt(
    input: ProposalWritingInput,
    userContext?: UserContext
  ): string {
    let prompt = `Write a comprehensive research proposal with the following details:\n\n`;
    prompt += `Title: ${input.title}\n\n`;
    
    if (input.researchQuestion) {
      prompt += `Research Question: ${input.researchQuestion}\n\n`;
    }
    
    if (input.grantType) {
      prompt += `Grant Type: ${input.grantType}\n`;
    }
    
    if (input.fundingAgency) {
      prompt += `Target Funding Agency: ${input.fundingAgency}\n`;
      prompt += `Ensure the proposal aligns with this agency's priorities and requirements.\n\n`;
    }
    
    if (input.wordLimit) {
      prompt += `Word Limit: ${input.wordLimit} words (strictly adhere to this limit)\n\n`;
    }
    
    prompt += `Required Sections:\n\n`;
    prompt += `1. Executive Summary (150-200 words)\n`;
    prompt += `   - Brief overview of the research\n`;
    prompt += `   - Key objectives and expected impact\n`;
    prompt += `   - Why this research is important\n\n`;
    
    prompt += `2. Background and Significance\n`;
    if (input.background) {
      prompt += `   - Use provided background: ${input.background}\n`;
    } else {
      prompt += `   - Context and current state of the field\n`;
      prompt += `   - Gap in knowledge this research addresses\n`;
      prompt += `   - Significance and potential impact\n`;
    }
    prompt += `\n`;
    
    prompt += `3. Research Objectives\n`;
    if (input.objectives && input.objectives.length > 0) {
      prompt += `   - Use provided objectives:\n`;
      input.objectives.forEach((obj, idx) => {
        prompt += `     ${idx + 1}. ${obj}\n`;
      });
    } else {
      prompt += `   - Clear, specific, and measurable objectives\n`;
      prompt += `   - Aligned with research question\n`;
    }
    prompt += `\n`;
    
    prompt += `4. Methodology\n`;
    if (input.methodology) {
      prompt += `   - Use provided methodology: ${input.methodology}\n`;
    } else {
      prompt += `   - Detailed research approach\n`;
      prompt += `   - Experimental design (if applicable)\n`;
      prompt += `   - Data collection and analysis methods\n`;
      prompt += `   - Ethical considerations\n`;
    }
    prompt += `\n`;
    
    prompt += `5. Expected Outcomes\n`;
    if (input.expectedOutcomes && input.expectedOutcomes.length > 0) {
      prompt += `   - Use provided outcomes:\n`;
      input.expectedOutcomes.forEach((outcome, idx) => {
        prompt += `     ${idx + 1}. ${outcome}\n`;
      });
    } else {
      prompt += `   - Anticipated results and deliverables\n`;
      prompt += `   - Potential publications\n`;
      prompt += `   - Long-term impact\n`;
    }
    prompt += `\n`;
    
    prompt += `6. Timeline\n`;
    if (input.timeline) {
      prompt += `   - Use provided timeline: ${input.timeline}\n`;
    } else {
      prompt += `   - Project phases and milestones\n`;
      prompt += `   - Estimated duration for each phase\n`;
    }
    prompt += `\n`;
    
    if (input.budget) {
      prompt += `7. Budget Justification\n`;
      if (input.budget.total) {
        prompt += `   - Total budget: $${input.budget.total.toLocaleString()}\n`;
      }
      if (input.budget.categories) {
        prompt += `   - Budget breakdown:\n`;
        Object.entries(input.budget.categories).forEach(([category, amount]) => {
          prompt += `     * ${category}: $${amount.toLocaleString()}\n`;
        });
      }
      prompt += `   - Justify each budget item\n`;
      prompt += `   - Explain necessity and cost-effectiveness\n\n`;
    }
    
    if (userContext?.papers && userContext.papers.length > 0) {
      prompt += `--- Relevant Prior Work ---\n`;
      userContext.papers.slice(0, 5).forEach((paper, idx) => {
        prompt += `${idx + 1}. ${paper.title} (${paper.journal || 'Unknown'}, ${paper.year || 'Unknown'})\n`;
      });
      prompt += `\nBuild upon this foundation.\n\n`;
    }
    
    prompt += `Ensure the proposal:\n`;
    prompt += `- Is well-structured and professional\n`;
    prompt += `- Clearly articulates the research vision\n`;
    prompt += `- Demonstrates feasibility and impact\n`;
    prompt += `- Uses appropriate academic language\n`;
    prompt += `- Is compelling and persuasive\n`;
    
    if (input.wordLimit) {
      prompt += `- Stays within ${input.wordLimit} words\n`;
    }
    
    return prompt;
  }
  
  /**
   * Parse proposal from response
   */
  private parseProposal(response: string, input: ProposalWritingInput): ProposalResult {
    const wordCount = response.split(/\s+/).length;
    
    // Extract sections
    const executiveSummaryMatch = response.match(/(?:executive summary|summary)[:\s]+(.+?)(?=\n(?:background|objectives?|methodology)|$)/is);
    const backgroundMatch = response.match(/(?:background|significance)[:\s]+(.+?)(?=\n(?:objectives?|methodology|expected outcomes?)|$)/is);
    const objectivesMatch = response.match(/(?:objectives?|research objectives?)[:\s]+(.+?)(?=\n(?:methodology|expected outcomes?|timeline)|$)/is);
    const methodologyMatch = response.match(/(?:methodology|methods?)[:\s]+(.+?)(?=\n(?:expected outcomes?|timeline|budget)|$)/is);
    const outcomesMatch = response.match(/(?:expected outcomes?|outcomes?|deliverables)[:\s]+(.+?)(?=\n(?:timeline|budget|references?)|$)/is);
    const timelineMatch = response.match(/(?:timeline|schedule)[:\s]+(.+?)(?=\n(?:budget|references?)|$)/is);
    const budgetMatch = response.match(/(?:budget|budget justification)[:\s]+(.+?)(?=\n(?:references?|$)|$)/is);
    const referencesMatch = response.match(/(?:references?|bibliography)[:\s]+(.+?)$/is);
    
    // Parse objectives list
    const objectives: string[] = [];
    if (objectivesMatch) {
      const objText = objectivesMatch[1];
      const objList = objText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (objList) {
        objectives.push(...objList.map(obj => obj.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      } else {
        // Fallback: split by newlines
        objectives.push(...objText.split('\n').filter(line => line.trim().length > 0).slice(0, 10));
      }
    } else if (input.objectives) {
      objectives.push(...input.objectives);
    }
    
    // Parse expected outcomes list
    const expectedOutcomes: string[] = [];
    if (outcomesMatch) {
      const outcomesText = outcomesMatch[1];
      const outcomesList = outcomesText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (outcomesList) {
        expectedOutcomes.push(...outcomesList.map(outcome => outcome.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      } else {
        expectedOutcomes.push(...outcomesText.split('\n').filter(line => line.trim().length > 0).slice(0, 10));
      }
    } else if (input.expectedOutcomes) {
      expectedOutcomes.push(...input.expectedOutcomes);
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
    
    return {
      proposal: {
        title: input.title,
        executiveSummary: executiveSummaryMatch ? executiveSummaryMatch[1].trim() : '',
        background: backgroundMatch ? backgroundMatch[1].trim() : input.background || '',
        objectives: objectives.length > 0 ? objectives : input.objectives || [],
        methodology: methodologyMatch ? methodologyMatch[1].trim() : input.methodology || '',
        expectedOutcomes: expectedOutcomes.length > 0 ? expectedOutcomes : input.expectedOutcomes || [],
        timeline: timelineMatch ? timelineMatch[1].trim() : input.timeline || '',
        budgetJustification: budgetMatch ? budgetMatch[1].trim() : undefined,
        references: references.length > 0 ? references : undefined
      },
      wordCount,
      sections: {
        executiveSummary: executiveSummaryMatch ? executiveSummaryMatch[1].split(/\s+/).length : undefined,
        background: backgroundMatch ? backgroundMatch[1].split(/\s+/).length : undefined,
        methodology: methodologyMatch ? methodologyMatch[1].split(/\s+/).length : undefined
      }
    };
  }
  
  /**
   * Get provider for proposal writing task
   */
  private async getProviderForTask(userId: string): Promise<string> {
    const assignment = await getApiForTask(userId, 'proposal_writing');
    return assignment?.provider || 'anthropic_claude'; // Claude is best for long-form writing
  }
}

