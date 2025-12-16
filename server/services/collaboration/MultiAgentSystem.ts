/**
 * Multi-Agent System
 * Task 23: Implement MultiAgentSystem for collaboration
 * 
 * Enables multiple agents to collaborate on complex tasks by:
 * - Sharing information and results
 * - Coordinating actions
 * - Resolving conflicts
 * - Synthesizing collective knowledge
 */

import { Agent, AgentResult, AgentContext } from '../Agent.js';
import { AgentFactory } from '../AgentFactory.js';
import { EventEmitter } from 'events';

export interface AgentMessage {
  from: string; // Agent type
  to: string | 'broadcast'; // Target agent or broadcast to all
  type: 'request' | 'response' | 'notification' | 'query' | 'result';
  content: any;
  timestamp: number;
  messageId: string;
  correlationId?: string; // For request-response pairs
}

export interface AgentCapability {
  agentType: string;
  capabilities: string[]; // What this agent can do
  expertise: string[]; // Areas of expertise
  availability: 'available' | 'busy' | 'unavailable';
  currentTask?: string;
}

export interface CollaborationTask {
  taskId: string;
  description: string;
  requiredCapabilities: string[];
  assignedAgents: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: Map<string, AgentResult>;
  dependencies: string[]; // Other task IDs this depends on
}

export interface CollaborationResult {
  success: boolean;
  taskId: string;
  results: Map<string, AgentResult>;
  synthesizedResult: any;
  collaborationLog: AgentMessage[];
  metadata: {
    agentsInvolved: string[];
    totalMessages: number;
    duration: number;
  };
}

export class MultiAgentSystem extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private agentCapabilities: Map<string, AgentCapability> = new Map();
  private messageQueue: AgentMessage[] = [];
  private activeCollaborations: Map<string, CollaborationTask> = new Map();
  private messageHistory: AgentMessage[] = [];
  
  /**
   * Register an agent in the system
   */
  registerAgent(agentType: string, agent: Agent, capabilities: AgentCapability): void {
    this.agents.set(agentType, agent);
    this.agentCapabilities.set(agentType, capabilities);
    this.emit('agent:registered', { agentType, capabilities });
  }
  
  /**
   * Get agent by type
   */
  getAgent(agentType: string): Agent | undefined {
    return this.agents.get(agentType);
  }
  
  /**
   * Get all registered agents
   */
  getAllAgents(): string[] {
    return Array.from(this.agents.keys());
  }
  
  /**
   * Get agent capabilities
   */
  getAgentCapabilities(agentType: string): AgentCapability | undefined {
    return this.agentCapabilities.get(agentType);
  }
  
  /**
   * Find agents with specific capabilities
   */
  findAgentsByCapability(capability: string): string[] {
    const matchingAgents: string[] = [];
    
    this.agentCapabilities.forEach((cap, agentType) => {
      if (cap.capabilities.includes(capability) || cap.expertise.includes(capability)) {
        matchingAgents.push(agentType);
      }
    });
    
    return matchingAgents;
  }
  
  /**
   * Send message between agents
   */
  sendMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    this.messageHistory.push(message);
    
    // Emit event for message handling
    this.emit('message:sent', message);
    
    // Process message if target is specific
    if (message.to !== 'broadcast') {
      this.processMessage(message);
    } else {
      // Broadcast to all agents
      this.agents.forEach((agent, agentType) => {
        if (agentType !== message.from) {
          this.processMessage({ ...message, to: agentType });
        }
      });
    }
  }
  
  /**
   * Process a message
   */
  private processMessage(message: AgentMessage): void {
    const targetAgent = this.agents.get(message.to);
    if (!targetAgent) {
      console.warn(`Agent ${message.to} not found for message ${message.messageId}`);
      return;
    }
    
    // Emit event for message received
    this.emit('message:received', { message, agent: message.to });
    
    // Handle different message types
    switch (message.type) {
      case 'request':
        this.handleRequest(message);
        break;
      case 'query':
        this.handleQuery(message);
        break;
      case 'notification':
        this.handleNotification(message);
        break;
      default:
        // Response and result messages are handled by the sender
        break;
    }
  }
  
  /**
   * Handle request message
   */
  private async handleRequest(message: AgentMessage): Promise<void> {
    // In a full implementation, this would trigger the target agent to process the request
    // For now, we emit an event that can be handled by workflow orchestrators
    this.emit('agent:request', message);
  }
  
  /**
   * Handle query message
   */
  private handleQuery(message: AgentMessage): void {
    // Agents can query each other for information
    this.emit('agent:query', message);
  }
  
  /**
   * Handle notification message
   */
  private handleNotification(message: AgentMessage): void {
    // Agents can notify each other of events or state changes
    this.emit('agent:notification', message);
  }
  
  /**
   * Initiate collaboration between multiple agents
   */
  async initiateCollaboration(
    taskId: string,
    description: string,
    requiredCapabilities: string[],
    agentTypes: string[],
    context: AgentContext
  ): Promise<CollaborationTask> {
    // Validate agents are available
    const availableAgents = agentTypes.filter(agentType => {
      const cap = this.agentCapabilities.get(agentType);
      return cap && cap.availability === 'available';
    });
    
    if (availableAgents.length === 0) {
      throw new Error('No available agents for collaboration');
    }
    
    // Create collaboration task
    const collaboration: CollaborationTask = {
      taskId,
      description,
      requiredCapabilities,
      assignedAgents: availableAgents,
      status: 'in_progress',
      results: new Map(),
      dependencies: []
    };
    
    this.activeCollaborations.set(taskId, collaboration);
    
    // Mark agents as busy
    availableAgents.forEach(agentType => {
      const cap = this.agentCapabilities.get(agentType);
      if (cap) {
        cap.availability = 'busy';
        cap.currentTask = taskId;
      }
    });
    
    this.emit('collaboration:started', collaboration);
    
    return collaboration;
  }
  
  /**
   * Submit result from an agent in a collaboration
   */
  submitCollaborationResult(
    taskId: string,
    agentType: string,
    result: AgentResult
  ): void {
    const collaboration = this.activeCollaborations.get(taskId);
    if (!collaboration) {
      throw new Error(`Collaboration ${taskId} not found`);
    }
    
    collaboration.results.set(agentType, result);
    
    // Check if all agents have completed
    const allCompleted = collaboration.assignedAgents.every(agentType =>
      collaboration.results.has(agentType)
    );
    
    if (allCompleted) {
      collaboration.status = 'completed';
      this.completeCollaboration(taskId);
    }
    
    this.emit('collaboration:result', { taskId, agentType, result });
  }
  
  /**
   * Complete collaboration and synthesize results
   */
  private completeCollaboration(taskId: string): void {
    const collaboration = this.activeCollaborations.get(taskId);
    if (!collaboration) return;
    
    // Synthesize results from all agents
    const synthesizedResult = this.synthesizeCollaborationResults(collaboration);
    
    // Mark agents as available
    collaboration.assignedAgents.forEach(agentType => {
      const cap = this.agentCapabilities.get(agentType);
      if (cap) {
        cap.availability = 'available';
        cap.currentTask = undefined;
      }
    });
    
    // Create collaboration result
    const result: CollaborationResult = {
      success: collaboration.results.size > 0 && 
               Array.from(collaboration.results.values()).every(r => r.success),
      taskId,
      results: collaboration.results,
      synthesizedResult,
      collaborationLog: this.messageHistory.filter(m => 
        m.content?.taskId === taskId
      ),
      metadata: {
        agentsInvolved: collaboration.assignedAgents,
        totalMessages: this.messageHistory.filter(m => 
          m.content?.taskId === taskId
        ).length,
        duration: 0 // Would track actual duration
      }
    };
    
    this.activeCollaborations.delete(taskId);
    this.emit('collaboration:completed', result);
  }
  
  /**
   * Synthesize results from multiple agents
   */
  private synthesizeCollaborationResults(collaboration: CollaborationTask): any {
    const results: any = {
      collaboration: collaboration.description,
      agents: collaboration.assignedAgents,
      results: {}
    };
    
    collaboration.results.forEach((result, agentType) => {
      results.results[agentType] = result.content;
    });
    
    // Merge key results
    const allResults = Array.from(collaboration.results.values());
    if (allResults.length > 0) {
      // Try to merge common structures
      const merged: any = {};
      allResults.forEach(result => {
        if (result.success && result.content) {
          Object.assign(merged, result.content);
        }
      });
      results.merged = merged;
    }
    
    return results;
  }
  
  /**
   * Get active collaborations
   */
  getActiveCollaborations(): CollaborationTask[] {
    return Array.from(this.activeCollaborations.values());
  }
  
  /**
   * Get collaboration by ID
   */
  getCollaboration(taskId: string): CollaborationTask | undefined {
    return this.activeCollaborations.get(taskId);
  }
  
  /**
   * Query agent for information
   */
  async queryAgent(
    fromAgent: string,
    toAgent: string,
    query: string,
    context?: any
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      from: fromAgent,
      to: toAgent,
      type: 'query',
      content: { query, context },
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.sendMessage(message);
    
    // Wait for response (in a real implementation, this would be async)
    return new Promise((resolve) => {
      const handler = (response: AgentMessage) => {
        if (response.correlationId === message.messageId) {
          this.off('message:response', handler);
          resolve(response);
        }
      };
      this.on('message:response', handler);
    });
  }
  
  /**
   * Initialize system with default agents
   */
  initializeDefaultAgents(): void {
    const defaultAgents = [
      'paper_finding',
      'abstract_writing',
      'idea_generation',
      'proposal_writing',
      'literature_review',
      'experiment_design',
      'data_analysis',
      'data_reading',
      'paper_writing',
      'figure_generation',
      'reference_management',
      'draft_compilation',
      'presentation_slide',
      'quality_validation',
      'output_formatting'
    ];
    
    defaultAgents.forEach(agentType => {
      try {
        const agent = AgentFactory.createAgent(agentType);
        const capabilities = this.inferCapabilities(agentType);
        this.registerAgent(agentType, agent, capabilities);
      } catch (error) {
        console.warn(`Failed to register agent ${agentType}:`, error);
      }
    });
  }
  
  /**
   * Infer capabilities from agent type
   */
  private inferCapabilities(agentType: string): AgentCapability {
    const capabilityMap: Record<string, AgentCapability> = {
      'paper_finding': {
        agentType,
        capabilities: ['search', 'find', 'discover'],
        expertise: ['literature', 'research', 'papers'],
        availability: 'available'
      },
      'abstract_writing': {
        agentType,
        capabilities: ['write', 'summarize', 'abstract'],
        expertise: ['writing', 'summarization'],
        availability: 'available'
      },
      'data_analysis': {
        agentType,
        capabilities: ['analyze', 'statistics', 'insights'],
        expertise: ['data', 'statistics', 'analysis'],
        availability: 'available'
      },
      'experiment_design': {
        agentType,
        capabilities: ['design', 'plan', 'methodology'],
        expertise: ['experiments', 'methodology', 'design'],
        availability: 'available'
      },
      'paper_writing': {
        agentType,
        capabilities: ['write', 'compose', 'structure'],
        expertise: ['writing', 'papers', 'academic'],
        availability: 'available'
      }
    };
    
    return capabilityMap[agentType] || {
      agentType,
      capabilities: ['process', 'execute'],
      expertise: [agentType],
      availability: 'available'
    };
  }
}

// Singleton instance
export const multiAgentSystem = new MultiAgentSystem();

