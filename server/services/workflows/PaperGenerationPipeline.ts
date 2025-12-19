/**
 * Paper Generation Pipeline
 * Task 63: Orchestrate complete paper generation workflow
 * 
 * Orchestrates: read data → write paper → create figures → add references → create draft
 * 
 * This pipeline coordinates multiple agents to generate a complete research paper:
 * 1. DataReadingAgent - Read and interpret experimental data
 * 2. PaperWritingAgent - Write paper sections
 * 3. FigureGenerationAgent - Create figures
 * 4. ReferenceManagementAgent - Add citations
 * 5. DraftCompilationAgent - Compile final draft
 * 6. QualityValidationAgent - Validate quality
 * 7. OutputFormattingAgent - Format for target journal
 */

import { AgentFactory } from '../AgentFactory.js';
import { ResearchOrchestrator } from '../ResearchOrchestrator.js';
import { AgentResult } from '../Agent.js';
import pool from "../../../database/config.js";

export interface PaperGenerationPipelineInput {
  dataSource: {
    type: 'lab_notebook' | 'experiment' | 'research_data' | 'file';
    sourceId?: string;
    filePath?: string;
    fileContent?: string;
    fileType?: 'csv' | 'json' | 'excel' | 'txt' | 'tsv';
  };
  researchQuestion: string;
  context?: {
    background?: string;
    methodology?: string;
    relatedWork?: string;
  };
  target: {
    journal?: string;
    conference?: string;
    style?: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Nature' | 'Science';
  };
  options?: {
    includeAbstract?: boolean;
    includeIntroduction?: boolean;
    includeMethods?: boolean;
    includeResults?: boolean;
    includeDiscussion?: boolean;
    includeConclusion?: boolean;
    generateFigures?: boolean;
    maxFigures?: number;
    addReferences?: boolean;
    maxReferences?: number;
    validateQuality?: boolean;
    formatOutput?: boolean;
  };
}

export interface PaperGenerationPipelineResult {
  success: boolean;
  paper: {
    title: string;
    abstract?: string;
    introduction?: string;
    methods?: string;
    results?: string;
    discussion?: string;
    conclusion?: string;
    references?: string;
    formatted?: string; // Final formatted paper
  };
  figures: Array<{
    number: number;
    type: string;
    description: string;
    caption: string;
    code?: {
      python?: string;
      r?: string;
      javascript?: string;
    };
  }>;
  references: Array<{
    id: string;
    title: string;
    authors: string[];
    year: number;
    citations: {
      inText: string;
      full: string;
    };
  }>;
  quality?: {
    overallScore: number;
    passed: boolean;
    issues: string[];
  };
  metadata: {
    wordCount: number;
    pageCount: number;
    figureCount: number;
    referenceCount: number;
    format: string;
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

export class PaperGenerationPipeline {
  private orchestrator?: ResearchOrchestrator;
  
  constructor() {
    // Orchestrator will be created when needed with proper workflow definition
  }
  
  /**
   * Execute the complete paper generation pipeline
   */
  async execute(
    input: PaperGenerationPipelineInput,
    userId: string
  ): Promise<PaperGenerationPipelineResult> {
    const startTime = Date.now();
    const workflowSteps: PaperGenerationPipelineResult['workflow']['steps'] = [];
    
    try {
      const options = {
        includeAbstract: true,
        includeIntroduction: true,
        includeMethods: true,
        includeResults: true,
        includeDiscussion: true,
        includeConclusion: true,
        generateFigures: true,
        maxFigures: 5,
        addReferences: true,
        maxReferences: 30,
        validateQuality: true,
        formatOutput: true,
        ...input.options
      };
      
      // Step 1: Read Data
      let dataReadingResult: any = null;
      if (input.dataSource) {
        const stepStart = Date.now();
        try {
          const dataReadingAgent = AgentFactory.createAgent('data_reading');
          const dataInput = {
            dataSource: input.dataSource.type,
            sourceId: input.dataSource.sourceId,
            filePath: input.dataSource.filePath,
            fileContent: input.dataSource.fileContent,
            fileType: input.dataSource.fileType
          };
          
          const result = await dataReadingAgent.execute(dataInput, {
            additionalData: { userId }
          });
          
          if (result.success) {
            dataReadingResult = result.content;
            workflowSteps.push({
              step: 'Read Data',
              agent: 'DataReadingAgent',
              status: 'completed',
              duration: Date.now() - stepStart
            });
          } else {
            throw new Error(result.error || 'Failed to read data');
          }
        } catch (error: any) {
          workflowSteps.push({
            step: 'Read Data',
            agent: 'DataReadingAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
          throw error;
        }
      }
      
      // Step 2: Write Paper Sections
      const step2Start = Date.now();
      let paperResult: any = null;
      try {
        const paperWritingAgent = AgentFactory.createAgent('paper_writing');
        const paperInput = {
          researchQuestion: input.researchQuestion,
          data: dataReadingResult?.rawData,
          context: {
            background: input.context?.background,
            methodology: input.context?.methodology || dataReadingResult?.interpretation?.description,
            results: dataReadingResult?.interpretation?.description,
            relatedWork: input.context?.relatedWork
          },
          sections: {
            includeAbstract: options.includeAbstract,
            includeIntroduction: options.includeIntroduction,
            includeMethods: options.includeMethods,
            includeResults: options.includeResults,
            includeDiscussion: options.includeDiscussion,
            includeConclusion: options.includeConclusion,
            includeReferences: false // Will add later
          },
          style: {
            format: input.target.style || 'APA',
            journal: input.target.journal
          }
        };
        
        const result = await paperWritingAgent.execute(paperInput, {
          additionalData: { userId }
        });
        
        if (result.success) {
          paperResult = result.content;
          workflowSteps.push({
            step: 'Write Paper',
            agent: 'PaperWritingAgent',
            status: 'completed',
            duration: Date.now() - step2Start
          });
        } else {
          throw new Error(result.error || 'Failed to write paper');
        }
      } catch (error: any) {
        workflowSteps.push({
          step: 'Write Paper',
          agent: 'PaperWritingAgent',
          status: 'failed',
          duration: Date.now() - step2Start
        });
        throw error;
      }
      
      // Step 3: Generate Figures
      const figures: PaperGenerationPipelineResult['figures'] = [];
      if (options.generateFigures && paperResult?.paper?.results) {
        const stepStart = Date.now();
        try {
          const figureAgent = AgentFactory.createAgent('figure_generation');
          const figureInput = {
            data: dataReadingResult?.rawData,
            dataType: dataReadingResult?.dataStructure?.format === 'tabular' ? 'numerical' : 'mixed',
            purpose: 'Visualize research findings',
            context: {
              paperSection: 'Results',
              researchQuestion: input.researchQuestion,
              keyFinding: paperResult.paper.results?.text?.substring(0, 200)
            },
            figureType: 'chart',
            chartType: 'bar'
          };
          
          const result = await figureAgent.execute(figureInput, {
            additionalData: { userId }
          });
          
          if (result.success && result.content?.figures) {
            figures.push(...result.content.figures.map((fig: any, index: number) => ({
              number: index + 1,
              type: fig.type,
              description: fig.description,
              caption: fig.caption,
              code: result.content.code
            })));
            
            workflowSteps.push({
              step: 'Generate Figures',
              agent: 'FigureGenerationAgent',
              status: 'completed',
              duration: Date.now() - stepStart
            });
          } else {
            workflowSteps.push({
              step: 'Generate Figures',
              agent: 'FigureGenerationAgent',
              status: 'skipped',
              duration: Date.now() - stepStart
            });
          }
        } catch (error) {
          console.error('Error generating figures:', error);
          workflowSteps.push({
            step: 'Generate Figures',
            agent: 'FigureGenerationAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
        }
      } else {
        workflowSteps.push({
          step: 'Generate Figures',
          agent: 'FigureGenerationAgent',
          status: 'skipped',
          duration: 0
        });
      }
      
      // Step 4: Add References
      let references: PaperGenerationPipelineResult['references'] = [];
      if (options.addReferences) {
        const stepStart = Date.now();
        try {
          const referenceAgent = AgentFactory.createAgent('reference_management');
          const referenceInput = {
            content: this.combinePaperSections(paperResult.paper),
            topics: this.extractTopics(paperResult.paper, input.researchQuestion),
            citationStyle: input.target.style || 'APA',
            action: 'all',
            context: {
              paperTitle: paperResult.paper.title,
              researchField: input.context?.background,
              keywords: this.extractKeywords(paperResult.paper)
            },
            maxReferences: options.maxReferences
          };
          
          const result = await referenceAgent.execute(referenceInput, {
            additionalData: { userId }
          });
          
          if (result.success && result.content?.references) {
            references = result.content.references.map((ref: any) => ({
              id: ref.id,
              title: ref.title,
              authors: ref.authors,
              year: ref.year,
              citations: {
                inText: ref.citations.inText,
                full: ref.citations.full
              }
            }));
            
            // Update paper with formatted content (with citations)
            if (result.content.formattedContent) {
              // Parse formatted content back into sections
              // This is a simplified approach - in production, you'd parse more carefully
              paperResult.paper = this.parseFormattedContent(result.content.formattedContent, paperResult.paper);
            }
            
            workflowSteps.push({
              step: 'Add References',
              agent: 'ReferenceManagementAgent',
              status: 'completed',
              duration: Date.now() - stepStart
            });
          } else {
            workflowSteps.push({
              step: 'Add References',
              agent: 'ReferenceManagementAgent',
              status: 'skipped',
              duration: Date.now() - stepStart
            });
          }
        } catch (error) {
          console.error('Error adding references:', error);
          workflowSteps.push({
            step: 'Add References',
            agent: 'ReferenceManagementAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
        }
      } else {
        workflowSteps.push({
          step: 'Add References',
          agent: 'ReferenceManagementAgent',
          status: 'skipped',
          duration: 0
        });
      }
      
      // Step 5: Compile Draft
      const step5Start = Date.now();
      let compiledDraft: any = null;
      try {
        const compilationAgent = AgentFactory.createAgent('draft_compilation');
        const compilationInput = {
          sections: {
            title: paperResult.paper.title,
            abstract: paperResult.paper.abstract?.text,
            introduction: paperResult.paper.introduction?.text,
            methods: paperResult.paper.methods?.text,
            results: paperResult.paper.results?.text,
            discussion: paperResult.paper.discussion?.text,
            conclusion: paperResult.paper.conclusion?.text,
            references: this.generateReferenceList(references)
          },
          metadata: {
            authors: [], // Would come from user context
            keywords: this.extractKeywords(paperResult.paper)
          },
          style: {
            format: input.target.style || 'APA',
            journal: input.target.journal
          },
          figures: figures.map(fig => ({
            number: fig.number,
            caption: fig.caption,
            placement: 'Results'
          }))
        };
        
        const result = await compilationAgent.execute(compilationInput, {
          additionalData: { userId }
        });
        
        if (result.success) {
          compiledDraft = result.content;
          workflowSteps.push({
            step: 'Compile Draft',
            agent: 'DraftCompilationAgent',
            status: 'completed',
            duration: Date.now() - step5Start
          });
        } else {
          throw new Error(result.error || 'Failed to compile draft');
        }
      } catch (error: any) {
        workflowSteps.push({
          step: 'Compile Draft',
          agent: 'DraftCompilationAgent',
          status: 'failed',
          duration: Date.now() - step5Start
        });
        throw error;
      }
      
      // Step 6: Validate Quality
      let qualityResult: any = null;
      if (options.validateQuality) {
        const stepStart = Date.now();
        try {
          const qualityAgent = AgentFactory.createAgent('quality_validation');
          const qualityInput = {
            content: compiledDraft.draft,
            contentType: 'paper',
            criteria: {
              checkCompleteness: true,
              checkStructure: true,
              checkGrammar: true,
              checkCitations: true,
              checkFormatting: true,
              checkClarity: true,
              checkAccuracy: true
            },
            requirements: {
              requiredSections: ['Title', 'Abstract', 'Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion'],
              citationStyle: input.target.style || 'APA'
            }
          };
          
          const result = await qualityAgent.execute(qualityInput, {
            additionalData: { userId }
          });
          
          if (result.success) {
            qualityResult = result.content;
            workflowSteps.push({
              step: 'Validate Quality',
              agent: 'QualityValidationAgent',
              status: 'completed',
              duration: Date.now() - stepStart
            });
          } else {
            workflowSteps.push({
              step: 'Validate Quality',
              agent: 'QualityValidationAgent',
              status: 'skipped',
              duration: Date.now() - stepStart
            });
          }
        } catch (error) {
          console.error('Error validating quality:', error);
          workflowSteps.push({
            step: 'Validate Quality',
            agent: 'QualityValidationAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
        }
      } else {
        workflowSteps.push({
          step: 'Validate Quality',
          agent: 'QualityValidationAgent',
          status: 'skipped',
          duration: 0
        });
      }
      
      // Step 7: Format Output
      let formattedOutput: string | undefined;
      if (options.formatOutput) {
        const stepStart = Date.now();
        try {
          const formattingAgent = AgentFactory.createAgent('output_formatting');
          const formattingInput = {
            content: compiledDraft.draft,
            contentType: 'paper',
            target: {
              journal: input.target.journal,
              conference: input.target.conference,
              style: input.target.style || 'APA'
            },
            requirements: {
              wordLimit: 5000,
              pageLimit: 20,
              figureLimit: options.maxFigures,
              referenceLimit: options.maxReferences
            }
          };
          
          const result = await formattingAgent.execute(formattingInput, {
            additionalData: { userId }
          });
          
          if (result.success && result.content?.formatted) {
            formattedOutput = result.content.formatted.content;
            workflowSteps.push({
              step: 'Format Output',
              agent: 'OutputFormattingAgent',
              status: 'completed',
              duration: Date.now() - stepStart
            });
          } else {
            formattedOutput = compiledDraft.draft.formatted;
            workflowSteps.push({
              step: 'Format Output',
              agent: 'OutputFormattingAgent',
              status: 'skipped',
              duration: Date.now() - stepStart
            });
          }
        } catch (error) {
          console.error('Error formatting output:', error);
          formattedOutput = compiledDraft.draft.formatted;
          workflowSteps.push({
            step: 'Format Output',
            agent: 'OutputFormattingAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
        }
      } else {
        formattedOutput = compiledDraft.draft.formatted;
        workflowSteps.push({
          step: 'Format Output',
          agent: 'OutputFormattingAgent',
          status: 'skipped',
          duration: 0
        });
      }
      
      // Build final result
      const result: PaperGenerationPipelineResult = {
        success: true,
        paper: {
          title: paperResult.paper.title,
          abstract: paperResult.paper.abstract?.text,
          introduction: paperResult.paper.introduction?.text,
          methods: paperResult.paper.methods?.text,
          results: paperResult.paper.results?.text,
          discussion: paperResult.paper.discussion?.text,
          conclusion: paperResult.paper.conclusion?.text,
          references: this.generateReferenceList(references),
          formatted: formattedOutput
        },
        figures,
        references,
        quality: qualityResult ? {
          overallScore: qualityResult.overallScore,
          passed: qualityResult.passed,
          issues: qualityResult.summary.weaknesses
        } : undefined,
        metadata: {
          wordCount: compiledDraft.draft.wordCount,
          pageCount: compiledDraft.draft.pageCount,
          figureCount: figures.length,
          referenceCount: references.length,
          format: input.target.style || 'APA'
        },
        workflow: {
          steps: workflowSteps,
          totalDuration: Date.now() - startTime
        }
      };
      
      return result;
    } catch (error: any) {
      console.error('Error in PaperGenerationPipeline:', error);
      throw error;
    }
  }
  
  /**
   * Combine paper sections into single text
   */
  private combinePaperSections(paper: any): string {
    const sections = [
      paper.title,
      paper.abstract?.text,
      paper.introduction?.text,
      paper.methods?.text,
      paper.results?.text,
      paper.discussion?.text,
      paper.conclusion?.text
    ].filter(Boolean);
    
    return sections.join('\n\n');
  }
  
  /**
   * Extract topics from paper content
   */
  private extractTopics(paper: any, researchQuestion: string): string[] {
    const topics: string[] = [];
    
    if (researchQuestion) {
      topics.push(researchQuestion);
    }
    
    // Extract keywords from title
    if (paper.title) {
      const titleWords = paper.title.split(/\s+/).filter((word: string) => word.length > 4);
      topics.push(...titleWords.slice(0, 3));
    }
    
    return topics;
  }
  
  /**
   * Extract keywords from paper
   */
  private extractKeywords(paper: any): string[] {
    // Simplified keyword extraction
    const text = this.combinePaperSections(paper);
    const words = text.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
    const wordCounts: Record<string, number> = {};
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
  
  /**
   * Generate reference list
   */
  private generateReferenceList(references: PaperGenerationPipelineResult['references']): string {
    return references
      .map((ref, index) => `${index + 1}. ${ref.citations.full}`)
      .join('\n\n');
  }
  
  /**
   * Parse formatted content back into sections
   */
  private parseFormattedContent(formattedContent: string, originalPaper: any): any {
    // This is a simplified parser - in production, you'd use more sophisticated parsing
    // For now, we'll keep the original paper structure and just note that citations were added
    return originalPaper;
  }
}

