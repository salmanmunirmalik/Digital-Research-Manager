/**
 * Autonomous Literature Synthesis Workflow
 * Task 17: Create autonomous literature synthesis workflow
 * 
 * An autonomous workflow that independently:
 * 1. Identifies research gaps and questions
 * 2. Searches for relevant papers
 * 3. Analyzes and synthesizes findings
 * 4. Generates comprehensive literature review
 * 5. Identifies future research directions
 */

import { AgentFactory } from '../AgentFactory.js';
import { ResearchOrchestrator, WorkflowDefinition } from '../ResearchOrchestrator.js';
import { AgentContext } from '../Agent.js';
import { TaskAnalysisEngine } from '../TaskAnalysisEngine.js';
import { EnhancedRAGSystem } from '../EnhancedRAGSystem.js';

export interface AutonomousLiteratureSynthesisInput {
  topic: string; // Research topic or area
  researchInterests?: string[]; // User's research interests
  existingPapers?: string[]; // IDs of papers user already has
  depth?: 'shallow' | 'moderate' | 'deep'; // Depth of analysis
  maxPapers?: number; // Maximum papers to analyze
  focusAreas?: string[]; // Specific areas to focus on
  excludeAreas?: string[]; // Areas to exclude
}

export interface AutonomousLiteratureSynthesisResult {
  success: boolean;
  synthesis: {
    overview: string; // Overall synthesis of the literature
    keyFindings: Array<{
      finding: string;
      supportingPapers: string[];
      significance: string;
    }>;
    researchGaps: Array<{
      gap: string;
      description: string;
      potentialImpact: string;
    }>;
    trends: Array<{
      trend: string;
      description: string;
      timeFrame: string;
    }>;
    methodologies: Array<{
      methodology: string;
      description: string;
      applications: string[];
    }>;
    futureDirections: Array<{
      direction: string;
      rationale: string;
      feasibility: string;
    }>;
  };
  papers: Array<{
    id: string;
    title: string;
    authors: string[];
    year: number;
    relevance: number; // 0-1
    keyContribution: string;
    methodology?: string;
    findings?: string;
  }>;
  literatureReview: {
    structured: string; // Structured literature review text
    sections: {
      introduction?: string;
      methodology?: string;
      findings?: string;
      discussion?: string;
      conclusion?: string;
    };
  };
  metadata: {
    totalPapersAnalyzed: number;
    timeRange: { start: number; end: number };
    domains: string[];
    synthesisDepth: string;
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

export class AutonomousLiteratureSynthesisWorkflow {
  /**
   * Execute autonomous literature synthesis
   */
  async execute(
    input: AutonomousLiteratureSynthesisInput,
    userId: string,
    context: AgentContext
  ): Promise<AutonomousLiteratureSynthesisResult> {
    const startTime = Date.now();
    const workflowSteps: AutonomousLiteratureSynthesisResult['workflow']['steps'] = [];
    
    try {
      const depth = input.depth || 'moderate';
      const maxPapers = input.maxPapers || (depth === 'deep' ? 50 : depth === 'moderate' ? 30 : 15);
      
      // Step 1: Analyze topic and identify search strategies
      const stepStart = Date.now();
      let searchStrategy: any = null;
      try {
        const taskAnalysis = await TaskAnalysisEngine.analyzeTask(
          `Conduct comprehensive literature review on: ${input.topic}`
        );
        
        // Get user context for research interests
        const userContext = await EnhancedRAGSystem.retrieveEnhancedContext(userId, input.topic);
        
        searchStrategy = {
          primaryKeywords: taskAnalysis.parameters.keywords || [input.topic],
          relatedTerms: this.generateRelatedTerms(input.topic, userContext),
          focusAreas: input.focusAreas || [],
          excludeAreas: input.excludeAreas || []
        };
        
        workflowSteps.push({
          step: 'Analyze Topic',
          agent: 'TaskAnalysisEngine',
          status: 'completed',
          duration: Date.now() - stepStart
        });
      } catch (error) {
        console.error('Error analyzing topic:', error);
        workflowSteps.push({
          step: 'Analyze Topic',
          agent: 'TaskAnalysisEngine',
          status: 'failed',
          duration: Date.now() - stepStart
        });
      }
      
      // Step 2: Find relevant papers (multiple searches for comprehensive coverage)
      const stepStart2 = Date.now();
      let allPapers: any[] = [];
      try {
        const paperFindingAgent = AgentFactory.createAgent('paper_finding');
        
        // Multiple search queries for comprehensive coverage
        const searchQueries = [
          input.topic,
          ...(searchStrategy?.primaryKeywords || []).slice(0, 3),
          ...(searchStrategy?.relatedTerms || []).slice(0, 2)
        ];
        
        const paperPromises = searchQueries.map(query => 
          paperFindingAgent.execute({
            topic: query,
            maxResults: Math.ceil(maxPapers / searchQueries.length),
            filters: {
              yearRange: { start: 2015, end: new Date().getFullYear() },
              minCitations: depth === 'deep' ? 5 : 0
            }
          }, context)
        );
        
        const paperResults = await Promise.all(paperPromises);
        
        // Combine and deduplicate papers
        const paperMap = new Map<string, any>();
        paperResults.forEach(result => {
          if (result.success && result.content?.papers) {
            result.content.papers.forEach((paper: any) => {
              if (!paperMap.has(paper.id || paper.title)) {
                paperMap.set(paper.id || paper.title, paper);
              }
            });
          }
        });
        
        allPapers = Array.from(paperMap.values()).slice(0, maxPapers);
        
        workflowSteps.push({
          step: 'Find Papers',
          agent: 'PaperFindingAgent',
          status: 'completed',
          duration: Date.now() - stepStart2
        });
      } catch (error) {
        console.error('Error finding papers:', error);
        workflowSteps.push({
          step: 'Find Papers',
          agent: 'PaperFindingAgent',
          status: 'failed',
          duration: Date.now() - stepStart2
        });
      }
      
      // Step 3: Conduct comprehensive literature review
      const stepStart3 = Date.now();
      let literatureReviewResult: any = null;
      try {
        const literatureReviewAgent = AgentFactory.createAgent('literature_review');
        
        const reviewInput = {
          topic: input.topic,
          papers: allPapers.map(p => ({
            title: p.title,
            authors: p.authors,
            abstract: p.abstract,
            year: p.year,
            relevance: p.relevanceScore
          })),
          maxPapers: allPapers.length,
          depth: depth,
          focusAreas: input.focusAreas,
          synthesisType: 'comprehensive'
        };
        
        const result = await literatureReviewAgent.execute(reviewInput, context);
        
        if (result.success) {
          literatureReviewResult = result.content;
          workflowSteps.push({
            step: 'Literature Review',
            agent: 'LiteratureReviewAgent',
            status: 'completed',
            duration: Date.now() - stepStart3
          });
        } else {
          throw new Error(result.error || 'Failed to conduct literature review');
        }
      } catch (error: any) {
        console.error('Error conducting literature review:', error);
        workflowSteps.push({
          step: 'Literature Review',
          agent: 'LiteratureReviewAgent',
          status: 'failed',
          duration: Date.now() - stepStart3
        });
        throw error;
      }
      
      // Step 4: Synthesize findings and identify gaps
      const stepStart4 = Date.now();
      let synthesis: AutonomousLiteratureSynthesisResult['synthesis'] | null = null;
      try {
        // Use AI to synthesize findings
        const apiAssignment = await this.getApiAssignment(userId, 'content_writing');
        if (!apiAssignment) {
          throw new Error('No API configured for content writing');
        }
        
        const { AIProviderFactory } = await import('../AIProviderFactory.js');
        const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
        
        const synthesisPrompt = `Synthesize the following literature review findings and identify research gaps, trends, and future directions.

Topic: ${input.topic}
Literature Review Summary: ${literatureReviewResult?.summary || 'N/A'}
Key Papers Analyzed: ${allPapers.length}

Provide a comprehensive synthesis including:
1. Key findings across the literature
2. Research gaps and unanswered questions
3. Emerging trends
4. Common methodologies used
5. Future research directions

Format as JSON:
{
  "overview": "Overall synthesis",
  "keyFindings": [
    {
      "finding": "Finding description",
      "supportingPapers": ["Paper 1", "Paper 2"],
      "significance": "Why this matters"
    }
  ],
  "researchGaps": [
    {
      "gap": "Gap description",
      "description": "Detailed explanation",
      "potentialImpact": "Impact if addressed"
    }
  ],
  "trends": [
    {
      "trend": "Trend name",
      "description": "Trend description",
      "timeFrame": "When this emerged"
    }
  ],
  "methodologies": [
    {
      "methodology": "Method name",
      "description": "Description",
      "applications": ["Application 1", "Application 2"]
    }
  ],
  "futureDirections": [
    {
      "direction": "Research direction",
      "rationale": "Why this is important",
      "feasibility": "High/Medium/Low"
    }
  ]
}`;
        
        const response = await aiProvider.chat([
          { role: 'system', content: 'You are an expert in literature synthesis and research gap analysis. Provide comprehensive, insightful analysis in JSON format.' },
          { role: 'user', content: synthesisPrompt }
        ], {
          apiKey: apiAssignment.apiKey,
          temperature: 0.6,
          maxTokens: 3000
        });
        
        try {
          synthesis = JSON.parse(response.content);
        } catch {
          // Fallback synthesis
          synthesis = {
            overview: literatureReviewResult?.summary || 'Literature synthesis completed',
            keyFindings: [],
            researchGaps: [],
            trends: [],
            methodologies: [],
            futureDirections: []
          };
        }
        
        workflowSteps.push({
          step: 'Synthesize Findings',
          agent: 'AIProvider',
          status: 'completed',
          duration: Date.now() - stepStart4
        });
      } catch (error) {
        console.error('Error synthesizing findings:', error);
        synthesis = {
          overview: literatureReviewResult?.summary || 'Literature synthesis completed',
          keyFindings: [],
          researchGaps: [],
          trends: [],
          methodologies: [],
          futureDirections: []
        };
        workflowSteps.push({
          step: 'Synthesize Findings',
          agent: 'AIProvider',
          status: 'failed',
          duration: Date.now() - stepStart4
        });
      }
      
      // Step 5: Generate structured literature review
      const stepStart5 = Date.now();
      let structuredReview: any = null;
      try {
        const apiAssignment = await this.getApiAssignment(userId, 'content_writing');
        if (apiAssignment) {
          const { AIProviderFactory } = await import('../AIProviderFactory.js');
          const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
          
          const reviewPrompt = `Generate a structured literature review based on the following synthesis.

Topic: ${input.topic}
Synthesis: ${JSON.stringify(synthesis, null, 2)}
Literature Review Summary: ${literatureReviewResult?.summary || ''}

Create a well-structured literature review with:
1. Introduction (context and scope)
2. Methodology (how papers were selected and analyzed)
3. Findings (key findings organized by theme)
4. Discussion (synthesis, gaps, trends)
5. Conclusion (summary and future directions)

Format as JSON:
{
  "structured": "Full literature review text",
  "sections": {
    "introduction": "...",
    "methodology": "...",
    "findings": "...",
    "discussion": "...",
    "conclusion": "..."
  }
}`;
          
          const response = await aiProvider.chat([
            { role: 'system', content: 'You are an expert academic writer. Create a comprehensive, well-structured literature review.' },
            { role: 'user', content: reviewPrompt }
          ], {
            apiKey: apiAssignment.apiKey,
            temperature: 0.5,
            maxTokens: 4000
          });
          
          try {
            structuredReview = JSON.parse(response.content);
          } catch {
            structuredReview = {
              structured: literatureReviewResult?.summary || '',
              sections: {}
            };
          }
        } else {
          structuredReview = {
            structured: literatureReviewResult?.summary || '',
            sections: {}
          };
        }
        
        workflowSteps.push({
          step: 'Generate Structured Review',
          agent: 'AIProvider',
          status: 'completed',
          duration: Date.now() - stepStart5
        });
      } catch (error) {
        console.error('Error generating structured review:', error);
        structuredReview = {
          structured: literatureReviewResult?.summary || '',
          sections: {}
        };
        workflowSteps.push({
          step: 'Generate Structured Review',
          agent: 'AIProvider',
          status: 'failed',
          duration: Date.now() - stepStart5
        });
      }
      
      // Build final result
      const result: AutonomousLiteratureSynthesisResult = {
        success: true,
        synthesis: synthesis!,
        papers: allPapers.map(p => ({
          id: p.id || p.title,
          title: p.title,
          authors: p.authors || [],
          year: p.year || new Date().getFullYear(),
          relevance: p.relevanceScore || 0.5,
          keyContribution: p.abstract?.substring(0, 200) || '',
          methodology: p.methodology,
          findings: p.findings
        })),
        literatureReview: structuredReview,
        metadata: {
          totalPapersAnalyzed: allPapers.length,
          timeRange: {
            start: Math.min(...allPapers.map(p => p.year || 2015)),
            end: Math.max(...allPapers.map(p => p.year || new Date().getFullYear()))
          },
          domains: this.extractDomains(allPapers),
          synthesisDepth: depth
        },
        workflow: {
          steps: workflowSteps,
          totalDuration: Date.now() - startTime
        }
      };
      
      return result;
    } catch (error: any) {
      console.error('Error in AutonomousLiteratureSynthesisWorkflow:', error);
      throw error;
    }
  }
  
  /**
   * Generate related terms for comprehensive search
   */
  private generateRelatedTerms(topic: string, userContext: any): string[] {
    const terms: string[] = [];
    
    // Extract terms from user context
    if (userContext.user?.research_interests) {
      const interests = userContext.user.research_interests.split(',').map((i: string) => i.trim());
      terms.push(...interests);
    }
    
    // Add common related terms (simplified - in production, use NLP)
    const topicWords = topic.toLowerCase().split(/\s+/);
    terms.push(...topicWords.filter(w => w.length > 4));
    
    return [...new Set(terms)].slice(0, 5);
  }
  
  /**
   * Extract domains from papers
   */
  private extractDomains(papers: any[]): string[] {
    // Simplified domain extraction
    const domains = new Set<string>();
    
    papers.forEach(paper => {
      if (paper.journal) {
        // Extract domain from journal name (simplified)
        const journalWords = paper.journal.toLowerCase().split(/\s+/);
        journalWords.forEach(word => {
          if (word.length > 4 && !['journal', 'review', 'research'].includes(word)) {
            domains.add(word);
          }
        });
      }
    });
    
    return Array.from(domains).slice(0, 5);
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

