/**
 * Autonomous Experiment Design Workflow
 * Task 18: Create autonomous experiment design workflow
 * 
 * An autonomous workflow that independently:
 * 1. Analyzes research question and constraints
 * 2. Designs optimal experimental protocol
 * 3. Identifies required resources and materials
 * 4. Generates detailed methodology
 * 5. Suggests validation and control strategies
 */

import { AgentFactory } from '../AgentFactory.js';
import { AgentContext } from '../Agent.js';
import { TaskAnalysisEngine } from '../TaskAnalysisEngine.js';
import { EnhancedRAGSystem } from '../EnhancedRAGSystem.js';

export interface AutonomousExperimentDesignInput {
  researchQuestion: string;
  hypothesis?: string;
  constraints?: {
    timeframe?: string; // e.g., "6 months", "1 year"
    budget?: number;
    resources?: string[]; // Available resources
    equipment?: string[]; // Available equipment
    expertise?: string[]; // User's expertise areas
    ethical?: string[]; // Ethical considerations
  };
  context?: {
    relatedExperiments?: string[]; // IDs of related experiments
    previousResults?: string; // Previous experimental results
    literature?: string; // Relevant literature context
  };
  designType?: 'laboratory' | 'field' | 'computational' | 'mixed';
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface AutonomousExperimentDesignResult {
  success: boolean;
  design: {
    title: string;
    researchQuestion: string;
    hypothesis: string;
    objectives: Array<{
      objective: string;
      priority: 'primary' | 'secondary';
      measurable: boolean;
    }>;
    methodology: {
      overview: string;
      design: string; // Experimental design type
      procedures: Array<{
        step: number;
        description: string;
        duration?: string;
        resources?: string[];
      }>;
      variables: {
        independent: Array<{
          name: string;
          type: string;
          levels?: string[];
          description: string;
        }>;
        dependent: Array<{
          name: string;
          type: string;
          measurement: string;
          description: string;
        }>;
        controlled: Array<{
          name: string;
          value: string;
          rationale: string;
        }>;
      };
      controls: Array<{
        type: string;
        description: string;
        purpose: string;
      }>;
      validation: Array<{
        method: string;
        description: string;
        purpose: string;
      }>;
    };
    resources: {
      materials: Array<{
        item: string;
        quantity: string;
        specifications?: string;
        cost?: number;
      }>;
      equipment: Array<{
        item: string;
        specifications: string;
        availability: 'available' | 'needed' | 'optional';
      }>;
      personnel: Array<{
        role: string;
        expertise: string[];
        timeCommitment: string;
      }>;
      timeline: Array<{
        phase: string;
        duration: string;
        tasks: string[];
        dependencies?: string[];
      }>;
      budget?: {
        total: number;
        breakdown: Record<string, number>;
      };
    };
    analysis: {
      statisticalMethods: Array<{
        method: string;
        purpose: string;
        software?: string;
      }>;
      sampleSize: {
        recommended: number;
        rationale: string;
        powerAnalysis?: string;
      };
      dataCollection: Array<{
        type: string;
        frequency: string;
        format: string;
      }>;
    };
    risks: Array<{
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    alternatives: Array<{
      alternative: string;
      description: string;
      pros: string[];
      cons: string[];
    }>;
  };
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  metadata: {
    designComplexity: string;
    estimatedDuration: string;
    estimatedCost?: number;
    feasibility: 'high' | 'medium' | 'low';
  };
  workflow: {
    steps: Array<{
      step: string;
      agent: string;
      status: 'completed' | 'failed' | 'skipped';
      duration?: number;
    }>;
    totalDuration: number;
  };
}

export class AutonomousExperimentDesignWorkflow {
  /**
   * Execute autonomous experiment design
   */
  async execute(
    input: AutonomousExperimentDesignInput,
    userId: string,
    context: AgentContext
  ): Promise<AutonomousExperimentDesignResult> {
    const startTime = Date.now();
    const workflowSteps: AutonomousExperimentDesignResult['workflow']['steps'] = [];
    
    try {
      // Step 1: Analyze research question and constraints
      const stepStart = Date.now();
      let analysis: any = null;
      try {
        const taskAnalysis = await TaskAnalysisEngine.analyzeTask(
          `Design experiment for: ${input.researchQuestion}`
        );
        
        // Get user context
        const userContext = await EnhancedRAGSystem.retrieveEnhancedContext(userId, input.researchQuestion);
        
        analysis = {
          taskType: taskAnalysis.taskType,
          parameters: taskAnalysis.parameters,
          userContext: userContext.user
        };
        
        workflowSteps.push({
          step: 'Analyze Research Question',
          agent: 'TaskAnalysisEngine',
          status: 'completed',
          duration: Date.now() - stepStart
        });
      } catch (error) {
        console.error('Error analyzing research question:', error);
        workflowSteps.push({
          step: 'Analyze Research Question',
          agent: 'TaskAnalysisEngine',
          status: 'failed',
          duration: Date.now() - stepStart
        });
      }
      
      // Step 2: Design experiment using ExperimentDesignAgent
      const stepStart2 = Date.now();
      let experimentDesign: any = null;
      try {
        const experimentDesignAgent = AgentFactory.createAgent('experiment_design');
        
        const designInput = {
          researchQuestion: input.researchQuestion,
          hypothesis: input.hypothesis,
          type: input.designType || 'laboratory',
          constraints: input.constraints || {},
          context: input.context
        };
        
        const result = await experimentDesignAgent.execute(designInput, context);
        
        if (result.success) {
          experimentDesign = result.content;
          workflowSteps.push({
            step: 'Design Experiment',
            agent: 'ExperimentDesignAgent',
            status: 'completed',
            duration: Date.now() - stepStart2
          });
        } else {
          throw new Error(result.error || 'Failed to design experiment');
        }
      } catch (error: any) {
        console.error('Error designing experiment:', error);
        workflowSteps.push({
          step: 'Design Experiment',
          agent: 'ExperimentDesignAgent',
          status: 'failed',
          duration: Date.now() - stepStart2
        });
        throw error;
      }
      
      // Step 3: Enhance design with resource planning and validation
      const stepStart3 = Date.now();
      let enhancedDesign: any = null;
      try {
        const apiAssignment = await this.getApiAssignment(userId, 'content_writing');
        if (!apiAssignment) {
          throw new Error('No API configured for content writing');
        }
        
        const { AIProviderFactory } = await import('../AIProviderFactory.js');
        const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
        
        const enhancementPrompt = `Enhance the following experiment design with detailed resource planning, validation strategies, and risk analysis.

Research Question: ${input.researchQuestion}
Hypothesis: ${input.hypothesis || 'Not specified'}
Constraints: ${JSON.stringify(input.constraints || {})}
Experiment Design: ${JSON.stringify(experimentDesign?.design || {}, null, 2)}

Provide:
1. Detailed resource requirements (materials, equipment, personnel)
2. Timeline with phases and dependencies
3. Budget breakdown (if applicable)
4. Statistical analysis methods
5. Sample size recommendations with power analysis
6. Risk assessment and mitigation strategies
7. Alternative approaches

Format as JSON:
{
  "resources": {
    "materials": [...],
    "equipment": [...],
    "personnel": [...],
    "timeline": [...],
    "budget": {...}
  },
  "analysis": {
    "statisticalMethods": [...],
    "sampleSize": {...},
    "dataCollection": [...]
  },
  "risks": [...],
  "alternatives": [...]
}`;
        
        const response = await aiProvider.chat([
          { role: 'system', content: 'You are an expert in experimental design and research methodology. Provide comprehensive, detailed enhancements in JSON format.' },
          { role: 'user', content: enhancementPrompt }
        ], {
          apiKey: apiAssignment.apiKey,
          temperature: 0.5,
          maxTokens: 3000
        });
        
        try {
          enhancedDesign = JSON.parse(response.content);
        } catch {
          // Fallback enhancement
          enhancedDesign = {
            resources: {
              materials: [],
              equipment: [],
              personnel: [],
              timeline: [],
              budget: undefined
            },
            analysis: {
              statisticalMethods: [],
              sampleSize: { recommended: 30, rationale: 'Standard sample size' },
              dataCollection: []
            },
            risks: [],
            alternatives: []
          };
        }
        
        workflowSteps.push({
          step: 'Enhance Design',
          agent: 'AIProvider',
          status: 'completed',
          duration: Date.now() - stepStart3
        });
      } catch (error) {
        console.error('Error enhancing design:', error);
        enhancedDesign = {
          resources: {
            materials: [],
            equipment: [],
            personnel: [],
            timeline: [],
            budget: undefined
          },
          analysis: {
            statisticalMethods: [],
            sampleSize: { recommended: 30, rationale: 'Standard sample size' },
            dataCollection: []
          },
          risks: [],
          alternatives: []
        };
        workflowSteps.push({
          step: 'Enhance Design',
          agent: 'AIProvider',
          status: 'failed',
          duration: Date.now() - stepStart3
        });
      }
      
      // Step 4: Generate recommendations
      const stepStart4 = Date.now();
      let recommendations: AutonomousExperimentDesignResult['recommendations'] = [];
      try {
        const apiAssignment = await this.getApiAssignment(userId, 'content_writing');
        if (apiAssignment) {
          const { AIProviderFactory } = await import('../AIProviderFactory.js');
          const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
          
          const recommendationPrompt = `Generate recommendations for improving the following experiment design.

Research Question: ${input.researchQuestion}
Experiment Design: ${JSON.stringify(experimentDesign?.design || {}, null, 2)}
Resources: ${JSON.stringify(enhancedDesign?.resources || {}, null, 2)}
Constraints: ${JSON.stringify(input.constraints || {})}

Provide actionable recommendations organized by category (methodology, resources, timeline, validation, etc.).

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
            { role: 'system', content: 'You are an expert research advisor. Provide practical, actionable recommendations.' },
            { role: 'user', content: recommendationPrompt }
          ], {
            apiKey: apiAssignment.apiKey,
            temperature: 0.6,
            maxTokens: 2000
          });
          
          try {
            recommendations = JSON.parse(response.content);
          } catch {
            recommendations = [];
          }
        }
        
        workflowSteps.push({
          step: 'Generate Recommendations',
          agent: 'AIProvider',
          status: 'completed',
          duration: Date.now() - stepStart4
        });
      } catch (error) {
        console.error('Error generating recommendations:', error);
        workflowSteps.push({
          step: 'Generate Recommendations',
          agent: 'AIProvider',
          status: 'failed',
          duration: Date.now() - stepStart4
        });
      }
      
      // Calculate metadata
      const estimatedDuration = this.estimateDuration(enhancedDesign?.resources?.timeline || []);
      const estimatedCost = enhancedDesign?.resources?.budget?.total || 0;
      const feasibility = this.assessFeasibility(input.constraints, enhancedDesign);
      
      // Build final result
      const result: AutonomousExperimentDesignResult = {
        success: true,
        design: {
          title: experimentDesign?.design?.title || `Experiment: ${input.researchQuestion}`,
          researchQuestion: input.researchQuestion,
          hypothesis: input.hypothesis || experimentDesign?.design?.hypothesis || 'To be determined',
          objectives: experimentDesign?.design?.objectives || [],
          methodology: {
            overview: experimentDesign?.design?.overview || '',
            design: experimentDesign?.design?.designType || input.designType || 'laboratory',
            procedures: experimentDesign?.design?.procedures || [],
            variables: experimentDesign?.design?.variables || {
              independent: [],
              dependent: [],
              controlled: []
            },
            controls: experimentDesign?.design?.controls || [],
            validation: enhancedDesign?.validation || []
          },
          resources: {
            materials: enhancedDesign?.resources?.materials || [],
            equipment: enhancedDesign?.resources?.equipment || [],
            personnel: enhancedDesign?.resources?.personnel || [],
            timeline: enhancedDesign?.resources?.timeline || [],
            budget: enhancedDesign?.resources?.budget
          },
          analysis: {
            statisticalMethods: enhancedDesign?.analysis?.statisticalMethods || [],
            sampleSize: enhancedDesign?.analysis?.sampleSize || {
              recommended: 30,
              rationale: 'Standard sample size for statistical power'
            },
            dataCollection: enhancedDesign?.analysis?.dataCollection || []
          },
          risks: enhancedDesign?.risks || [],
          alternatives: enhancedDesign?.alternatives || []
        },
        recommendations,
        metadata: {
          designComplexity: input.complexity || 'moderate',
          estimatedDuration,
          estimatedCost: estimatedCost > 0 ? estimatedCost : undefined,
          feasibility
        },
        workflow: {
          steps: workflowSteps,
          totalDuration: Date.now() - startTime
        }
      };
      
      return result;
    } catch (error: any) {
      console.error('Error in AutonomousExperimentDesignWorkflow:', error);
      throw error;
    }
  }
  
  /**
   * Estimate duration from timeline
   */
  private estimateDuration(timeline: Array<{ duration: string }>): string {
    if (timeline.length === 0) {
      return 'To be determined';
    }
    
    // Simple estimation - sum up durations (simplified)
    return timeline.map(t => t.duration).join(', ') || 'To be determined';
  }
  
  /**
   * Assess feasibility
   */
  private assessFeasibility(
    constraints: AutonomousExperimentDesignInput['constraints'],
    enhancedDesign: any
  ): 'high' | 'medium' | 'low' {
    if (!constraints) return 'high';
    
    let score = 0;
    
    // Check budget
    if (constraints.budget && enhancedDesign?.resources?.budget?.total) {
      if (enhancedDesign.resources.budget.total <= constraints.budget) {
        score += 2;
      } else if (enhancedDesign.resources.budget.total <= constraints.budget * 1.2) {
        score += 1;
      }
    } else {
      score += 2; // No budget constraint
    }
    
    // Check resources
    if (constraints.resources && enhancedDesign?.resources?.materials) {
      const requiredResources = enhancedDesign.resources.materials.map((m: any) => m.item);
      const availableResources = constraints.resources;
      const missingResources = requiredResources.filter((r: string) => 
        !availableResources.some(ar => ar.toLowerCase().includes(r.toLowerCase()))
      );
      
      if (missingResources.length === 0) {
        score += 2;
      } else if (missingResources.length <= 2) {
        score += 1;
      }
    } else {
      score += 2; // No resource constraint
    }
    
    // Check equipment
    if (constraints.equipment && enhancedDesign?.resources?.equipment) {
      const neededEquipment = enhancedDesign.resources.equipment
        .filter((e: any) => e.availability === 'needed')
        .map((e: any) => e.item);
      const availableEquipment = constraints.equipment;
      const missingEquipment = neededEquipment.filter((e: string) =>
        !availableEquipment.some(ae => ae.toLowerCase().includes(e.toLowerCase()))
      );
      
      if (missingEquipment.length === 0) {
        score += 2;
      } else if (missingEquipment.length <= 1) {
        score += 1;
      }
    } else {
      score += 2; // No equipment constraint
    }
    
    // Score interpretation
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
  
  /**
   * Get API assignment for task
   */
  private async getApiAssignment(userId: string, taskType: string): Promise<{ provider: string; apiKey: string } | null> {
    try {
      const { getApiForTask } = await import('../../routes/apiTaskAssignments.js');
      return await getApiForTask(userId, taskType);
    } catch {
      return null;
    }
  }
}

