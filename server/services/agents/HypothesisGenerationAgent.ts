/**
 * Hypothesis Generation Agent
 * Task 26: Generate testable research hypotheses
 * 
 * Generates well-formed, testable research hypotheses based on:
 * - Research questions
 * - Literature gaps
 * - Existing data patterns
 * - Research context
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface HypothesisGenerationInput {
  researchQuestion: string;
  context?: {
    literatureGaps?: string[]; // Identified gaps in literature
    existingFindings?: string; // Existing research findings
    dataPatterns?: any; // Patterns observed in data
    theoreticalFramework?: string; // Theoretical basis
  };
  constraints?: {
    testability?: 'high' | 'medium' | 'low'; // How testable should hypotheses be
    scope?: 'narrow' | 'moderate' | 'broad';
    timeframe?: string; // Research timeframe
  };
  numberOfHypotheses?: number; // How many hypotheses to generate (default: 3-5)
  type?: 'null' | 'alternative' | 'directional' | 'non-directional' | 'all';
}

export interface HypothesisGenerationResult {
  success: boolean;
  hypotheses: Array<{
    id: string;
    hypothesis: string;
    type: 'null' | 'alternative' | 'directional' | 'non-directional';
    testability: 'high' | 'medium' | 'low';
    rationale: string;
    testablePredictions: string[];
    experimentalDesign?: {
      approach: string;
      variables: {
        independent: string[];
        dependent: string[];
        controlled: string[];
      };
      methodology: string;
    };
    expectedOutcomes?: {
      ifTrue: string;
      ifFalse: string;
    };
    limitations?: string[];
  }>;
  synthesis: {
    relationships: Array<{
      hypothesis1: string;
      hypothesis2: string;
      relationship: 'independent' | 'complementary' | 'competing' | 'hierarchical';
      description: string;
    }>;
    overallFramework: string;
  };
  recommendations: string[];
}

export class HypothesisGenerationAgent extends BaseAgent implements Agent {
  readonly agentType = 'hypothesis_generation';
  readonly agentName = 'Hypothesis Generation Agent';
  readonly description = 'Generates testable research hypotheses from research questions and context';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks', 'experiments'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.researchQuestion || typeof input.researchQuestion !== 'string') {
      return false;
    }
    return true;
  }
  
  async execute(
    input: HypothesisGenerationInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: researchQuestion is required',
          content: null
        };
      }
      
      // Get API assignment for idea generation or content writing
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'idea_generation') || 
                           await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for hypothesis generation. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      const numberOfHypotheses = input.numberOfHypotheses || 5;
      const hypothesisType = input.type || 'all';
      
      // Generate hypotheses
      const hypotheses = await this.generateHypotheses(
        input,
        numberOfHypotheses,
        hypothesisType,
        aiProvider,
        apiAssignment,
        context
      );
      
      // Synthesize relationships between hypotheses
      const synthesis = await this.synthesizeHypotheses(
        hypotheses,
        input,
        aiProvider,
        apiAssignment
      );
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(hypotheses, input);
      
      const result: HypothesisGenerationResult = {
        success: true,
        hypotheses,
        synthesis,
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
      console.error('Error in HypothesisGenerationAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate hypotheses',
        content: null
      };
    }
  }
  
  /**
   * Generate hypotheses using AI
   */
  private async generateHypotheses(
    input: HypothesisGenerationInput,
    numberOfHypotheses: number,
    hypothesisType: string,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string },
    context: AgentContext
  ): Promise<HypothesisGenerationResult['hypotheses']> {
    try {
      const prompt = `Generate ${numberOfHypotheses} well-formed, testable research hypotheses based on the following information.

Research Question: ${input.researchQuestion}
${input.context?.literatureGaps ? `Literature Gaps: ${input.context.literatureGaps.join(', ')}` : ''}
${input.context?.existingFindings ? `Existing Findings: ${input.context.existingFindings}` : ''}
${input.context?.theoreticalFramework ? `Theoretical Framework: ${input.context.theoreticalFramework}` : ''}
${input.constraints?.testability ? `Testability Requirement: ${input.constraints.testability}` : ''}
${input.constraints?.scope ? `Scope: ${input.constraints.scope}` : ''}

Hypothesis Types: ${hypothesisType === 'all' ? 'Include null, alternative, directional, and non-directional hypotheses' : `Generate only ${hypothesisType} hypotheses`}

For each hypothesis, provide:
1. The hypothesis statement (clear, testable, specific)
2. Hypothesis type (null, alternative, directional, non-directional)
3. Testability assessment (high, medium, low)
4. Rationale (why this hypothesis is plausible)
5. Testable predictions (specific predictions that can be tested)
6. Experimental design approach (how to test it)
7. Expected outcomes (what results would support/refute it)
8. Limitations (potential issues or constraints)

Format as JSON array:
[
  {
    "hypothesis": "Clear, testable hypothesis statement",
    "type": "null|alternative|directional|non-directional",
    "testability": "high|medium|low",
    "rationale": "Why this hypothesis is plausible",
    "testablePredictions": ["prediction1", "prediction2"],
    "experimentalDesign": {
      "approach": "Experimental approach",
      "variables": {
        "independent": ["var1", "var2"],
        "dependent": ["var1"],
        "controlled": ["var1"]
      },
      "methodology": "Methodology description"
    },
    "expectedOutcomes": {
      "ifTrue": "What results would support the hypothesis",
      "ifFalse": "What results would refute the hypothesis"
    },
    "limitations": ["limitation1", "limitation2"]
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in research methodology and hypothesis formation. Generate well-formed, testable hypotheses following scientific standards.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.7,
        maxTokens: 3000
      });
      
      try {
        const hypotheses = JSON.parse(response.content);
        return hypotheses.map((hyp: any, index: number) => ({
          id: `hyp_${Date.now()}_${index}`,
          hypothesis: hyp.hypothesis,
          type: hyp.type || 'alternative',
          testability: hyp.testability || 'medium',
          rationale: hyp.rationale || '',
          testablePredictions: hyp.testablePredictions || [],
          experimentalDesign: hyp.experimentalDesign,
          expectedOutcomes: hyp.expectedOutcomes,
          limitations: hyp.limitations || []
        }));
      } catch {
        // Fallback: create basic hypotheses
        return this.createBasicHypotheses(input.researchQuestion, numberOfHypotheses);
      }
    } catch (error) {
      console.error('Error generating hypotheses:', error);
      return this.createBasicHypotheses(input.researchQuestion, numberOfHypotheses);
    }
  }
  
  /**
   * Create basic hypotheses as fallback
   */
  private createBasicHypotheses(researchQuestion: string, count: number): HypothesisGenerationResult['hypotheses'] {
    const hypotheses: HypothesisGenerationResult['hypotheses'] = [];
    
    for (let i = 0; i < count; i++) {
      hypotheses.push({
        id: `hyp_${Date.now()}_${i}`,
        hypothesis: `Hypothesis ${i + 1} related to: ${researchQuestion}`,
        type: 'alternative',
        testability: 'medium',
        rationale: 'Generated based on research question',
        testablePredictions: [],
        limitations: []
      });
    }
    
    return hypotheses;
  }
  
  /**
   * Synthesize relationships between hypotheses
   */
  private async synthesizeHypotheses(
    hypotheses: HypothesisGenerationResult['hypotheses'],
    input: HypothesisGenerationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<HypothesisGenerationResult['synthesis']> {
    try {
      const prompt = `Analyze the relationships between the following research hypotheses.

Research Question: ${input.researchQuestion}
Hypotheses:
${hypotheses.map((h, i) => `${i + 1}. ${h.hypothesis}`).join('\n')}

Identify:
1. Relationships between hypotheses (independent, complementary, competing, hierarchical)
2. Overall theoretical framework that connects them

Format as JSON:
{
  "relationships": [
    {
      "hypothesis1": "Hypothesis 1",
      "hypothesis2": "Hypothesis 2",
      "relationship": "independent|complementary|competing|hierarchical",
      "description": "How they relate"
    }
  ],
  "overallFramework": "Overall framework description"
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in research theory. Analyze hypothesis relationships and frameworks.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.5,
        maxTokens: 2000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return {
          relationships: [],
          overallFramework: 'Hypotheses generated for research question'
        };
      }
    } catch (error) {
      console.error('Error synthesizing hypotheses:', error);
      return {
        relationships: [],
        overallFramework: 'Hypotheses generated for research question'
      };
    }
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    hypotheses: HypothesisGenerationResult['hypotheses'],
    input: HypothesisGenerationInput
  ): string[] {
    const recommendations: string[] = [];
    
    // Check testability
    const lowTestability = hypotheses.filter(h => h.testability === 'low');
    if (lowTestability.length > 0) {
      recommendations.push(`Consider refining ${lowTestability.length} hypothesis(es) with low testability for better experimental design`);
    }
    
    // Check for null hypotheses
    const hasNull = hypotheses.some(h => h.type === 'null');
    if (!hasNull && input.type !== 'alternative') {
      recommendations.push('Consider including null hypotheses for comprehensive testing');
    }
    
    // Check experimental design
    const missingDesign = hypotheses.filter(h => !h.experimentalDesign);
    if (missingDesign.length > 0) {
      recommendations.push(`Develop experimental designs for ${missingDesign.length} hypothesis(es)`);
    }
    
    // Check predictions
    const missingPredictions = hypotheses.filter(h => h.testablePredictions.length === 0);
    if (missingPredictions.length > 0) {
      recommendations.push(`Develop testable predictions for ${missingPredictions.length} hypothesis(es)`);
    }
    
    return recommendations;
  }
}

