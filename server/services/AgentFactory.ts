/**
 * Agent Factory
 * Creates and manages agent instances
 */

import { Agent } from './Agent.js';
import { PaperFindingAgent } from './agents/PaperFindingAgent.js';
import { AbstractWritingAgent } from './agents/AbstractWritingAgent.js';
import { IdeaGenerationAgent } from './agents/IdeaGenerationAgent.js';
import { ProposalWritingAgent } from './agents/ProposalWritingAgent.js';
import { LiteratureReviewAgent } from './agents/LiteratureReviewAgent.js';
import { ExperimentDesignAgent } from './agents/ExperimentDesignAgent.js';
import { DataAnalysisAgent } from './agents/DataAnalysisAgent.js';
import { DataReadingAgent } from './agents/DataReadingAgent.js';
import { PaperWritingAgent } from './agents/PaperWritingAgent.js';
import { FigureGenerationAgent } from './agents/FigureGenerationAgent.js';
import { ReferenceManagementAgent } from './agents/ReferenceManagementAgent.js';
import { DraftCompilationAgent } from './agents/DraftCompilationAgent.js';
import { PresentationSlideAgent } from './agents/PresentationSlideAgent.js';
import { QualityValidationAgent } from './agents/QualityValidationAgent.js';
import { OutputFormattingAgent } from './agents/OutputFormattingAgent.js';
import { HypothesisGenerationAgent } from './agents/HypothesisGenerationAgent.js';
import { ProtocolOptimizationAgent } from './agents/ProtocolOptimizationAgent.js';
import { CollaborationMatchingAgent } from './agents/CollaborationMatchingAgent.js';

export class AgentFactory {
  /**
   * Create an agent instance
   * @param agentType Agent type identifier
   * @returns Agent instance
   */
  static createAgent(agentType: string): Agent {
    switch (agentType) {
      case 'paper_finding':
        return new PaperFindingAgent();
      
      case 'abstract_writing':
        return new AbstractWritingAgent();
      
      case 'idea_generation':
        return new IdeaGenerationAgent();
      
      case 'proposal_writing':
        return new ProposalWritingAgent();
      
      case 'literature_review':
        return new LiteratureReviewAgent();
      
      case 'experiment_design':
        return new ExperimentDesignAgent();
      
      case 'data_analysis':
        return new DataAnalysisAgent();
      
      case 'data_reading':
        return new DataReadingAgent();
      
      case 'paper_writing':
        return new PaperWritingAgent();
      
      case 'figure_generation':
        return new FigureGenerationAgent();
      
      case 'reference_management':
        return new ReferenceManagementAgent();
      
      case 'draft_compilation':
        return new DraftCompilationAgent();
      
      case 'presentation_slide':
        return new PresentationSlideAgent();
      
      case 'quality_validation':
        return new QualityValidationAgent();
      
      case 'output_formatting':
        return new OutputFormattingAgent();
      
      case 'hypothesis_generation':
        return new HypothesisGenerationAgent();
      
      case 'protocol_optimization':
        return new ProtocolOptimizationAgent();
      
      case 'collaboration_matching':
        return new CollaborationMatchingAgent();
      
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }
  
  /**
   * Get all available agent types
   * @returns Array of agent type identifiers
   */
  static getAvailableAgents(): string[] {
    return [
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
      'output_formatting',
      'hypothesis_generation',
      'protocol_optimization',
      'collaboration_matching'
    ];
  }
  
  /**
   * Check if agent type is supported
   * @param agentType Agent type to check
   * @returns True if supported
   */
  static isAgentSupported(agentType: string): boolean {
    return this.getAvailableAgents().includes(agentType);
  }
}

