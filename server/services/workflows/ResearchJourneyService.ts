/**
 * Research Journey — productized multi-step paths from idea/evidence → paper, slides, or experiment.
 */

import { AgentFactory } from '../AgentFactory.js';
import { UserContextRetriever } from '../UserContextRetriever.js';
import { PaperGenerationPipeline } from './PaperGenerationPipeline.js';
import { PresentationGenerationPipeline } from './PresentationGenerationPipeline.js';
import { AutonomousExperimentDesignWorkflow } from './AutonomousExperimentDesignWorkflow.js';
import { AutonomousLiteratureSynthesisWorkflow } from './AutonomousLiteratureSynthesisWorkflow.js';

export type JourneyType =
  | 'idea_to_paper'
  | 'idea_to_presentation'
  | 'evidence_to_paper'
  | 'evidence_to_presentation'
  | 'idea_to_experiment';

export type JourneyDepth = 'quick' | 'full';

export interface JourneyRequest {
  journeyType: JourneyType;
  researchQuestion: string;
  idea?: string;
  background?: string;
  dataSource?: {
    type: 'lab_notebook' | 'experiment' | 'research_data' | 'file';
    sourceId?: string;
    fileContent?: string;
    fileType?: 'csv' | 'json' | 'excel' | 'txt' | 'tsv';
  };
  target?: {
    journal?: string;
    style?: 'APA' | 'MLA' | 'Chicago' | 'IEEE' | 'Nature' | 'Science';
  };
  presentationType?: 'conference' | 'seminar' | 'defense' | 'poster' | 'webinar';
  depth?: JourneyDepth;
  includeLiterature?: boolean;
}

export interface JourneyStepResult {
  id: string;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  durationMs: number;
  summary?: string;
  error?: string;
  data?: unknown;
}

export interface JourneyResult {
  success: boolean;
  journeyType: JourneyType;
  researchQuestion: string;
  steps: JourneyStepResult[];
  artifacts: {
    hypothesis?: unknown;
    literature?: unknown;
    experimentDesign?: unknown;
    paper?: unknown;
    presentation?: unknown;
  };
  totalDurationMs: number;
  error?: string;
}

export const JOURNEY_CATALOG: Array<{
  id: JourneyType;
  name: string;
  description: string;
  needsSource: boolean;
  estimatedMinutes: { quick: number; full: number };
}> = [
  {
    id: 'idea_to_paper',
    name: 'Idea → Paper draft',
    description: 'Refine a research idea, optionally scan literature, then draft manuscript sections.',
    needsSource: false,
    estimatedMinutes: { quick: 3, full: 8 },
  },
  {
    id: 'idea_to_presentation',
    name: 'Idea → Slides',
    description: 'Turn a research idea into a conference or seminar slide outline.',
    needsSource: false,
    estimatedMinutes: { quick: 2, full: 5 },
  },
  {
    id: 'evidence_to_paper',
    name: 'Evidence → Paper draft',
    description: 'Ground a manuscript in a notebook entry, experiment, or evidence pack.',
    needsSource: true,
    estimatedMinutes: { quick: 4, full: 10 },
  },
  {
    id: 'evidence_to_presentation',
    name: 'Evidence → Slides',
    description: 'Build a presentation from your evidence pack or experimental results.',
    needsSource: true,
    estimatedMinutes: { quick: 3, full: 7 },
  },
  {
    id: 'idea_to_experiment',
    name: 'Idea → Experiment design',
    description: 'Design objectives, variables, controls, and a stepwise methodology from a question.',
    needsSource: false,
    estimatedMinutes: { quick: 2, full: 4 },
  },
];

function summarize(value: unknown, fallback: string): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value.slice(0, 240);
  try {
    const s = JSON.stringify(value);
    return s.slice(0, 240);
  } catch {
    return fallback;
  }
}

export class ResearchJourneyService {
  static async run(userId: string, request: JourneyRequest): Promise<JourneyResult> {
    const start = Date.now();
    const depth: JourneyDepth = request.depth || 'quick';
    const steps: JourneyStepResult[] = [];
    const artifacts: JourneyResult['artifacts'] = {};
    const question = (request.researchQuestion || request.idea || '').trim();

    if (!question) {
      return {
        success: false,
        journeyType: request.journeyType,
        researchQuestion: '',
        steps,
        artifacts,
        totalDurationMs: 0,
        error: 'researchQuestion (or idea) is required',
      };
    }

    const catalog = JOURNEY_CATALOG.find((j) => j.id === request.journeyType);
    if (!catalog) {
      return {
        success: false,
        journeyType: request.journeyType,
        researchQuestion: question,
        steps,
        artifacts,
        totalDurationMs: 0,
        error: `Unknown journey type: ${request.journeyType}`,
      };
    }

    if (catalog.needsSource && !request.dataSource?.sourceId && !request.dataSource?.fileContent) {
      return {
        success: false,
        journeyType: request.journeyType,
        researchQuestion: question,
        steps,
        artifacts,
        totalDurationMs: 0,
        error: 'This journey requires a data source (notebook, experiment, or evidence pack).',
      };
    }

    try {
      const userContext = await UserContextRetriever.retrieveContext(userId, question);
      const agentContext = {
        userContext,
        conversationHistory: [] as any[],
        additionalData: { userId },
      };

      // Step A: Hypothesis / idea refinement (idea-based journeys)
      if (request.journeyType.startsWith('idea_')) {
        const t0 = Date.now();
        try {
          const agent = AgentFactory.createAgent('hypothesis_generation');
          const result = await agent.execute(
            {
              researchQuestion: question,
              context: {
                existingFindings: request.background || request.idea || '',
              },
              numberOfHypotheses: depth === 'full' ? 4 : 2,
              type: 'all',
            },
            agentContext
          );
          if (result.success) {
            artifacts.hypothesis = result.content;
            steps.push({
              id: 'hypothesis',
              name: 'Refine hypothesis',
              status: 'completed',
              durationMs: Date.now() - t0,
              summary: summarize(result.content, 'Hypothesis generated'),
              data: result.content,
            });
          } else {
            steps.push({
              id: 'hypothesis',
              name: 'Refine hypothesis',
              status: 'failed',
              durationMs: Date.now() - t0,
              error: result.error || 'Hypothesis generation failed',
            });
          }
        } catch (e: any) {
          steps.push({
            id: 'hypothesis',
            name: 'Refine hypothesis',
            status: 'failed',
            durationMs: Date.now() - t0,
            error: e?.message || 'Hypothesis generation failed',
          });
        }
      }

      // Step B: Optional literature synthesis
      const wantLit =
        request.includeLiterature ??
        (depth === 'full' &&
          (request.journeyType === 'idea_to_paper' ||
            request.journeyType === 'idea_to_experiment'));

      if (wantLit) {
        const t0 = Date.now();
        try {
          const lit = new AutonomousLiteratureSynthesisWorkflow();
          const litResult = await lit.execute(
            {
              topic: question,
              maxPapers: depth === 'full' ? 12 : 6,
              depth: depth === 'full' ? 'moderate' : 'shallow',
            },
            userId,
            agentContext
          );
          artifacts.literature = litResult;
          steps.push({
            id: 'literature',
            name: 'Literature scan',
            status: litResult.success ? 'completed' : 'failed',
            durationMs: Date.now() - t0,
            summary: litResult.success
              ? summarize(litResult.synthesis || litResult, 'Literature synthesized')
              : undefined,
            error: litResult.success ? undefined : 'Literature synthesis failed',
            data: litResult,
          });
        } catch (e: any) {
          steps.push({
            id: 'literature',
            name: 'Literature scan',
            status: 'failed',
            durationMs: Date.now() - t0,
            error: e?.message || 'Literature synthesis failed',
          });
        }
      } else {
        steps.push({
          id: 'literature',
          name: 'Literature scan',
          status: 'skipped',
          durationMs: 0,
          summary: 'Skipped (enable literature or use full depth)',
        });
      }

      // Resolve data source for paper/presentation
      const dataSource =
        request.dataSource ||
        ({
          type: 'file' as const,
          fileContent: [
            `Research question: ${question}`,
            request.idea ? `Idea: ${request.idea}` : '',
            request.background ? `Background: ${request.background}` : '',
            artifacts.hypothesis
              ? `Hypothesis context: ${summarize(artifacts.hypothesis, '')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          fileType: 'txt' as const,
        });

      const paperOptions =
        depth === 'quick'
          ? {
              includeAbstract: true,
              includeIntroduction: true,
              includeMethods: true,
              includeResults: true,
              includeDiscussion: false,
              includeConclusion: true,
              generateFigures: false,
              addReferences: false,
              validateQuality: false,
              formatOutput: false,
            }
          : {
              includeAbstract: true,
              includeIntroduction: true,
              includeMethods: true,
              includeResults: true,
              includeDiscussion: true,
              includeConclusion: true,
              generateFigures: true,
              maxFigures: 4,
              addReferences: true,
              maxReferences: 20,
              validateQuality: true,
              formatOutput: true,
            };

      // Step C: destination artifact
      if (
        request.journeyType === 'idea_to_paper' ||
        request.journeyType === 'evidence_to_paper'
      ) {
        const t0 = Date.now();
        try {
          const pipeline = new PaperGenerationPipeline();
          const paper = await pipeline.execute(
            {
              dataSource,
              researchQuestion: question,
              context: {
                background: request.background,
                relatedWork: artifacts.literature
                  ? summarize(artifacts.literature, '')
                  : undefined,
              },
              target: {
                journal: request.target?.journal,
                style: request.target?.style || 'APA',
              },
              options: paperOptions,
            },
            userId
          );
          artifacts.paper = paper;
          steps.push({
            id: 'paper',
            name: 'Draft paper',
            status: paper.success ? 'completed' : 'failed',
            durationMs: Date.now() - t0,
            summary: paper.paper?.title || 'Paper draft',
            data: paper,
          });
        } catch (e: any) {
          steps.push({
            id: 'paper',
            name: 'Draft paper',
            status: 'failed',
            durationMs: Date.now() - t0,
            error: e?.message || 'Paper generation failed',
          });
          throw e;
        }
      } else if (
        request.journeyType === 'idea_to_presentation' ||
        request.journeyType === 'evidence_to_presentation'
      ) {
        const t0 = Date.now();
        try {
          const pipeline = new PresentationGenerationPipeline();
          const presentation = await pipeline.execute(
            {
              dataSource,
              presentationType: request.presentationType || 'seminar',
              duration: depth === 'full' ? 20 : 12,
              slideCount: depth === 'full' ? 12 : 8,
              context: {
                title: question.slice(0, 120),
                researchQuestion: question,
                background: request.background,
              },
              options: {
                includeDataAnalysis: depth === 'full',
                generateFigures: depth === 'full',
                maxFigures: 3,
                validateQuality: depth === 'full',
                addSpeakerNotes: true,
              },
            },
            userId
          );
          artifacts.presentation = presentation;
          steps.push({
            id: 'presentation',
            name: 'Build slides',
            status: presentation.success ? 'completed' : 'failed',
            durationMs: Date.now() - t0,
            summary:
              presentation.presentation?.title ||
              `${presentation.presentation?.slides?.length || 0} slides`,
            data: presentation,
          });
        } catch (e: any) {
          steps.push({
            id: 'presentation',
            name: 'Build slides',
            status: 'failed',
            durationMs: Date.now() - t0,
            error: e?.message || 'Presentation generation failed',
          });
          throw e;
        }
      } else if (request.journeyType === 'idea_to_experiment') {
        const t0 = Date.now();
        try {
          const workflow = new AutonomousExperimentDesignWorkflow();
          const design = await workflow.execute(
            {
              researchQuestion: question,
              hypothesis: (() => {
                const h = artifacts.hypothesis as any;
                if (!h) return undefined;
                if (Array.isArray(h.hypotheses) && h.hypotheses[0]?.hypothesis) {
                  return String(h.hypotheses[0].hypothesis);
                }
                if (typeof h.hypothesis === 'string') return h.hypothesis;
                return undefined;
              })(),
              complexity: depth === 'full' ? 'moderate' : 'simple',
              context: {
                literature: artifacts.literature
                  ? summarize(artifacts.literature, '')
                  : undefined,
              },
            },
            userId,
            agentContext
          );
          artifacts.experimentDesign = design;
          steps.push({
            id: 'experiment',
            name: 'Design experiment',
            status: design.success ? 'completed' : 'failed',
            durationMs: Date.now() - t0,
            summary: design.design?.title || 'Experiment design',
            data: design,
          });
        } catch (e: any) {
          steps.push({
            id: 'experiment',
            name: 'Design experiment',
            status: 'failed',
            durationMs: Date.now() - t0,
            error: e?.message || 'Experiment design failed',
          });
          throw e;
        }
      }

      const failed = steps.some((s) => s.status === 'failed' && s.id !== 'literature' && s.id !== 'hypothesis');
      return {
        success: !failed,
        journeyType: request.journeyType,
        researchQuestion: question,
        steps,
        artifacts,
        totalDurationMs: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        journeyType: request.journeyType,
        researchQuestion: question,
        steps,
        artifacts,
        totalDurationMs: Date.now() - start,
        error: error?.message || 'Journey failed',
      };
    }
  }
}
