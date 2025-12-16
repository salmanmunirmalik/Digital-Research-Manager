/**
 * Workflow Progress Tracker
 * Task 76: Tracks multi-step workflow progress
 * 
 * Tracks the progress of multi-step workflows, providing real-time updates
 * on task completion, failures, and overall workflow status.
 */

import { EventEmitter } from 'events';

export interface WorkflowProgress {
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    stepId: string;
    stepName: string;
    agent: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    progress?: number; // 0-100
    startTime?: number;
    endTime?: number;
    duration?: number;
    error?: string;
    result?: any;
  }>;
  overallProgress: number; // 0-100
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  metadata?: {
    estimatedTimeRemaining?: number;
    tokensUsed?: number;
    estimatedCost?: number;
  };
}

export interface ProgressUpdate {
  workflowId: string;
  stepId: string;
  status: 'started' | 'progress' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  message?: string;
  error?: string;
  result?: any;
}

export class WorkflowProgressTracker extends EventEmitter {
  private workflows: Map<string, WorkflowProgress> = new Map();
  
  /**
   * Initialize workflow tracking
   */
  initializeWorkflow(
    workflowId: string,
    workflowName: string,
    steps: Array<{ stepId: string; stepName: string; agent: string }>
  ): WorkflowProgress {
    const progress: WorkflowProgress = {
      workflowId,
      workflowName,
      status: 'pending',
      currentStep: 0,
      totalSteps: steps.length,
      steps: steps.map(step => ({
        stepId: step.stepId,
        stepName: step.stepName,
        agent: step.agent,
        status: 'pending'
      })),
      overallProgress: 0,
      startTime: Date.now()
    };
    
    this.workflows.set(workflowId, progress);
    this.emit('workflow:initialized', progress);
    
    return progress;
  }
  
  /**
   * Start workflow execution
   */
  startWorkflow(workflowId: string): void {
    const progress = this.workflows.get(workflowId);
    if (!progress) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    progress.status = 'running';
    progress.startTime = Date.now();
    
    this.workflows.set(workflowId, progress);
    this.emit('workflow:started', progress);
  }
  
  /**
   * Update step progress
   */
  updateStep(update: ProgressUpdate): void {
    const progress = this.workflows.get(update.workflowId);
    if (!progress) {
      console.warn(`Workflow ${update.workflowId} not found for step update`);
      return;
    }
    
    const step = progress.steps.find(s => s.stepId === update.stepId);
    if (!step) {
      console.warn(`Step ${update.stepId} not found in workflow ${update.workflowId}`);
      return;
    }
    
    // Update step status
    switch (update.status) {
      case 'started':
        step.status = 'running';
        step.startTime = Date.now();
        step.progress = 0;
        break;
      
      case 'progress':
        step.status = 'running';
        step.progress = update.progress || step.progress;
        break;
      
      case 'completed':
        step.status = 'completed';
        step.progress = 100;
        step.endTime = Date.now();
        step.duration = step.endTime - (step.startTime || Date.now());
        step.result = update.result;
        break;
      
      case 'failed':
        step.status = 'failed';
        step.endTime = Date.now();
        step.duration = step.endTime - (step.startTime || Date.now());
        step.error = update.error;
        break;
      
      case 'skipped':
        step.status = 'skipped';
        step.progress = 0;
        break;
    }
    
    // Update current step
    const completedSteps = progress.steps.filter(s => 
      s.status === 'completed' || s.status === 'skipped'
    ).length;
    progress.currentStep = completedSteps;
    
    // Calculate overall progress
    const totalProgress = progress.steps.reduce((sum, s) => {
      if (s.status === 'completed') return sum + 100;
      if (s.status === 'skipped') return sum + 0;
      return sum + (s.progress || 0);
    }, 0);
    progress.overallProgress = Math.round(totalProgress / progress.totalSteps);
    
    // Update metadata
    if (update.status === 'started' || update.status === 'progress') {
      progress.metadata = {
        ...progress.metadata,
        estimatedTimeRemaining: this.estimateTimeRemaining(progress)
      };
    }
    
    this.workflows.set(update.workflowId, progress);
    this.emit('step:updated', { workflowId: update.workflowId, step, progress });
    this.emit('progress:updated', progress);
  }
  
  /**
   * Complete workflow
   */
  completeWorkflow(workflowId: string, success: boolean = true): WorkflowProgress {
    const progress = this.workflows.get(workflowId);
    if (!progress) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    progress.status = success ? 'completed' : 'failed';
    progress.endTime = Date.now();
    progress.totalDuration = progress.endTime - progress.startTime;
    progress.overallProgress = 100;
    
    // Ensure all steps are marked
    progress.steps.forEach(step => {
      if (step.status === 'pending' || step.status === 'running') {
        step.status = success ? 'skipped' : 'failed';
        step.endTime = Date.now();
        if (step.startTime) {
          step.duration = step.endTime - step.startTime;
        }
      }
    });
    
    this.workflows.set(workflowId, progress);
    this.emit('workflow:completed', progress);
    
    return progress;
  }
  
  /**
   * Cancel workflow
   */
  cancelWorkflow(workflowId: string): WorkflowProgress {
    const progress = this.workflows.get(workflowId);
    if (!progress) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    progress.status = 'cancelled';
    progress.endTime = Date.now();
    progress.totalDuration = progress.endTime - progress.startTime;
    
    // Mark running steps as cancelled
    progress.steps.forEach(step => {
      if (step.status === 'running' || step.status === 'pending') {
        step.status = 'skipped';
        step.endTime = Date.now();
        if (step.startTime) {
          step.duration = step.endTime - step.startTime;
        }
      }
    });
    
    this.workflows.set(workflowId, progress);
    this.emit('workflow:cancelled', progress);
    
    return progress;
  }
  
  /**
   * Get workflow progress
   */
  getProgress(workflowId: string): WorkflowProgress | undefined {
    return this.workflows.get(workflowId);
  }
  
  /**
   * Get all active workflows
   */
  getActiveWorkflows(): WorkflowProgress[] {
    return Array.from(this.workflows.values()).filter(
      w => w.status === 'running' || w.status === 'pending'
    );
  }
  
  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowProgress[] {
    return Array.from(this.workflows.values());
  }
  
  /**
   * Clear completed workflows (cleanup)
   */
  clearCompletedWorkflows(olderThanMs: number = 3600000): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.workflows.forEach((progress, workflowId) => {
      if (
        (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') &&
        progress.endTime &&
        (now - progress.endTime) > olderThanMs
      ) {
        toDelete.push(workflowId);
      }
    });
    
    toDelete.forEach(id => this.workflows.delete(id));
    this.emit('workflows:cleaned', { count: toDelete.length });
  }
  
  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(progress: WorkflowProgress): number | undefined {
    const completedSteps = progress.steps.filter(s => s.status === 'completed' && s.duration);
    
    if (completedSteps.length === 0) {
      return undefined;
    }
    
    const avgStepDuration = completedSteps.reduce((sum, s) => 
      sum + (s.duration || 0), 0
    ) / completedSteps.length;
    
    const remainingSteps = progress.totalSteps - progress.currentStep;
    return Math.round(avgStepDuration * remainingSteps);
  }
  
  /**
   * Update metadata (tokens, cost, etc.)
   */
  updateMetadata(workflowId: string, metadata: Partial<WorkflowProgress['metadata']>): void {
    const progress = this.workflows.get(workflowId);
    if (!progress) {
      return;
    }
    
    progress.metadata = {
      ...progress.metadata,
      ...metadata
    };
    
    this.workflows.set(workflowId, progress);
    this.emit('metadata:updated', { workflowId, metadata: progress.metadata });
  }
}

// Singleton instance
export const workflowProgressTracker = new WorkflowProgressTracker();

