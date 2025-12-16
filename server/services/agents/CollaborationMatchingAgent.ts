/**
 * Collaboration Matching Agent
 * Task 28: Match researchers for collaboration
 * 
 * Identifies and matches researchers for collaboration based on:
 * - Research interests and expertise
 * - Complementary skills
 * - Geographic and institutional factors
 * - Collaboration history
 * - Project requirements
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';
import pool from "../../../database/config.js";

export interface CollaborationMatchingInput {
  project: {
    title: string;
    description: string;
    researchArea: string;
    requiredExpertise: string[];
    requiredSkills?: string[];
    projectType?: 'research' | 'development' | 'clinical' | 'field' | 'computational';
    duration?: string;
    funding?: {
      available: boolean;
      amount?: number;
      currency?: string;
    };
  };
  preferences?: {
    collaborationType?: 'co-author' | 'co-investigator' | 'consultant' | 'mentor' | 'any';
    geographicPreference?: 'local' | 'national' | 'international' | 'any';
    institutionType?: 'academic' | 'industry' | 'government' | 'any';
    experienceLevel?: 'junior' | 'mid' | 'senior' | 'any';
    maxCollaborators?: number;
  };
  constraints?: {
    excludeUsers?: string[]; // User IDs to exclude
    mustHaveSkills?: string[]; // Required skills
    preferredInstitutions?: string[]; // Preferred institutions
  };
}

export interface CollaborationMatchingResult {
  success: boolean;
  matches: Array<{
    userId: string;
    name: string;
    institution?: string;
    expertise: string[];
    skills: string[];
    matchScore: number; // 0-100
    matchReasons: string[];
    complementarySkills: string[]; // Skills they have that complement the project
    collaborationHistory?: {
      previousCollaborations: number;
      successRate?: number;
    };
    availability?: 'high' | 'medium' | 'low';
    contactInfo?: {
      email?: string;
      profileUrl?: string;
    };
  }>;
  recommendations: Array<{
    type: 'team_composition' | 'skill_gap' | 'geographic' | 'institutional';
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  metadata: {
    totalCandidates: number;
    matchedCandidates: number;
    averageMatchScore: number;
    searchCriteria: string[];
  };
}

export class CollaborationMatchingAgent extends BaseAgent implements Agent {
  readonly agentType = 'collaboration_matching';
  readonly agentName = 'Collaboration Matching Agent';
  readonly description = 'Matches researchers for collaboration based on expertise, skills, and project requirements';
  
  getRequiredContext(): string[] {
    return []; // No specific context required, but uses user database
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.project || typeof input.project !== 'object') return false;
    if (!input.project.title || !input.project.description || !input.project.researchArea) {
      return false;
    }
    if (!input.project.requiredExpertise || !Array.isArray(input.project.requiredExpertise)) {
      return false;
    }
    return true;
  }
  
  async execute(
    input: CollaborationMatchingInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: project with title, description, researchArea, and requiredExpertise is required',
          content: null
        };
      }
      
      // Get API assignment for content writing
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for collaboration matching. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      
      // Find potential collaborators from database
      const candidates = await this.findCandidates(input, userId);
      
      // Score and rank candidates
      const scoredCandidates = await this.scoreCandidates(
        candidates,
        input,
        aiProvider,
        apiAssignment
      );
      
      // Filter and sort by match score
      const matches = scoredCandidates
        .filter(c => c.matchScore >= 50) // Minimum match threshold
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, input.preferences?.maxCollaborators || 10);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        matches,
        input,
        aiProvider,
        apiAssignment
      );
      
      // Calculate metadata
      const averageMatchScore = matches.length > 0
        ? matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length
        : 0;
      
      const result: CollaborationMatchingResult = {
        success: true,
        matches,
        recommendations,
        metadata: {
          totalCandidates: candidates.length,
          matchedCandidates: matches.length,
          averageMatchScore,
          searchCriteria: [
            ...input.project.requiredExpertise,
            ...(input.project.requiredSkills || [])
          ]
        }
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
      console.error('Error in CollaborationMatchingAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to match collaborators',
        content: null
      };
    }
  }
  
  /**
   * Find potential candidates from database
   */
  private async findCandidates(
    input: CollaborationMatchingInput,
    requestingUserId: string
  ): Promise<any[]> {
    try {
      // Query database for users with matching expertise
      const expertiseTerms = input.project.requiredExpertise.join('|');
      const skillsTerms = input.project.requiredSkills?.join('|') || '';
      
      let query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.current_institution,
          u.research_interests,
          u.email,
          u.avatar_url,
          u.bio,
          u.expertise,
          u.skills
        FROM users u
        WHERE u.id != $1
      `;
      
      const params: any[] = [requestingUserId];
      
      // Add exclusion filter
      if (input.constraints?.excludeUsers && input.constraints.excludeUsers.length > 0) {
        query += ` AND u.id != ALL($${params.length + 1})`;
        params.push(input.constraints.excludeUsers);
      }
      
      // Filter by research interests/expertise
      if (input.project.researchArea) {
        query += ` AND (
          u.research_interests ILIKE $${params.length + 1}
          OR u.expertise::text ILIKE $${params.length + 1}
        )`;
        params.push(`%${input.project.researchArea}%`);
      }
      
      // Filter by institution type if specified
      if (input.preferences?.institutionType && input.preferences.institutionType !== 'any') {
        // This would require additional institution metadata
      }
      
      query += ` LIMIT 50`;
      
      const result = await pool.query(query, params);
      
      return result.rows.map(row => ({
        userId: row.id,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        institution: row.current_institution,
        email: row.email,
        researchInterests: row.research_interests,
        expertise: this.parseArrayField(row.expertise),
        skills: this.parseArrayField(row.skills),
        bio: row.bio,
        avatarUrl: row.avatar_url
      }));
    } catch (error) {
      console.error('Error finding candidates:', error);
      return [];
    }
  }
  
  /**
   * Score candidates based on match criteria
   */
  private async scoreCandidates(
    candidates: any[],
    input: CollaborationMatchingInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<CollaborationMatchingResult['matches']> {
    try {
      // Use AI to score candidates
      const prompt = `Score and rank potential research collaborators based on project requirements.

Project:
Title: ${input.project.title}
Description: ${input.project.description}
Research Area: ${input.project.researchArea}
Required Expertise: ${input.project.requiredExpertise.join(', ')}
${input.project.requiredSkills ? `Required Skills: ${input.project.requiredSkills.join(', ')}` : ''}

Candidates:
${candidates.map((c, i) => `
${i + 1}. ${c.name}
   Institution: ${c.institution || 'Not specified'}
   Research Interests: ${c.researchInterests || 'Not specified'}
   Expertise: ${c.expertise.join(', ') || 'Not specified'}
   Skills: ${c.skills.join(', ') || 'Not specified'}
`).join('\n')}

For each candidate, provide:
1. Match score (0-100)
2. Match reasons (why they're a good fit)
3. Complementary skills (skills they have that complement the project)
4. Availability assessment (high, medium, low)

Format as JSON array matching candidate order:
[
  {
    "matchScore": 85,
    "matchReasons": ["reason1", "reason2"],
    "complementarySkills": ["skill1", "skill2"],
    "availability": "high|medium|low"
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in research collaboration matching. Score candidates accurately based on project requirements.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 3000
      });
      
      try {
        const scores = JSON.parse(response.content);
        
        return candidates.map((candidate, index) => {
          const score = scores[index] || {
            matchScore: this.calculateBasicScore(candidate, input),
            matchReasons: [],
            complementarySkills: [],
            availability: 'medium'
          };
          
          return {
            userId: candidate.userId,
            name: candidate.name,
            institution: candidate.institution,
            expertise: candidate.expertise,
            skills: candidate.skills,
            matchScore: score.matchScore || this.calculateBasicScore(candidate, input),
            matchReasons: score.matchReasons || [],
            complementarySkills: score.complementarySkills || [],
            availability: score.availability || 'medium',
            contactInfo: {
              email: candidate.email,
              profileUrl: `/profile/${candidate.userId}`
            }
          };
        });
      } catch {
        // Fallback to basic scoring
        return candidates.map(candidate => ({
          userId: candidate.userId,
          name: candidate.name,
          institution: candidate.institution,
          expertise: candidate.expertise,
          skills: candidate.skills,
          matchScore: this.calculateBasicScore(candidate, input),
          matchReasons: ['Matches research area'],
          complementarySkills: [],
          availability: 'medium',
          contactInfo: {
            email: candidate.email,
            profileUrl: `/profile/${candidate.userId}`
          }
        }));
      }
    } catch (error) {
      console.error('Error scoring candidates:', error);
      // Fallback to basic scoring
      return candidates.map(candidate => ({
        userId: candidate.userId,
        name: candidate.name,
        institution: candidate.institution,
        expertise: candidate.expertise,
        skills: candidate.skills,
        matchScore: this.calculateBasicScore(candidate, input),
        matchReasons: ['Matches research area'],
        complementarySkills: [],
        availability: 'medium',
        contactInfo: {
          email: candidate.email,
          profileUrl: `/profile/${candidate.userId}`
        }
      }));
    }
  }
  
  /**
   * Calculate basic match score
   */
  private calculateBasicScore(candidate: any, input: CollaborationMatchingInput): number {
    let score = 0;
    
    // Check expertise match
    const expertiseMatch = input.project.requiredExpertise.filter(req =>
      candidate.expertise.some((exp: string) =>
        exp.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(exp.toLowerCase())
      )
    ).length;
    
    score += (expertiseMatch / input.project.requiredExpertise.length) * 50;
    
    // Check skills match
    if (input.project.requiredSkills && input.project.requiredSkills.length > 0) {
      const skillsMatch = input.project.requiredSkills.filter(req =>
        candidate.skills.some((skill: string) =>
          skill.toLowerCase().includes(req.toLowerCase()) ||
          req.toLowerCase().includes(skill.toLowerCase())
        )
      ).length;
      
      score += (skillsMatch / input.project.requiredSkills.length) * 30;
    } else {
      score += 30; // Full points if no skills required
    }
    
    // Check research interests match
    if (candidate.researchInterests) {
      const interestsMatch = input.project.researchArea.toLowerCase().includes(
        candidate.researchInterests.toLowerCase()
      ) || candidate.researchInterests.toLowerCase().includes(
        input.project.researchArea.toLowerCase()
      );
      
      if (interestsMatch) {
        score += 20;
      }
    }
    
    return Math.min(100, Math.round(score));
  }
  
  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    matches: CollaborationMatchingResult['matches'],
    input: CollaborationMatchingInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<CollaborationMatchingResult['recommendations']> {
    try {
      const prompt = `Generate recommendations for forming a research collaboration team.

Project:
Title: ${input.project.title}
Description: ${input.project.description}
Required Expertise: ${input.project.requiredExpertise.join(', ')}

Matched Collaborators: ${matches.length}
Top Matches: ${matches.slice(0, 3).map(m => `${m.name} (${m.matchScore}%)`).join(', ')}

Provide recommendations for:
1. Team composition (ideal team size, role distribution)
2. Skill gaps (missing skills that should be addressed)
3. Geographic considerations
4. Institutional diversity

Format as JSON array:
[
  {
    "type": "team_composition|skill_gap|geographic|institutional",
    "recommendation": "Recommendation text",
    "priority": "high|medium|low"
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in research team formation. Provide practical recommendations.' },
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
   * Parse array field from database
   */
  private parseArrayField(field: any): string[] {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch {
        return field.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return [];
  }
}

