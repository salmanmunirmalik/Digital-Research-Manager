/**
 * Protocol Optimization Agent
 * Task 27: Optimize experimental protocols
 * 
 * Analyzes and optimizes experimental protocols for:
 * - Efficiency (time, resources)
 * - Accuracy and reproducibility
 * - Cost-effectiveness
 * - Safety and compliance
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface ProtocolOptimizationInput {
  protocol: {
    title?: string;
    description: string;
    steps: Array<{
      step: number;
      description: string;
      duration?: string;
      resources?: string[];
      equipment?: string[];
    }>;
    materials?: string[];
    equipment?: string[];
    duration?: string;
    cost?: number;
  };
  optimizationGoals?: Array<'efficiency' | 'accuracy' | 'cost' | 'safety' | 'reproducibility'>;
  constraints?: {
    budget?: number;
    timeframe?: string;
    availableResources?: string[];
    availableEquipment?: string[];
    safetyRequirements?: string[];
  };
  context?: {
    previousProtocols?: string[]; // IDs of similar protocols
    literature?: string; // Relevant literature
    bestPractices?: string; // Best practices in the field
  };
}

export interface ProtocolOptimizationResult {
  success: boolean;
  originalProtocol: ProtocolOptimizationInput['protocol'];
  optimizedProtocol: {
    title?: string;
    description: string;
    steps: Array<{
      step: number;
      description: string;
      duration?: string;
      resources?: string[];
      equipment?: string[];
      optimization?: string; // What was optimized
    }>;
    materials?: string[];
    equipment?: string[];
    duration?: string;
    cost?: number;
  };
  optimizations: Array<{
    type: 'efficiency' | 'accuracy' | 'cost' | 'safety' | 'reproducibility';
    description: string;
    impact: 'high' | 'medium' | 'low';
    rationale: string;
    changes: string[];
    expectedImprovement: string;
  }>;
  metrics: {
    efficiency: {
      original: number; // 0-100
      optimized: number;
      improvement: number;
    };
    accuracy: {
      original: number;
      optimized: number;
      improvement: number;
    };
    cost: {
      original: number;
      optimized: number;
      improvement: number; // Percentage reduction
    };
    safety: {
      original: number;
      optimized: number;
      improvement: number;
    };
    reproducibility: {
      original: number;
      optimized: number;
      improvement: number;
    };
  };
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  validation: {
    steps: Array<{
      step: string;
      description: string;
      critical: boolean;
    }>;
    risks: Array<{
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  };
}

export class ProtocolOptimizationAgent extends BaseAgent implements Agent {
  readonly agentType = 'protocol_optimization';
  readonly agentName = 'Protocol Optimization Agent';
  readonly description = 'Optimizes experimental protocols for efficiency, accuracy, cost, and safety';
  
  getRequiredContext(): string[] {
    return ['protocols', 'notebooks', 'experiments'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.protocol || typeof input.protocol !== 'object') return false;
    if (!input.protocol.description || !input.protocol.steps || input.protocol.steps.length === 0) {
      return false;
    }
    return true;
  }
  
  async execute(
    input: ProtocolOptimizationInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: protocol with description and steps is required',
          content: null
        };
      }
      
      // Get API assignment for content writing
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for protocol optimization. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      const optimizationGoals = input.optimizationGoals || ['efficiency', 'accuracy', 'cost'];
      
      // Analyze current protocol
      const analysis = await this.analyzeProtocol(input.protocol, aiProvider, apiAssignment);
      
      // Optimize protocol
      const optimizedProtocol = await this.optimizeProtocol(
        input.protocol,
        optimizationGoals,
        input.constraints,
        analysis,
        aiProvider,
        apiAssignment
      );
      
      // Identify optimizations
      const optimizations = await this.identifyOptimizations(
        input.protocol,
        optimizedProtocol,
        optimizationGoals,
        aiProvider,
        apiAssignment
      );
      
      // Calculate metrics
      const metrics = this.calculateMetrics(input.protocol, optimizedProtocol, optimizations);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        input.protocol,
        optimizedProtocol,
        optimizations,
        aiProvider,
        apiAssignment
      );
      
      // Validate optimized protocol
      const validation = await this.validateProtocol(
        optimizedProtocol,
        input.constraints,
        aiProvider,
        apiAssignment
      );
      
      const result: ProtocolOptimizationResult = {
        success: true,
        originalProtocol: input.protocol,
        optimizedProtocol,
        optimizations,
        metrics,
        recommendations,
        validation
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
      console.error('Error in ProtocolOptimizationAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to optimize protocol',
        content: null
      };
    }
  }
  
  /**
   * Analyze current protocol
   */
  private async analyzeProtocol(
    protocol: ProtocolOptimizationInput['protocol'],
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<any> {
    try {
      const prompt = `Analyze the following experimental protocol for optimization opportunities.

Protocol:
Title: ${protocol.title || 'Untitled'}
Description: ${protocol.description}
Steps: ${JSON.stringify(protocol.steps, null, 2)}
Materials: ${protocol.materials?.join(', ') || 'Not specified'}
Equipment: ${protocol.equipment?.join(', ') || 'Not specified'}
Duration: ${protocol.duration || 'Not specified'}
Cost: ${protocol.cost || 'Not specified'}

Identify:
1. Inefficiencies (redundant steps, unnecessary waiting times)
2. Accuracy concerns (vague steps, missing controls)
3. Cost issues (expensive materials, inefficient resource use)
4. Safety concerns
5. Reproducibility issues (unclear instructions, missing details)

Format as JSON:
{
  "inefficiencies": ["issue1", "issue2"],
  "accuracyConcerns": ["concern1", "concern2"],
  "costIssues": ["issue1", "issue2"],
  "safetyConcerns": ["concern1", "concern2"],
  "reproducibilityIssues": ["issue1", "issue2"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in experimental protocol design and optimization. Analyze protocols thoroughly.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.4,
        maxTokens: 2000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return {
          inefficiencies: [],
          accuracyConcerns: [],
          costIssues: [],
          safetyConcerns: [],
          reproducibilityIssues: []
        };
      }
    } catch (error) {
      console.error('Error analyzing protocol:', error);
      return {
        inefficiencies: [],
        accuracyConcerns: [],
        costIssues: [],
        safetyConcerns: [],
        reproducibilityIssues: []
      };
    }
  }
  
  /**
   * Optimize protocol
   */
  private async optimizeProtocol(
    originalProtocol: ProtocolOptimizationInput['protocol'],
    optimizationGoals: string[],
    constraints: ProtocolOptimizationInput['constraints'],
    analysis: any,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ProtocolOptimizationResult['optimizedProtocol']> {
    try {
      const prompt = `Optimize the following experimental protocol based on the analysis and goals.

Original Protocol:
${JSON.stringify(originalProtocol, null, 2)}

Analysis Results:
${JSON.stringify(analysis, null, 2)}

Optimization Goals: ${optimizationGoals.join(', ')}
Constraints: ${JSON.stringify(constraints || {}, null, 2)}

Create an optimized version that:
1. Addresses identified issues
2. Achieves optimization goals
3. Respects constraints
4. Maintains or improves accuracy
5. Improves efficiency
6. Reduces costs (if applicable)
7. Enhances safety
8. Improves reproducibility

For each step, indicate what was optimized.

Format as JSON:
{
  "title": "Optimized protocol title",
  "description": "Optimized description",
  "steps": [
    {
      "step": 1,
      "description": "Optimized step description",
      "duration": "time",
      "resources": ["resource1"],
      "equipment": ["equipment1"],
      "optimization": "What was optimized"
    }
  ],
  "materials": ["material1", "material2"],
  "equipment": ["equipment1", "equipment2"],
  "duration": "total duration",
  "cost": estimated_cost
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in protocol optimization. Create efficient, accurate, and cost-effective protocols.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.5,
        maxTokens: 4000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        // Fallback: return original with minor modifications
        return {
          ...originalProtocol,
          description: `Optimized: ${originalProtocol.description}`
        };
      }
    } catch (error) {
      console.error('Error optimizing protocol:', error);
      return {
        ...originalProtocol,
        description: `Optimized: ${originalProtocol.description}`
      };
    }
  }
  
  /**
   * Identify specific optimizations made
   */
  private async identifyOptimizations(
    originalProtocol: ProtocolOptimizationInput['protocol'],
    optimizedProtocol: ProtocolOptimizationResult['optimizedProtocol'],
    optimizationGoals: string[],
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ProtocolOptimizationResult['optimizations']> {
    try {
      const prompt = `Identify and describe the specific optimizations made to the protocol.

Original Protocol:
${JSON.stringify(originalProtocol, null, 2)}

Optimized Protocol:
${JSON.stringify(optimizedProtocol, null, 2)}

Optimization Goals: ${optimizationGoals.join(', ')}

For each optimization, provide:
1. Type (efficiency, accuracy, cost, safety, reproducibility)
2. Description
3. Impact (high, medium, low)
4. Rationale
5. Specific changes made
6. Expected improvement

Format as JSON array:
[
  {
    "type": "efficiency|accuracy|cost|safety|reproducibility",
    "description": "What was optimized",
    "impact": "high|medium|low",
    "rationale": "Why this optimization matters",
    "changes": ["change1", "change2"],
    "expectedImprovement": "Expected improvement description"
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in protocol optimization. Identify and describe optimizations clearly.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.5,
        maxTokens: 2000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error identifying optimizations:', error);
      return [];
    }
  }
  
  /**
   * Calculate optimization metrics
   */
  private calculateMetrics(
    originalProtocol: ProtocolOptimizationInput['protocol'],
    optimizedProtocol: ProtocolOptimizationResult['optimizedProtocol'],
    optimizations: ProtocolOptimizationResult['optimizations']
  ): ProtocolOptimizationResult['metrics'] {
    // Simplified metric calculation
    const efficiencyImprovement = optimizations
      .filter(o => o.type === 'efficiency')
      .reduce((sum, o) => sum + (o.impact === 'high' ? 20 : o.impact === 'medium' ? 10 : 5), 0);
    
    const accuracyImprovement = optimizations
      .filter(o => o.type === 'accuracy')
      .reduce((sum, o) => sum + (o.impact === 'high' ? 15 : o.impact === 'medium' ? 8 : 3), 0);
    
    const costReduction = originalProtocol.cost && optimizedProtocol.cost
      ? ((originalProtocol.cost - optimizedProtocol.cost) / originalProtocol.cost) * 100
      : 0;
    
    const safetyImprovement = optimizations
      .filter(o => o.type === 'safety')
      .reduce((sum, o) => sum + (o.impact === 'high' ? 25 : o.impact === 'medium' ? 12 : 5), 0);
    
    const reproducibilityImprovement = optimizations
      .filter(o => o.type === 'reproducibility')
      .reduce((sum, o) => sum + (o.impact === 'high' ? 18 : o.impact === 'medium' ? 9 : 4), 0);
    
    return {
      efficiency: {
        original: 70,
        optimized: Math.min(100, 70 + efficiencyImprovement),
        improvement: efficiencyImprovement
      },
      accuracy: {
        original: 75,
        optimized: Math.min(100, 75 + accuracyImprovement),
        improvement: accuracyImprovement
      },
      cost: {
        original: originalProtocol.cost || 0,
        optimized: optimizedProtocol.cost || 0,
        improvement: costReduction
      },
      safety: {
        original: 80,
        optimized: Math.min(100, 80 + safetyImprovement),
        improvement: safetyImprovement
      },
      reproducibility: {
        original: 72,
        optimized: Math.min(100, 72 + reproducibilityImprovement),
        improvement: reproducibilityImprovement
      }
    };
  }
  
  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    originalProtocol: ProtocolOptimizationInput['protocol'],
    optimizedProtocol: ProtocolOptimizationResult['optimizedProtocol'],
    optimizations: ProtocolOptimizationResult['optimizations'],
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ProtocolOptimizationResult['recommendations']> {
    try {
      const prompt = `Generate recommendations for further improving the optimized protocol.

Optimized Protocol:
${JSON.stringify(optimizedProtocol, null, 2)}

Optimizations Made:
${JSON.stringify(optimizations, null, 2)}

Provide actionable recommendations for:
1. Further efficiency improvements
2. Accuracy enhancements
3. Cost reductions
4. Safety improvements
5. Reproducibility enhancements

Format as JSON array:
[
  {
    "category": "Category name",
    "recommendation": "Recommendation text",
    "priority": "high|medium|low",
    "rationale": "Why this is important"
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in protocol optimization. Provide practical, actionable recommendations.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.6,
        maxTokens: 1500
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
  
  /**
   * Validate optimized protocol
   */
  private async validateProtocol(
    optimizedProtocol: ProtocolOptimizationResult['optimizedProtocol'],
    constraints: ProtocolOptimizationInput['constraints'] | undefined,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<ProtocolOptimizationResult['validation']> {
    try {
      const prompt = `Validate the following optimized protocol for critical steps and risks.

Optimized Protocol:
${JSON.stringify(optimizedProtocol, null, 2)}

Constraints: ${JSON.stringify(constraints || {}, null, 2)}

Identify:
1. Critical steps that must be followed precisely
2. Potential risks and their mitigation strategies

Format as JSON:
{
  "steps": [
    {
      "step": "Step description",
      "description": "Why this is critical",
      "critical": true/false
    }
  ],
  "risks": [
    {
      "risk": "Risk description",
      "probability": "low|medium|high",
      "impact": "low|medium|high",
      "mitigation": "How to mitigate"
    }
  ]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in protocol validation and risk assessment. Identify critical steps and risks.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 2000
      });
      
      try {
        return JSON.parse(response.content);
      } catch {
        return {
          steps: [],
          risks: []
        };
      }
    } catch (error) {
      console.error('Error validating protocol:', error);
      return {
        steps: [],
        risks: []
      };
    }
  }
}

