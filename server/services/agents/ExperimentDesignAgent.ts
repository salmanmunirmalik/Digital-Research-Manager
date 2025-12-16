/**
 * Experiment Design Agent
 * Task 9: Design experiments and protocols
 * 
 * Creates detailed experimental designs, protocols, and methodologies
 * based on research questions and objectives.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';

export interface ExperimentDesignInput {
  researchQuestion: string;
  objectives?: string[];
  hypothesis?: string;
  constraints?: {
    resources?: string[];
    timeframe?: string;
    equipment?: string[];
    budget?: number;
  };
  type?: 'laboratory' | 'field' | 'computational' | 'clinical' | 'observational';
  design?: 'randomized' | 'controlled' | 'longitudinal' | 'cross_sectional' | 'case_control';
}

export interface ExperimentDesignResult {
  design: {
    title: string;
    researchQuestion: string;
    hypothesis: string;
    objectives: string[];
    methodology: {
      design: string;
      participants?: {
        description: string;
        sampleSize?: number;
        inclusionCriteria?: string[];
        exclusionCriteria?: string[];
      };
      materials?: {
        equipment: string[];
        reagents?: string[];
        software?: string[];
      };
      procedure: string[];
      variables: {
        independent: string[];
        dependent: string[];
        controlled: string[];
      };
      controls?: string[];
      dataCollection: string[];
      analysisPlan: string[];
    };
    timeline: {
      phase: string;
      duration: string;
      tasks: string[];
    }[];
    ethicalConsiderations?: string[];
    expectedOutcomes: string[];
    riskAssessment?: {
      risk: string;
      mitigation: string;
    }[];
  };
  wordCount: number;
}

export class ExperimentDesignAgent extends BaseAgent implements Agent {
  readonly agentType = 'experiment_design';
  readonly agentName = 'Experiment Design Agent';
  readonly description = 'Designs detailed experimental protocols and methodologies';
  
  getRequiredContext(): string[] {
    return ['notebooks', 'protocols', 'experiments']; // Needs access to existing protocols
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.researchQuestion || typeof input.researchQuestion !== 'string' || input.researchQuestion.trim().length === 0) {
      return false;
    }
    return true;
  }
  
  async execute(
    input: ExperimentDesignInput,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      if (!this.validateInput(input)) {
        return {
          success: false,
          content: null,
          error: 'Invalid input: researchQuestion is required and must be a non-empty string'
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
        { taskType: 'experiment_design' } as TaskAnalysis,
        context?.userContext
      );
      
      const userPrompt = this.buildExperimentDesignPrompt(input, context?.userContext);
      
      // Call AI provider
      const startTime = Date.now();
      const response = await this.getProvider().chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        apiKey: apiKey,
        temperature: 0.7,
        maxTokens: config?.maxTokens || 3000
      });
      
      const duration = Date.now() - startTime;
      
      // Parse design
      const designResult = this.parseExperimentDesign(response.content, input);
      
      return {
        success: true,
        content: designResult,
        metadata: {
          provider,
          tokensUsed: response.usage?.totalTokens,
          duration,
          wordCount: designResult.wordCount
        }
      };
    } catch (error: any) {
      return this.handleError(error, 'experiment design');
    }
  }
  
  /**
   * Build prompt for experiment design
   */
  private buildExperimentDesignPrompt(
    input: ExperimentDesignInput,
    userContext?: UserContext
  ): string {
    let prompt = `Design a detailed experimental protocol for the following research:\n\n`;
    prompt += `Research Question: ${input.researchQuestion}\n\n`;
    
    if (input.hypothesis) {
      prompt += `Hypothesis: ${input.hypothesis}\n\n`;
    }
    
    if (input.objectives && input.objectives.length > 0) {
      prompt += `Objectives:\n`;
      input.objectives.forEach((obj, idx) => {
        prompt += `${idx + 1}. ${obj}\n`;
      });
      prompt += `\n`;
    }
    
    if (input.type) {
      prompt += `Experiment Type: ${input.type}\n`;
    }
    
    if (input.design) {
      prompt += `Design Type: ${input.design}\n`;
    }
    
    if (input.constraints) {
      prompt += `\nConstraints:\n`;
      if (input.constraints.resources) {
        prompt += `- Available resources: ${input.constraints.resources.join(', ')}\n`;
      }
      if (input.constraints.timeframe) {
        prompt += `- Timeframe: ${input.constraints.timeframe}\n`;
      }
      if (input.constraints.equipment) {
        prompt += `- Equipment: ${input.constraints.equipment.join(', ')}\n`;
      }
      if (input.constraints.budget) {
        prompt += `- Budget: $${input.constraints.budget.toLocaleString()}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `Create a comprehensive experimental design with the following sections:\n\n`;
    prompt += `1. **Title**: Clear, descriptive title\n\n`;
    prompt += `2. **Research Question**: Restate the research question\n\n`;
    prompt += `3. **Hypothesis**: Testable hypothesis (if not provided, generate one)\n\n`;
    prompt += `4. **Objectives**: Specific, measurable objectives\n\n`;
    prompt += `5. **Methodology**:\n`;
    prompt += `   a. Experimental Design: ${input.design || 'Appropriate design type'}\n`;
    prompt += `   b. Participants/Materials:\n`;
    prompt += `      - Description\n`;
    prompt += `      - Sample size (with justification)\n`;
    prompt += `      - Inclusion/exclusion criteria\n`;
    prompt += `   c. Materials/Equipment:\n`;
    prompt += `      - Required equipment\n`;
    prompt += `      - Reagents/consumables\n`;
    prompt += `      - Software/tools\n`;
    prompt += `   d. Procedure: Step-by-step protocol\n`;
    prompt += `   e. Variables:\n`;
    prompt += `      - Independent variables\n`;
    prompt += `      - Dependent variables\n`;
    prompt += `      - Controlled variables\n`;
    prompt += `   f. Controls: Positive and negative controls\n`;
    prompt += `   g. Data Collection: What data will be collected and how\n`;
    prompt += `   h. Analysis Plan: Statistical methods and analysis approach\n\n`;
    prompt += `6. **Timeline**: Phases with durations and tasks\n\n`;
    prompt += `7. **Ethical Considerations**: IRB requirements, consent, safety\n\n`;
    prompt += `8. **Expected Outcomes**: Anticipated results\n\n`;
    prompt += `9. **Risk Assessment**: Potential risks and mitigation strategies\n\n`;
    
    if (userContext?.protocols && userContext.protocols.length > 0) {
      prompt += `\n--- User's Existing Protocols ---\n`;
      userContext.protocols.slice(0, 3).forEach((protocol, idx) => {
        prompt += `${idx + 1}. ${protocol.title}\n`;
      });
      prompt += `\nConsider similar approaches but adapt to the new research question.\n\n`;
    }
    
    prompt += `Ensure the design:\n`;
    prompt += `- Is scientifically rigorous\n`;
    prompt += `- Addresses the research question directly\n`;
    prompt += `- Is feasible given the constraints\n`;
    prompt += `- Includes appropriate controls\n`;
    prompt += `- Has clear data collection and analysis plans\n`;
    prompt += `- Considers ethical implications\n`;
    
    return prompt;
  }
  
  /**
   * Parse experiment design from response
   */
  private parseExperimentDesign(response: string, input: ExperimentDesignInput): ExperimentDesignResult {
    const wordCount = response.split(/\s+/).length;
    
    // Extract sections
    const titleMatch = response.match(/(?:^|#\s+)(title)[:\s]+(.+?)(?:\n|$)/i) || 
                      response.match(/^(.+?)(?:\n|$)/);
    const questionMatch = response.match(/(?:research question)[:\s]+(.+?)(?=\n(?:hypothesis|objectives?)|$)/is);
    const hypothesisMatch = response.match(/(?:hypothesis)[:\s]+(.+?)(?=\n(?:objectives?|methodology)|$)/is);
    const objectivesMatch = response.match(/(?:objectives?)[:\s]+(.+?)(?=\n(?:methodology|procedure)|$)/is);
    const methodologyMatch = response.match(/(?:methodology|methods?)[:\s]+(.+?)(?=\n(?:timeline|ethical|expected outcomes?)|$)/is);
    const timelineMatch = response.match(/(?:timeline|schedule)[:\s]+(.+?)(?=\n(?:ethical|expected outcomes?|risk)|$)/is);
    const ethicalMatch = response.match(/(?:ethical considerations?)[:\s]+(.+?)(?=\n(?:expected outcomes?|risk)|$)/is);
    const outcomesMatch = response.match(/(?:expected outcomes?)[:\s]+(.+?)(?=\n(?:risk|$)|$)/is);
    const riskMatch = response.match(/(?:risk assessment|risks?)[:\s]+(.+?)$/is);
    
    // Parse objectives
    const objectives: string[] = [];
    if (objectivesMatch) {
      const objText = objectivesMatch[1];
      const objList = objText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (objList) {
        objectives.push(...objList.map(obj => obj.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    } else if (input.objectives) {
      objectives.push(...input.objectives);
    }
    
    // Parse methodology details
    const methodology = this.parseMethodology(methodologyMatch ? methodologyMatch[1] : '');
    
    // Parse timeline
    const timeline = this.parseTimeline(timelineMatch ? timelineMatch[1] : '');
    
    // Parse expected outcomes
    const expectedOutcomes: string[] = [];
    if (outcomesMatch) {
      const outcomesText = outcomesMatch[1];
      const outcomesList = outcomesText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (outcomesList) {
        expectedOutcomes.push(...outcomesList.map(outcome => outcome.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse ethical considerations
    const ethicalConsiderations: string[] = [];
    if (ethicalMatch) {
      const ethicalText = ethicalMatch[1];
      const ethicalList = ethicalText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (ethicalList) {
        ethicalConsiderations.push(...ethicalList.map(item => item.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse risk assessment
    const riskAssessment: any[] = [];
    if (riskMatch) {
      const riskText = riskMatch[1];
      const riskItems = riskText.match(/(?:risk|issue)[:\s]+(.+?)(?:\n(?:mitigation|solution)[:\s]+(.+?)(?=\n(?:risk|issue)|$)|$)/gis);
      if (riskItems) {
        riskItems.forEach(item => {
          const riskMatch = item.match(/risk[:\s]+(.+?)(?:\n|$)/i);
          const mitigationMatch = item.match(/mitigation[:\s]+(.+?)(?:\n|$)/i);
          if (riskMatch) {
            riskAssessment.push({
              risk: riskMatch[1].trim(),
              mitigation: mitigationMatch ? mitigationMatch[1].trim() : ''
            });
          }
        });
      }
    }
    
    return {
      design: {
        title: titleMatch ? titleMatch[titleMatch.length - 1].trim() : `Experimental Design: ${input.researchQuestion}`,
        researchQuestion: questionMatch ? questionMatch[1].trim() : input.researchQuestion,
        hypothesis: hypothesisMatch ? hypothesisMatch[1].trim() : input.hypothesis || '',
        objectives: objectives.length > 0 ? objectives : input.objectives || [],
        methodology,
        timeline,
        ethicalConsiderations: ethicalConsiderations.length > 0 ? ethicalConsiderations : undefined,
        expectedOutcomes: expectedOutcomes.length > 0 ? expectedOutcomes : [],
        riskAssessment: riskAssessment.length > 0 ? riskAssessment : undefined
      },
      wordCount
    };
  }
  
  /**
   * Parse methodology section
   */
  private parseMethodology(text: string): any {
    const designMatch = text.match(/(?:design|experimental design)[:\s]+(.+?)(?:\n|$)/i);
    const procedureMatch = text.match(/(?:procedure|protocol|steps?)[:\s]+(.+?)(?=\n(?:variables?|controls?|data)|$)/is);
    const variablesMatch = text.match(/(?:variables?)[:\s]+(.+?)(?=\n(?:controls?|data|analysis)|$)/is);
    const controlsMatch = text.match(/(?:controls?)[:\s]+(.+?)(?=\n(?:data|analysis)|$)/is);
    const dataCollectionMatch = text.match(/(?:data collection)[:\s]+(.+?)(?=\n(?:analysis|$)|$)/is);
    const analysisMatch = text.match(/(?:analysis plan|statistical analysis)[:\s]+(.+?)(?:\n|$)/is);
    
    // Parse variables
    const variables: any = { independent: [], dependent: [], controlled: [] };
    if (variablesMatch) {
      const indMatch = variablesMatch[1].match(/(?:independent|IV)[:\s]+(.+?)(?=\n(?:dependent|DV)|$)/is);
      const depMatch = variablesMatch[1].match(/(?:dependent|DV)[:\s]+(.+?)(?=\n(?:controlled|CV)|$)/is);
      const conMatch = variablesMatch[1].match(/(?:controlled|CV)[:\s]+(.+?)(?:\n|$)/is);
      
      if (indMatch) {
        variables.independent = indMatch[1].split(/[,;]/).map(v => v.trim()).filter(v => v.length > 0);
      }
      if (depMatch) {
        variables.dependent = depMatch[1].split(/[,;]/).map(v => v.trim()).filter(v => v.length > 0);
      }
      if (conMatch) {
        variables.controlled = conMatch[1].split(/[,;]/).map(v => v.trim()).filter(v => v.length > 0);
      }
    }
    
    // Parse procedure steps
    const procedure: string[] = [];
    if (procedureMatch) {
      const steps = procedureMatch[1].match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (steps) {
        procedure.push(...steps.map(step => step.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse controls
    const controls: string[] = [];
    if (controlsMatch) {
      const controlList = controlsMatch[1].match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (controlList) {
        controls.push(...controlList.map(control => control.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse data collection
    const dataCollection: string[] = [];
    if (dataCollectionMatch) {
      const dataList = dataCollectionMatch[1].match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (dataList) {
        dataCollection.push(...dataList.map(item => item.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse analysis plan
    const analysisPlan: string[] = [];
    if (analysisMatch) {
      const analysisList = analysisMatch[1].match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (analysisList) {
        analysisPlan.push(...analysisList.map(item => item.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    return {
      design: designMatch ? designMatch[1].trim() : '',
      procedure: procedure.length > 0 ? procedure : [],
      variables,
      controls: controls.length > 0 ? controls : undefined,
      dataCollection: dataCollection.length > 0 ? dataCollection : [],
      analysisPlan: analysisPlan.length > 0 ? analysisPlan : []
    };
  }
  
  /**
   * Parse timeline
   */
  private parseTimeline(text: string): any[] {
    const timeline: any[] = [];
    const phaseMatches = text.match(/(?:phase|stage|milestone)[:\s]+(.+?)(?=\n(?:phase|stage|milestone)|$)/gis);
    
    if (phaseMatches) {
      phaseMatches.forEach(phaseText => {
        const phaseNameMatch = phaseText.match(/^(.+?)(?:\n|$)/);
        const durationMatch = phaseText.match(/(?:duration|time)[:\s]+(.+?)(?:\n|$)/i);
        const tasksMatch = phaseText.match(/(?:tasks?|activities?)[:\s]+(.+?)(?:\n|$)/is);
        
        if (phaseNameMatch) {
          const tasks: string[] = [];
          if (tasksMatch) {
            const taskList = tasksMatch[1].match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
            if (taskList) {
              tasks.push(...taskList.map(task => task.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
            }
          }
          
          timeline.push({
            phase: phaseNameMatch[1].trim(),
            duration: durationMatch ? durationMatch[1].trim() : '',
            tasks: tasks.length > 0 ? tasks : []
          });
        }
      });
    }
    
    return timeline;
  }
  
  /**
   * Get provider for experiment design task
   */
  private async getProviderForTask(userId: string): Promise<string> {
    const assignment = await getApiForTask(userId, 'experiment_design');
    return assignment?.provider || 'openai'; // OpenAI is good for structured design
  }
}

