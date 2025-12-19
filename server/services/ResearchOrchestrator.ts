/**
 * Research Orchestrator
 * Task 11: Coordinates multiple agents for complex workflows
 * 
 * Manages multi-agent workflows, coordinates agent execution,
 * handles dependencies, and synthesizes results.
 */

import { Agent, AgentResult, AgentContext, AgentConfig } from './Agent.js';
import { AgentFactory } from './AgentFactory.js';
import { TaskAnalysis } from './TaskAnalysisEngine.js';
import { UserContext } from './UserContextRetriever.js';

export interface WorkflowTask {
  id: string;
  agentType: string;
  input: any;
  dependencies?: string[]; // IDs of tasks that must complete first
  config?: AgentConfig;
  priority?: number; // Higher priority = execute first (within dependency constraints)
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  tasks: Array<{
    taskId: string;
    agentType: string;
    success: boolean;
    result?: any;
    error?: string;
    duration?: number;
  }>;
  synthesizedResult: any;
  totalDuration: number;
  metadata?: {
    agentsUsed: string[];
    totalTokens?: number;
    estimatedCost?: number;
    error?: string;
  };
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  tasks: WorkflowTask[];
  synthesisStrategy?: 'sequential' | 'parallel' | 'hierarchical';
}

export class ResearchOrchestrator {
  private workflowId: string;
  private workflowDefinition: WorkflowDefinition;
  private context: AgentContext;
  private results: Map<string, AgentResult> = new Map();
  private executionOrder: string[] = [];
  
  constructor(workflowDefinition: WorkflowDefinition, context: AgentContext) {
    this.workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.workflowDefinition = workflowDefinition;
    this.context = context;
  }
  
  /**
   * Execute the entire workflow
   */
  async execute(): Promise<WorkflowResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Validate workflow
      this.validateWorkflow();
      
      // Step 2: Determine execution order (Task 12: Task decomposition)
      this.executionOrder = this.determineExecutionOrder();
      
      console.log(`🔄 Executing workflow: ${this.workflowDefinition.name}`);
      console.log(`   Execution order: ${this.executionOrder.join(' → ')}`);
      
      // Step 3: Execute tasks in order
      for (const taskId of this.executionOrder) {
        const task = this.workflowDefinition.tasks.find(t => t.id === taskId);
        if (!task) continue;
        
        console.log(`   📋 Executing task: ${task.agentType} (${taskId})`);
        
        try {
          const agent = AgentFactory.createAgent(task.agentType);
          
          // Prepare input with results from dependencies
          const enrichedInput = this.enrichTaskInput(task, agent);
          
          // Execute agent
          const taskStartTime = Date.now();
          const result = await agent.execute(
            enrichedInput,
            this.context,
            task.config
          );
          const taskDuration = Date.now() - taskStartTime;
          
          // Store result
          this.results.set(taskId, {
            ...result,
            metadata: {
              ...result.metadata,
              duration: taskDuration
            }
          });
          
          if (!result.success) {
            console.log(`   ⚠️ Task ${taskId} failed: ${result.error}`);
            // Continue with other tasks (non-blocking)
          } else {
            console.log(`   ✅ Task ${taskId} completed`);
          }
        } catch (error: any) {
          console.error(`   ❌ Error executing task ${taskId}:`, error);
          this.results.set(taskId, {
            success: false,
            content: null,
            error: error.message,
            metadata: {}
          });
        }
      }
      
      // Step 4: Synthesize results (Task 13: Result compilation)
      const synthesizedResult = this.synthesizeResults();
      
      const totalDuration = Date.now() - startTime;
      
      // Build workflow result
      const workflowResult: WorkflowResult = {
        success: this.allTasksSuccessful(),
        workflowId: this.workflowId,
        tasks: this.executionOrder.map(taskId => {
          const task = this.workflowDefinition.tasks.find(t => t.id === taskId)!;
          const result = this.results.get(taskId);
          return {
            taskId,
            agentType: task.agentType,
            success: result?.success || false,
            result: result?.content,
            error: result?.error,
            duration: result?.metadata?.duration
          };
        }),
        synthesizedResult,
        totalDuration,
        metadata: {
          agentsUsed: [...new Set(this.executionOrder.map(id => 
            this.workflowDefinition.tasks.find(t => t.id === id)?.agentType || ''
          ))],
          totalTokens: this.calculateTotalTokens(),
          estimatedCost: this.estimateTotalCost()
        }
      };
      
      console.log(`✅ Workflow completed in ${totalDuration}ms`);
      
      return workflowResult;
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      return {
        success: false,
        workflowId: this.workflowId,
        tasks: [],
        synthesizedResult: null,
        totalDuration: Date.now() - startTime,
        metadata: {
          agentsUsed: [],
          error: error.message
        }
      };
    }
  }
  
  /**
   * Task 12: Determine execution order based on dependencies
   */
  private determineExecutionOrder(): string[] {
    const tasks = this.workflowDefinition.tasks;
    const executionOrder: string[] = [];
    const completed = new Set<string>();
    const inProgress = new Set<string>();
    
    // Build dependency graph
    const dependencyGraph = new Map<string, Set<string>>();
    tasks.forEach(task => {
      dependencyGraph.set(task.id, new Set(task.dependencies || []));
    });
    
    // Topological sort
    while (executionOrder.length < tasks.length) {
      let foundTask = false;
      
      // Find tasks with no uncompleted dependencies
      for (const task of tasks) {
        if (completed.has(task.id) || inProgress.has(task.id)) continue;
        
        const dependencies = dependencyGraph.get(task.id) || new Set();
        const allDependenciesMet = Array.from(dependencies).every(depId => completed.has(depId));
        
        if (allDependenciesMet) {
          // Sort by priority (higher first)
          const insertIndex = executionOrder.findIndex(id => {
            const existingTask = tasks.find(t => t.id === id);
            return existingTask && (existingTask.priority || 0) < (task.priority || 0);
          });
          
          if (insertIndex === -1) {
            executionOrder.push(task.id);
          } else {
            executionOrder.splice(insertIndex, 0, task.id);
          }
          
          inProgress.add(task.id);
          foundTask = true;
          break;
        }
      }
      
      if (!foundTask) {
        // Check for circular dependencies
        const remaining = tasks.filter(t => !completed.has(t.id) && !inProgress.has(t.id));
        if (remaining.length > 0) {
          console.warn(`⚠️ Circular dependency detected or missing dependencies. Executing remaining tasks: ${remaining.map(t => t.id).join(', ')}`);
          remaining.forEach(task => {
            if (!executionOrder.includes(task.id)) {
              executionOrder.push(task.id);
            }
          });
        }
        break;
      }
    }
    
    return executionOrder;
  }
  
  /**
   * Enrich task input with results from dependencies
   */
  private enrichTaskInput(task: WorkflowTask, agent: Agent): any {
    let input = { ...task.input };
    
    // Add results from dependent tasks
    if (task.dependencies && task.dependencies.length > 0) {
      const dependencyResults: Record<string, any> = {};
      
      task.dependencies.forEach(depId => {
        const depResult = this.results.get(depId);
        if (depResult && depResult.success) {
          dependencyResults[depId] = depResult.content;
        }
      });
      
      // Add dependency results to input
      input = {
        ...input,
        dependencies: dependencyResults,
        previousResults: dependencyResults
      };
    }
    
    return input;
  }
  
  /**
   * Task 13: Synthesize results from all tasks
   */
  private synthesizeResults(): any {
    const strategy = this.workflowDefinition.synthesisStrategy || 'sequential';
    
    switch (strategy) {
      case 'sequential':
        return this.synthesizeSequential();
      
      case 'parallel':
        return this.synthesizeParallel();
      
      case 'hierarchical':
        return this.synthesizeHierarchical();
      
      default:
        return this.synthesizeSequential();
    }
  }
  
  /**
   * Sequential synthesis: Combine results in execution order
   */
  private synthesizeSequential(): any {
    const synthesized: any = {
      workflow: this.workflowDefinition.name,
      tasks: []
    };
    
    this.executionOrder.forEach(taskId => {
      const task = this.workflowDefinition.tasks.find(t => t.id === taskId);
      const result = this.results.get(taskId);
      
      if (task && result) {
        synthesized.tasks.push({
          task: task.agentType,
          success: result.success,
          result: result.content
        });
        
        // Merge key results into main object
        if (result.success && result.content) {
          Object.assign(synthesized, result.content);
        }
      }
    });
    
    return synthesized;
  }
  
  /**
   * Parallel synthesis: Combine all results equally
   */
  private synthesizeParallel(): any {
    const synthesized: any = {
      workflow: this.workflowDefinition.name,
      results: {}
    };
    
    this.executionOrder.forEach(taskId => {
      const task = this.workflowDefinition.tasks.find(t => t.id === taskId);
      const result = this.results.get(taskId);
      
      if (task && result && result.success) {
        synthesized.results[task.agentType] = result.content;
      }
    });
    
    return synthesized;
  }
  
  /**
   * Hierarchical synthesis: Build result hierarchy based on dependencies
   */
  private synthesizeHierarchical(): any {
    const synthesized: any = {
      workflow: this.workflowDefinition.name,
      structure: {}
    };
    
    // Build hierarchy based on dependencies
    this.executionOrder.forEach(taskId => {
      const task = this.workflowDefinition.tasks.find(t => t.id === taskId);
      const result = this.results.get(taskId);
      
      if (task && result && result.success) {
        if (task.dependencies && task.dependencies.length > 0) {
          // This task depends on others, add as child
          task.dependencies.forEach(depId => {
            const depTask = this.workflowDefinition.tasks.find(t => t.id === depId);
            if (depTask) {
              if (!synthesized.structure[depTask.agentType]) {
                synthesized.structure[depTask.agentType] = {
                  result: this.results.get(depId)?.content,
                  children: {}
                };
              }
              synthesized.structure[depTask.agentType].children[task.agentType] = result.content;
            }
          });
        } else {
          // Root level task
          synthesized.structure[task.agentType] = {
            result: result.content,
            children: {}
          };
        }
      }
    });
    
    return synthesized;
  }
  
  /**
   * Validate workflow definition
   */
  private validateWorkflow(): void {
    if (!this.workflowDefinition.tasks || this.workflowDefinition.tasks.length === 0) {
      throw new Error('Workflow must have at least one task');
    }
    
    // Validate all agent types are supported
    for (const task of this.workflowDefinition.tasks) {
      if (!AgentFactory.isAgentSupported(task.agentType)) {
        throw new Error(`Unsupported agent type: ${task.agentType}`);
      }
      
      // Validate dependencies exist
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!this.workflowDefinition.tasks.find(t => t.id === depId)) {
            throw new Error(`Dependency ${depId} not found in workflow tasks`);
          }
        }
      }
    }
  }
  
  /**
   * Check if all tasks were successful
   */
  private allTasksSuccessful(): boolean {
    return this.executionOrder.every(taskId => {
      const result = this.results.get(taskId);
      return result?.success === true;
    });
  }
  
  /**
   * Calculate total tokens used
   */
  private calculateTotalTokens(): number | undefined {
    let total = 0;
    let hasTokens = false;
    
    this.results.forEach(result => {
      if (result.metadata?.tokensUsed) {
        total += result.metadata.tokensUsed;
        hasTokens = true;
      }
    });
    
    return hasTokens ? total : undefined;
  }
  
  /**
   * Estimate total cost
   */
  private estimateTotalCost(): number | undefined {
    // Rough estimate based on tokens (would need provider pricing)
    const totalTokens = this.calculateTotalTokens();
    if (!totalTokens) return undefined;
    
    // Average estimate: $0.002 per 1K tokens
    return (totalTokens / 1000) * 0.002;
  }
  
  /**
   * Create a predefined workflow
   */
  static createPaperGenerationWorkflow(
    researchQuestion: string,
    data: any,
    context: AgentContext
  ): WorkflowDefinition {
    return {
      name: 'Paper Generation Workflow',
      description: 'Complete workflow from data analysis to paper generation',
      synthesisStrategy: 'sequential',
      tasks: [
        {
          id: 'data_analysis',
          agentType: 'data_analysis',
          input: { data, researchQuestion },
          priority: 1
        },
        {
          id: 'literature_review',
          agentType: 'literature_review',
          input: { topic: researchQuestion },
          priority: 1
        },
        {
          id: 'abstract_writing',
          agentType: 'abstract_writing',
          input: { content: 'Results from data analysis' },
          dependencies: ['data_analysis'],
          priority: 2
        },
        {
          id: 'paper_generation',
          agentType: 'content_writing', // Using content_writing as paper generation
          input: {
            title: `Research Paper: ${researchQuestion}`,
            sections: ['Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion']
          },
          dependencies: ['data_analysis', 'literature_review', 'abstract_writing'],
          priority: 3
        }
      ]
    };
  }
  
  /**
   * Create experiment design to execution workflow
   */
  static createExperimentWorkflow(
    researchQuestion: string,
    constraints: any,
    context: AgentContext
  ): WorkflowDefinition {
    return {
      name: 'Experiment Design to Execution Workflow',
      description: 'Design experiment, then analyze results',
      synthesisStrategy: 'sequential',
      tasks: [
        {
          id: 'experiment_design',
          agentType: 'experiment_design',
          input: { researchQuestion, constraints },
          priority: 1
        },
        {
          id: 'data_analysis',
          agentType: 'data_analysis',
          input: { data: 'Experimental data will be provided after execution' },
          dependencies: ['experiment_design'],
          priority: 2
        }
      ]
    };
  }
}

