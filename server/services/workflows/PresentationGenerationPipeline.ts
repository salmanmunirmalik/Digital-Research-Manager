/**
 * Presentation Generation Pipeline
 * Task 64: Generate PPT presentations from research data
 * 
 * Orchestrates: read data → analyze → create slides → add visualizations → format
 * 
 * This pipeline coordinates multiple agents to generate a complete presentation:
 * 1. DataReadingAgent - Read and interpret data
 * 2. DataAnalysisAgent - Analyze data for insights
 * 3. PresentationSlideAgent - Generate slides
 * 4. FigureGenerationAgent - Create visualizations
 * 5. QualityValidationAgent - Validate quality
 */

import { AgentFactory } from '../AgentFactory.js';
import { AgentResult } from '../Agent.js';

export interface PresentationGenerationPipelineInput {
  dataSource: {
    type: 'lab_notebook' | 'experiment' | 'research_data' | 'file' | 'paper';
    sourceId?: string;
    filePath?: string;
    fileContent?: string;
    fileType?: 'csv' | 'json' | 'excel' | 'txt' | 'tsv';
  };
  presentationType?: 'conference' | 'seminar' | 'defense' | 'poster' | 'webinar';
  duration?: number; // Minutes
  slideCount?: number;
  context?: {
    title?: string;
    researchQuestion?: string;
    background?: string;
  };
  options?: {
    includeDataAnalysis?: boolean;
    generateFigures?: boolean;
    maxFigures?: number;
    validateQuality?: boolean;
    addSpeakerNotes?: boolean;
  };
}

export interface PresentationGenerationPipelineResult {
  success: boolean;
  presentation: {
    title: string;
    slides: Array<{
      number: number;
      title: string;
      content: string;
      speakerNotes?: string;
      layout?: string;
      visualizations?: Array<{
        type: string;
        description: string;
      }>;
    }>;
    metadata: {
      totalSlides: number;
      estimatedDuration: number;
      sections: string[];
    };
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
  analysis?: {
    summary: string;
    keyFindings: string[];
    insights: string[];
  };
  quality?: {
    overallScore: number;
    passed: boolean;
    issues: string[];
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

export class PresentationGenerationPipeline {
  /**
   * Execute the complete presentation generation pipeline
   */
  async execute(
    input: PresentationGenerationPipelineInput,
    userId: string
  ): Promise<PresentationGenerationPipelineResult> {
    const startTime = Date.now();
    const workflowSteps: PresentationGenerationPipelineResult['workflow']['steps'] = [];
    
    try {
      const options = {
        includeDataAnalysis: true,
        generateFigures: true,
        maxFigures: 5,
        validateQuality: true,
        addSpeakerNotes: true,
        ...input.options
      };
      
      // Step 1: Read Data
      let dataReadingResult: any = null;
      if (input.dataSource && input.dataSource.type !== 'paper') {
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
            workflowSteps.push({
              step: 'Read Data',
              agent: 'DataReadingAgent',
              status: 'skipped',
              duration: Date.now() - stepStart
            });
          }
        } catch (error) {
          console.error('Error reading data:', error);
          workflowSteps.push({
            step: 'Read Data',
            agent: 'DataReadingAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
        }
      } else {
        workflowSteps.push({
          step: 'Read Data',
          agent: 'DataReadingAgent',
          status: 'skipped',
          duration: 0
        });
      }
      
      // Step 2: Analyze Data (optional)
      let analysisResult: any = null;
      if (options.includeDataAnalysis && dataReadingResult) {
        const stepStart = Date.now();
        try {
          const analysisAgent = AgentFactory.createAgent('data_analysis');
          const analysisInput = {
            data: dataReadingResult.rawData || dataReadingResult,
            dataType: dataReadingResult.dataStructure?.format === 'tabular' ? 'numerical' : 'mixed',
            researchQuestion: input.context?.researchQuestion,
            analysisType: 'descriptive'
          };
          
          const result = await analysisAgent.execute(analysisInput, {
            additionalData: { userId }
          });
          
          if (result.success) {
            analysisResult = result.content;
            workflowSteps.push({
              step: 'Analyze Data',
              agent: 'DataAnalysisAgent',
              status: 'completed',
              duration: Date.now() - stepStart
            });
          } else {
            workflowSteps.push({
              step: 'Analyze Data',
              agent: 'DataAnalysisAgent',
              status: 'skipped',
              duration: Date.now() - stepStart
            });
          }
        } catch (error) {
          console.error('Error analyzing data:', error);
          workflowSteps.push({
            step: 'Analyze Data',
            agent: 'DataAnalysisAgent',
            status: 'failed',
            duration: Date.now() - stepStart
          });
        }
      } else {
        workflowSteps.push({
          step: 'Analyze Data',
          agent: 'DataAnalysisAgent',
          status: 'skipped',
          duration: 0
        });
      }
      
      // Step 3: Extract source content
      let sourceContent = '';
      if (input.dataSource.type === 'paper' && input.dataSource.sourceId) {
        // Would query database for paper content
        sourceContent = input.context?.background || 'Research paper content';
      } else if (dataReadingResult) {
        sourceContent = JSON.stringify(dataReadingResult.interpretation || dataReadingResult);
      } else if (input.dataSource.fileContent) {
        sourceContent = input.dataSource.fileContent;
      } else {
        sourceContent = input.context?.background || 'Research content';
      }
      
      // Step 4: Generate Presentation Slides
      const stepStart = Date.now();
      let presentationResult: any = null;
      try {
        const slideAgent = AgentFactory.createAgent('presentation_slide');
        const slideInput = {
          source: {
            type: input.dataSource.type === 'paper' ? 'paper' : 'research_data',
            content: sourceContent,
            paperId: input.dataSource.type === 'paper' ? input.dataSource.sourceId : undefined,
            data: dataReadingResult?.rawData
          },
          presentationType: input.presentationType || 'conference',
          duration: input.duration,
          slideCount: input.slideCount,
          structure: {
            includeTitle: true,
            includeOutline: true,
            includeIntroduction: true,
            includeMethods: true,
            includeResults: true,
            includeDiscussion: true,
            includeConclusion: true
          },
          context: {
            title: input.context?.title,
            researchQuestion: input.context?.researchQuestion,
            background: input.context?.background
          }
        };
        
        const result = await slideAgent.execute(slideInput, {
          additionalData: { userId }
        });
        
        if (result.success) {
          presentationResult = result.content;
          workflowSteps.push({
            step: 'Generate Slides',
            agent: 'PresentationSlideAgent',
            status: 'completed',
            duration: Date.now() - stepStart
          });
        } else {
          throw new Error(result.error || 'Failed to generate slides');
        }
      } catch (error: any) {
        workflowSteps.push({
          step: 'Generate Slides',
          agent: 'PresentationSlideAgent',
          status: 'failed',
          duration: Date.now() - stepStart
        });
        throw error;
      }
      
      // Step 5: Generate Figures
      const figures: PresentationGenerationPipelineResult['figures'] = [];
      if (options.generateFigures && (dataReadingResult || analysisResult)) {
        const stepStart = Date.now();
        try {
          const figureAgent = AgentFactory.createAgent('figure_generation');
          const figureInput = {
            data: dataReadingResult?.rawData || analysisResult?.analysis,
            dataType: dataReadingResult?.dataStructure?.format === 'tabular' ? 'numerical' : 'mixed',
            purpose: 'Visualize key findings for presentation',
            context: {
              paperSection: 'Results',
              researchQuestion: input.context?.researchQuestion,
              keyFinding: analysisResult?.insights?.[0] || 'Key research finding'
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
            
            // Associate figures with slides
            if (presentationResult.presentation.slides.length > 0) {
              const resultsSlideIndex = presentationResult.presentation.slides.findIndex(
                (slide: any) => slide.title.toLowerCase().includes('result')
              );
              
              if (resultsSlideIndex !== -1) {
                presentationResult.presentation.slides[resultsSlideIndex].visualizations = 
                  figures.map(fig => ({
                    type: fig.type,
                    description: fig.description
                  }));
              }
            }
            
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
      
      // Step 6: Validate Quality
      let qualityResult: any = null;
      if (options.validateQuality) {
        const stepStart = Date.now();
        try {
          const qualityAgent = AgentFactory.createAgent('quality_validation');
          const qualityInput = {
            content: presentationResult.presentation,
            contentType: 'presentation',
            criteria: {
              checkCompleteness: true,
              checkStructure: true,
              checkGrammar: true,
              checkClarity: true
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
      
      // Build final result
      const result: PresentationGenerationPipelineResult = {
        success: true,
        presentation: presentationResult.presentation,
        figures,
        analysis: analysisResult ? {
          summary: analysisResult.analysis?.summary?.dataOverview || 'Data analysis completed',
          keyFindings: analysisResult.analysis?.insights?.map((i: any) => i.finding) || [],
          insights: analysisResult.analysis?.insights?.map((i: any) => i.implications) || []
        } : undefined,
        quality: qualityResult ? {
          overallScore: qualityResult.overallScore,
          passed: qualityResult.passed,
          issues: qualityResult.summary.weaknesses
        } : undefined,
        workflow: {
          steps: workflowSteps,
          totalDuration: Date.now() - startTime
        }
      };
      
      return result;
    } catch (error: any) {
      console.error('Error in PresentationGenerationPipeline:', error);
      throw error;
    }
  }
}

