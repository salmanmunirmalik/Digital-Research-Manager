/**
 * Unified presentation generation — prefer multi-agent pipeline, keep legacy UI shape.
 */

import { PresentationGenerationPipeline } from '../workflows/PresentationGenerationPipeline.js';
import { gateAgentExecution } from '../safety/agentSafetyGate.js';

export type LegacyPresentation = {
  title: string;
  theme: string;
  slides: Array<{
    id: string;
    order: number;
    title: string;
    content: string;
    type: 'title' | 'content' | 'conclusion' | 'data';
    notes?: string;
    visualSuggestions?: string[];
    dataPoints?: string[];
  }>;
  metadata: {
    generatedAt: string;
    totalSlides: number;
    context: string;
    engine?: string;
    qualityScore?: number;
  };
};

function inferSlideType(
  index: number,
  total: number,
  title: string
): 'title' | 'content' | 'conclusion' | 'data' {
  const t = title.toLowerCase();
  if (index === 0 || t.includes('title') || t.includes('agenda')) return 'title';
  if (index === total - 1 || t.includes('conclusion') || t.includes('thank')) {
    return 'conclusion';
  }
  if (t.includes('result') || t.includes('data') || t.includes('figure')) return 'data';
  return 'content';
}

function mapPipelineToLegacy(
  pipelineResult: Awaited<ReturnType<PresentationGenerationPipeline['execute']>>,
  topic: string,
  context: string,
  theme: string
): LegacyPresentation {
  const slidesRaw = pipelineResult.presentation?.slides || [];
  const slides = slidesRaw.map((s, i) => ({
    id: `slide-${s.number || i + 1}`,
    order: s.number || i + 1,
    title: s.title || `Slide ${i + 1}`,
    content: s.content || '',
    type: inferSlideType(i, slidesRaw.length, s.title || ''),
    notes: s.speakerNotes,
    visualSuggestions: (s.visualizations || []).map((v) => v.description || v.type),
  }));

  return {
    title: pipelineResult.presentation?.title || topic,
    theme,
    slides,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalSlides: slides.length,
      context,
      engine: 'presentation_pipeline',
      qualityScore: pipelineResult.quality?.overallScore,
    },
  };
}

export class UnifiedPresentationService {
  /**
   * Generate a full presentation compatible with AIPresentationModal.
   * Uses PresentationGenerationPipeline first; optional legacyFallback for resilience.
   */
  static async generateFull(opts: {
    userId: string;
    topic: string;
    context?: string;
    slides?: number;
    theme?: string;
    userRole?: string;
    legacyFallback?: (topic: string, context: string, slides: number, theme: string) => Promise<{
      presentation: LegacyPresentation;
    }>;
  }): Promise<{ success: boolean; presentation: LegacyPresentation; engine: string }> {
    const topic = opts.topic.trim();
    const context = (opts.context || '').trim();
    const slides = Math.min(20, Math.max(3, opts.slides || 8));
    const theme = opts.theme || 'research-professional';

    const gate = await gateAgentExecution({
      userId: opts.userId,
      agentType: 'presentation_slide',
      input: { topic, context, slides },
      userRole: opts.userRole,
    });
    if (!gate.allowed) {
      throw new Error(gate.blockedReason || 'Presentation blocked by safety policy');
    }

    try {
      const pipeline = new PresentationGenerationPipeline();
      const result = await pipeline.execute(
        {
          dataSource: {
            type: 'file',
            fileContent: [
              `Presentation topic: ${topic}`,
              context ? `Context / evidence notes:\n${context}` : '',
            ]
              .filter(Boolean)
              .join('\n\n'),
            fileType: 'txt',
          },
          presentationType: 'seminar',
          duration: Math.max(10, slides * 1.5),
          slideCount: slides,
          context: {
            title: topic,
            researchQuestion: topic,
            background: context,
          },
          options: {
            includeDataAnalysis: false,
            generateFigures: false,
            validateQuality: true,
            addSpeakerNotes: true,
          },
        },
        opts.userId
      );

      if (!result.success || !result.presentation?.slides?.length) {
        throw new Error('Pipeline returned empty presentation');
      }

      return {
        success: true,
        presentation: mapPipelineToLegacy(result, topic, context, theme),
        engine: 'presentation_pipeline',
      };
    } catch (pipelineError) {
      console.warn(
        'Presentation pipeline failed, trying legacy fallback:',
        (pipelineError as Error)?.message
      );
      if (!opts.legacyFallback) throw pipelineError;

      const legacy = await opts.legacyFallback(topic, context, slides, theme);
      return {
        success: true,
        presentation: {
          ...legacy.presentation,
          metadata: {
            ...legacy.presentation.metadata,
            engine: 'legacy_openai',
          },
        },
        engine: 'legacy_openai',
      };
    }
  }
}
