/**
 * Agent Negotiation Mechanisms
 * Task 25: Create agent negotiation mechanisms
 * 
 * Enables agents to negotiate:
 * - Task assignment
 * - Resource allocation
 * - Conflict resolution
 * - Priority determination
 * - Collaboration terms
 */

import { AgentMessage } from './MultiAgentSystem.js';
import { AgentCommunicationProtocol } from './AgentCommunicationProtocol.js';
import { EventEmitter } from 'events';

export type NegotiationType = 
  | 'task_assignment'
  | 'resource_allocation'
  | 'conflict_resolution'
  | 'priority'
  | 'collaboration_terms';

export type NegotiationStatus = 
  | 'initiated'
  | 'proposed'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'timeout'
  | 'cancelled';

export interface NegotiationProposal {
  proposalId: string;
  negotiationId: string;
  from: string; // Agent proposing
  to: string; // Agent receiving proposal
  type: NegotiationType;
  terms: any; // Proposal terms (varies by type)
  priority: number; // 0-100
  timestamp: number;
  expiresAt?: number;
}

export interface Negotiation {
  negotiationId: string;
  type: NegotiationType;
  participants: string[];
  initiator: string;
  status: NegotiationStatus;
  proposals: NegotiationProposal[];
  currentProposal?: NegotiationProposal;
  acceptedProposal?: NegotiationProposal;
  history: Array<{
    action: string;
    agent: string;
    timestamp: number;
    details?: any;
  }>;
  deadline?: number;
  metadata?: any;
}

export interface TaskAssignmentProposal {
  taskId: string;
  taskDescription: string;
  requiredCapabilities: string[];
  estimatedDuration: number;
  priority: number;
  compensation?: any; // Resource allocation, etc.
}

export interface ResourceAllocationProposal {
  resourceType: string;
  resourceId: string;
  quantity: number;
  duration: number;
  priority: number;
}

export interface ConflictResolutionProposal {
  conflictId: string;
  conflictDescription: string;
  proposedSolution: string;
  alternatives: string[];
  rationale: string;
}

export class AgentNegotiation extends EventEmitter {
  private negotiations: Map<string, Negotiation> = new Map();
  private communicationProtocol: AgentCommunicationProtocol;
  
  constructor(communicationProtocol: AgentCommunicationProtocol) {
    super();
    this.communicationProtocol = communicationProtocol;
    this.setupMessageHandlers();
  }
  
  /**
   * Setup message handlers for negotiation
   */
  private setupMessageHandlers(): void {
    this.communicationProtocol.on('message:received', (data: { message: AgentMessage }) => {
      if (data.message.content?.negotiationId) {
        this.handleNegotiationMessage(data.message);
      }
    });
  }
  
  /**
   * Initiate a negotiation
   */
  initiateNegotiation(
    type: NegotiationType,
    initiator: string,
    participants: string[],
    initialProposal: any,
    options?: {
      deadline?: number;
      timeout?: number;
      metadata?: any;
    }
  ): Negotiation {
    const negotiationId = `neg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const negotiation: Negotiation = {
      negotiationId,
      type,
      participants: [initiator, ...participants],
      initiator,
      status: 'initiated',
      proposals: [],
      history: [{
        action: 'initiated',
        agent: initiator,
        timestamp: Date.now()
      }],
      deadline: options?.deadline,
      metadata: options?.metadata
    };
    
    this.negotiations.set(negotiationId, negotiation);
    
    // Create initial proposal
    const proposal = this.createProposal(
      negotiationId,
      initiator,
      participants[0],
      type,
      initialProposal
    );
    
    negotiation.proposals.push(proposal);
    negotiation.currentProposal = proposal;
    negotiation.status = 'proposed';
    
    // Send proposal to participants
    this.sendProposal(proposal);
    
    this.emit('negotiation:initiated', negotiation);
    
    return negotiation;
  }
  
  /**
   * Create a proposal
   */
  createProposal(
    negotiationId: string,
    from: string,
    to: string,
    type: NegotiationType,
    terms: any,
    options?: {
      priority?: number;
      expiresAt?: number;
    }
  ): NegotiationProposal {
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      proposalId,
      negotiationId,
      from,
      to,
      type,
      terms,
      priority: options?.priority || 50,
      timestamp: Date.now(),
      expiresAt: options?.expiresAt
    };
  }
  
  /**
   * Send proposal to agent
   */
  private sendProposal(proposal: NegotiationProposal): void {
    const message = this.communicationProtocol.createRequest(
      proposal.from,
      proposal.to,
      {
        type: 'negotiation_proposal',
        proposal
      },
      {
        timeout: proposal.expiresAt ? proposal.expiresAt - Date.now() : 30000,
        priority: proposal.priority > 70 ? 'high' : proposal.priority > 40 ? 'medium' : 'low'
      }
    );
    
    this.communicationProtocol.sendMessage(message);
    this.emit('proposal:sent', proposal);
  }
  
  /**
   * Accept a proposal
   */
  acceptProposal(negotiationId: string, proposalId: string, agent: string): void {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation ${negotiationId} not found`);
    }
    
    const proposal = negotiation.proposals.find(p => p.proposalId === proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    if (proposal.to !== agent) {
      throw new Error(`Agent ${agent} is not the recipient of this proposal`);
    }
    
    negotiation.status = 'accepted';
    negotiation.acceptedProposal = proposal;
    negotiation.history.push({
      action: 'accepted',
      agent,
      timestamp: Date.now(),
      details: { proposalId }
    });
    
    // Notify all participants
    this.notifyParticipants(negotiation, 'accepted', { proposalId, agent });
    
    this.emit('negotiation:accepted', { negotiation, proposal, agent });
  }
  
  /**
   * Reject a proposal
   */
  rejectProposal(negotiationId: string, proposalId: string, agent: string, reason?: string): void {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation ${negotiationId} not found`);
    }
    
    const proposal = negotiation.proposals.find(p => p.proposalId === proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    negotiation.status = 'rejected';
    negotiation.history.push({
      action: 'rejected',
      agent,
      timestamp: Date.now(),
      details: { proposalId, reason }
    });
    
    // Notify participants
    this.notifyParticipants(negotiation, 'rejected', { proposalId, agent, reason });
    
    this.emit('negotiation:rejected', { negotiation, proposal, agent, reason });
  }
  
  /**
   * Counter a proposal with a new proposal
   */
  counterProposal(
    negotiationId: string,
    originalProposalId: string,
    from: string,
    to: string,
    counterTerms: any,
    options?: {
      priority?: number;
      expiresAt?: number;
    }
  ): NegotiationProposal {
    const negotiation = this.negotiations.get(negotiationId);
    if (!negotiation) {
      throw new Error(`Negotiation ${negotiationId} not found`);
    }
    
    const counterProposal = this.createProposal(
      negotiationId,
      from,
      to,
      negotiation.type,
      counterTerms,
      options
    );
    
    negotiation.proposals.push(counterProposal);
    negotiation.currentProposal = counterProposal;
    negotiation.status = 'countered';
    negotiation.history.push({
      action: 'countered',
      agent: from,
      timestamp: Date.now(),
      details: { originalProposalId, counterProposalId: counterProposal.proposalId }
    });
    
    // Send counter proposal
    this.sendProposal(counterProposal);
    
    this.emit('negotiation:countered', { negotiation, counterProposal });
    
    return counterProposal;
  }
  
  /**
   * Handle negotiation message
   */
  private handleNegotiationMessage(message: AgentMessage): void {
    const content = message.content;
    if (!content || !content.negotiationId) return;
    
    const negotiation = this.negotiations.get(content.negotiationId);
    if (!negotiation) return;
    
    if (content.type === 'negotiation_proposal') {
      this.emit('proposal:received', {
        negotiation,
        proposal: content.proposal,
        from: message.from
      });
    } else if (content.type === 'negotiation_response') {
      if (content.action === 'accept') {
        this.acceptProposal(content.negotiationId, content.proposalId, message.from);
      } else if (content.action === 'reject') {
        this.rejectProposal(content.negotiationId, content.proposalId, message.from, content.reason);
      } else if (content.action === 'counter') {
        // Counter proposal would be handled separately
      }
    }
  }
  
  /**
   * Notify all participants of negotiation status change
   */
  private notifyParticipants(
    negotiation: Negotiation,
    action: string,
    details: any
  ): void {
    negotiation.participants.forEach(participant => {
      const message = this.communicationProtocol.createPublish(
        'negotiation_system',
        `negotiation.${negotiation.negotiationId}`,
        {
          action,
          negotiationId: negotiation.negotiationId,
          details
        }
      );
      
      this.communicationProtocol.sendMessage(message);
    });
  }
  
  /**
   * Get negotiation by ID
   */
  getNegotiation(negotiationId: string): Negotiation | undefined {
    return this.negotiations.get(negotiationId);
  }
  
  /**
   * Get active negotiations
   */
  getActiveNegotiations(): Negotiation[] {
    return Array.from(this.negotiations.values()).filter(
      n => n.status === 'initiated' || n.status === 'proposed' || n.status === 'countered'
    );
  }
  
  /**
   * Resolve conflict through negotiation
   */
  async resolveConflict(
    conflictId: string,
    conflictDescription: string,
    participants: string[],
    proposedSolution: string,
    alternatives: string[]
  ): Promise<ConflictResolutionProposal> {
    const negotiation = this.initiateNegotiation(
      'conflict_resolution',
      participants[0],
      participants.slice(1),
      {
        conflictId,
        conflictDescription,
        proposedSolution,
        alternatives,
        rationale: 'Initial proposed solution'
      } as ConflictResolutionProposal
    );
    
    // Wait for resolution (in real implementation, this would be async)
    return new Promise((resolve, reject) => {
      const checkResolution = () => {
        const updated = this.negotiations.get(negotiation.negotiationId);
        if (updated?.status === 'accepted') {
          resolve(updated.acceptedProposal!.terms as ConflictResolutionProposal);
        } else if (updated?.status === 'rejected') {
          reject(new Error('Conflict resolution negotiation was rejected'));
        } else {
          setTimeout(checkResolution, 1000);
        }
      };
      
      checkResolution();
    });
  }
  
  /**
   * Negotiate task assignment
   */
  negotiateTaskAssignment(
    taskId: string,
    taskDescription: string,
    requiredCapabilities: string[],
    candidateAgents: string[],
    initiator: string
  ): Negotiation {
    const proposal: TaskAssignmentProposal = {
      taskId,
      taskDescription,
      requiredCapabilities,
      estimatedDuration: 0, // Would be calculated
      priority: 50
    };
    
    return this.initiateNegotiation(
      'task_assignment',
      initiator,
      candidateAgents,
      proposal
    );
  }
  
  /**
   * Negotiate resource allocation
   */
  negotiateResourceAllocation(
    resourceType: string,
    resourceId: string,
    quantity: number,
    duration: number,
    participants: string[],
    initiator: string
  ): Negotiation {
    const proposal: ResourceAllocationProposal = {
      resourceType,
      resourceId,
      quantity,
      duration,
      priority: 50
    };
    
    return this.initiateNegotiation(
      'resource_allocation',
      initiator,
      participants,
      proposal
    );
  }
}

// Singleton instance (requires communication protocol)
export function createAgentNegotiation(communicationProtocol: AgentCommunicationProtocol): AgentNegotiation {
  return new AgentNegotiation(communicationProtocol);
}

