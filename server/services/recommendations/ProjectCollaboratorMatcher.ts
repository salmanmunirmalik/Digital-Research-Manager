/**
 * Project-scoped collaborator matching — wraps CollaborationMatchingAgent
 * and maps results into Recommendation-shaped items for the UI.
 */

import { AgentFactory } from '../AgentFactory.js';
import { UserContextRetriever } from '../UserContextRetriever.js';
import { Recommendation } from '../recommendations/RecommendationEngine.js';
import { gateAgentExecution } from '../safety/agentSafetyGate.js';

export type ProjectMatchRequest = {
  title: string;
  description: string;
  researchArea: string;
  requiredExpertise: string[];
  requiredSkills?: string[];
  collaborationType?: 'co-author' | 'co-investigator' | 'consultant' | 'mentor' | 'any';
  maxCollaborators?: number;
};

export class ProjectCollaboratorMatcher {
  static async match(
    userId: string,
    project: ProjectMatchRequest,
    userRole?: string
  ): Promise<{
    matches: Recommendation[];
    agentRecommendations: any[];
    metadata: any;
  }> {
    const input = {
      project: {
        title: project.title,
        description: project.description,
        researchArea: project.researchArea,
        requiredExpertise: project.requiredExpertise || [],
        requiredSkills: project.requiredSkills || [],
      },
      preferences: {
        collaborationType: project.collaborationType || 'any',
        maxCollaborators: project.maxCollaborators || 8,
      },
      constraints: {
        excludeUsers: [userId],
      },
    };

    const gate = await gateAgentExecution({
      userId,
      agentType: 'collaboration_matching',
      input,
      userRole,
    });
    if (!gate.allowed) {
      throw new Error(gate.blockedReason || 'Collaborator matching blocked by safety policy');
    }

    const agent = AgentFactory.createAgent('collaboration_matching');
    if (!agent.validateInput(input)) {
      throw new Error(
        'Invalid project details. Title, description, research area, and expertise list are required.'
      );
    }

    const userContext = await UserContextRetriever.retrieveContext(
      userId,
      `${project.title} ${project.researchArea}`
    );

    const result = await agent.execute(input, {
      userContext,
      conversationHistory: [],
      additionalData: { userId },
    });

    if (!result.success) {
      throw new Error(result.error || 'Collaboration matching failed');
    }

    const content = result.content || {};
    const matches: Recommendation[] = (content.matches || []).map((m: any) => ({
      itemId: String(m.userId),
      itemType: 'collaborator',
      score: Number(m.matchScore) || 0,
      reason: (m.matchReasons || []).slice(0, 3).join('; ') || 'Project fit',
      algorithm: 'collaboration_matching_agent',
      metadata: {
        title: m.name,
        name: m.name,
        institution: m.institution,
        expertise: m.expertise || [],
        complementarySkills: m.complementarySkills || [],
        availability: m.availability,
        category: 'project_match',
        contactInfo: m.contactInfo,
      },
    }));

    return {
      matches,
      agentRecommendations: content.recommendations || [],
      metadata: {
        ...(content.metadata || {}),
        safetyWarnings: gate.warnings,
      },
    };
  }
}
