/**
 * Presentation Slide Agent
 * Task 70: Generate presentation slides with content
 * 
 * Creates presentation slides from research content, papers, or data.
 * Generates slide content, structure, and speaker notes.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface PresentationSlideInput {
  source?: {
    type: 'paper' | 'research_data' | 'experiment' | 'custom';
    content?: string; // Paper content, research summary, etc.
    paperId?: string; // If source is a paper
    data?: any; // Research data
  };
  presentationType?: 'conference' | 'seminar' | 'defense' | 'poster' | 'webinar';
  duration?: number; // Presentation duration in minutes
  slideCount?: number; // Target number of slides
  structure?: {
    includeTitle?: boolean;
    includeOutline?: boolean;
    includeIntroduction?: boolean;
    includeMethods?: boolean;
    includeResults?: boolean;
    includeDiscussion?: boolean;
    includeConclusion?: boolean;
    includeReferences?: boolean;
    includeAcknowledgments?: boolean;
  };
  style?: {
    template?: 'academic' | 'corporate' | 'minimal' | 'modern';
    colorScheme?: string;
    fontSize?: 'small' | 'medium' | 'large';
  };
  audience?: {
    level?: 'general' | 'academic' | 'expert';
    background?: string;
  };
}

export interface PresentationSlideResult {
  success: boolean;
  presentation: {
    title: string;
    slides: Array<{
      number: number;
      title: string;
      content: string; // Main content/bullet points
      speakerNotes?: string; // Notes for presenter
      layout?: 'title' | 'content' | 'two_column' | 'image_focus';
      visualizations?: Array<{
        type: string;
        description: string;
        placement: 'left' | 'right' | 'center' | 'background';
      }>;
    }>;
    metadata: {
      totalSlides: number;
      estimatedDuration: number; // minutes
      sections: string[];
    };
  };
  recommendations?: string[];
}

export class PresentationSlideAgent extends BaseAgent implements Agent {
  readonly agentType = 'presentation_slide';
  readonly agentName = 'Presentation Slide Agent';
  readonly description = 'Generates presentation slides from research content';
  
  getRequiredContext(): string[] {
    return ['papers', 'notebooks', 'experiments'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    
    // Need at least source content or paper ID
    if (!input.source) return false;
    
    if (input.source.type === 'paper' && !input.source.paperId && !input.source.content) {
      return false;
    }
    
    if (input.source.type === 'custom' && !input.source.content) {
      return false;
    }
    
    return true;
  }
  
  async execute(
    input: PresentationSlideInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: source content or paper ID required',
          content: null
        };
      }
      
      // Get API assignment for content writing
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for content writing. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      
      // Extract source content
      const sourceContent = await this.extractSourceContent(input, context);
      
      if (!sourceContent) {
        return {
          success: false,
          error: 'Failed to extract source content',
          content: null
        };
      }
      
      // Determine slide count
      const slideCount = input.slideCount || this.calculateSlideCount(input.duration || 15);
      
      // Generate presentation structure
      const structure = input.structure || this.getDefaultStructure(input.presentationType);
      
      // Generate slides
      const slides = await this.generateSlides(
        sourceContent,
        structure,
        slideCount,
        input,
        aiProvider,
        apiAssignment,
        context
      );
      
      // Generate title
      const title = await this.generateTitle(sourceContent, input, aiProvider, apiAssignment);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(slides, input);
      
      const result: PresentationSlideResult = {
        success: true,
        presentation: {
          title,
          slides,
          metadata: {
            totalSlides: slides.length,
            estimatedDuration: await this.estimateDuration({ presentation: { slides } }, config),
            sections: this.extractSections(slides)
          }
        },
        recommendations
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
      console.error('Error in PresentationSlideAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate presentation',
        content: null
      };
    }
  }
  
  /**
   * Extract source content
   */
  private async extractSourceContent(
    input: PresentationSlideInput,
    context: AgentContext
  ): Promise<string | null> {
    try {
      if (input.source?.content) {
        return input.source.content;
      }
      
      if (input.source?.type === 'paper' && input.source.paperId) {
        // Query database for paper
        const userId = context.additionalData?.userId || '';
        const { default: pool } = await import('../../../database/config.js');
        const result = await pool.query(
          `SELECT title, abstract, ai_summary FROM papers WHERE id = $1 AND user_id = $2`,
          [input.source.paperId, userId]
        );
        
        if (result.rows.length > 0) {
          const paper = result.rows[0];
          return `${paper.title}\n\n${paper.abstract || ''}\n\n${paper.ai_summary || ''}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting source content:', error);
      return null;
    }
  }
  
  /**
   * Calculate slide count based on duration
   */
  private calculateSlideCount(duration: number): number {
    // Rough estimate: 1-2 minutes per slide
    return Math.max(5, Math.min(30, Math.ceil(duration / 1.5)));
  }
  
  /**
   * Get default structure based on presentation type
   */
  private getDefaultStructure(
    presentationType?: string
  ): PresentationSlideInput['structure'] {
    const base = {
      includeTitle: true,
      includeOutline: true,
      includeIntroduction: true,
      includeMethods: true,
      includeResults: true,
      includeDiscussion: true,
      includeConclusion: true,
      includeReferences: false,
      includeAcknowledgments: false
    };
    
    switch (presentationType) {
      case 'conference':
        return { ...base, includeReferences: true };
      case 'defense':
        return { ...base, includeAcknowledgments: true };
      case 'poster':
        return {
          includeTitle: true,
          includeIntroduction: true,
          includeMethods: true,
          includeResults: true,
          includeDiscussion: true,
          includeConclusion: true,
          includeOutline: false,
          includeReferences: false,
          includeAcknowledgments: false
        };
      default:
        return base;
    }
  }
  
  /**
   * Generate slides
   */
  private async generateSlides(
    sourceContent: string,
    structure: NonNullable<PresentationSlideInput['structure']>,
    slideCount: number,
    input: PresentationSlideInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string },
    context: AgentContext
  ): Promise<PresentationSlideResult['presentation']['slides']> {
    try {
      const prompt = `Create a presentation with ${slideCount} slides based on the following research content.

Content:
${sourceContent.substring(0, 5000)}

Presentation Type: ${input.presentationType || 'conference'}
Audience: ${input.audience?.level || 'academic'}
${input.audience?.background ? `Audience Background: ${input.audience.background}` : ''}

Structure Requirements:
- Title slide: ${structure.includeTitle ? 'Yes' : 'No'}
- Outline: ${structure.includeOutline ? 'Yes' : 'No'}
- Introduction: ${structure.includeIntroduction ? 'Yes' : 'No'}
- Methods: ${structure.includeMethods ? 'Yes' : 'No'}
- Results: ${structure.includeResults ? 'Yes' : 'No'}
- Discussion: ${structure.includeDiscussion ? 'Yes' : 'No'}
- Conclusion: ${structure.includeConclusion ? 'Yes' : 'No'}

For each slide, provide:
1. Slide number
2. Title
3. Content (bullet points, concise and clear)
4. Speaker notes (brief notes for the presenter)
5. Layout suggestion (title, content, two_column, image_focus)
6. Visualization suggestions (if applicable)

Format as JSON array:
[
  {
    "number": 1,
    "title": "Slide Title",
    "content": "• Point 1\n• Point 2\n• Point 3",
    "speakerNotes": "Notes for presenter",
    "layout": "content",
    "visualizations": []
  }
]`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in creating academic presentations. Generate clear, engaging slides with appropriate content and speaker notes.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.6,
        maxTokens: 4000
      });
      
      try {
        const slides = JSON.parse(response.content);
        return slides.map((slide: any) => ({
          number: slide.number || 0,
          title: slide.title || 'Untitled',
          content: slide.content || '',
          speakerNotes: slide.speakerNotes,
          layout: slide.layout || 'content',
          visualizations: slide.visualizations || []
        }));
      } catch {
        // If JSON parsing fails, create basic slides
        return this.createBasicSlides(sourceContent, structure, slideCount);
      }
    } catch (error) {
      console.error('Error generating slides:', error);
      return this.createBasicSlides(sourceContent, structure, slideCount);
    }
  }
  
  /**
   * Create basic slides as fallback
   */
  private createBasicSlides(
    content: string,
    structure: NonNullable<PresentationSlideInput['structure']>,
    slideCount: number
  ): PresentationSlideResult['presentation']['slides'] {
    const slides: PresentationSlideResult['presentation']['slides'] = [];
    let slideNumber = 1;
    
    if (structure.includeTitle) {
      slides.push({
        number: slideNumber++,
        title: 'Title',
        content: 'Research Presentation',
        layout: 'title'
      });
    }
    
    if (structure.includeOutline) {
      slides.push({
        number: slideNumber++,
        title: 'Outline',
        content: '• Introduction\n• Methods\n• Results\n• Discussion\n• Conclusion',
        layout: 'content'
      });
    }
    
    // Split content into remaining slides
    const wordsPerSlide = Math.ceil(content.split(/\s+/).length / (slideCount - slideNumber + 1));
    const words = content.split(/\s+/);
    
    for (let i = 0; i < words.length && slideNumber <= slideCount; i += wordsPerSlide) {
      const slideContent = words.slice(i, i + wordsPerSlide).join(' ');
      slides.push({
        number: slideNumber++,
        title: `Slide ${slideNumber - 1}`,
        content: slideContent.substring(0, 200),
        layout: 'content'
      });
    }
    
    return slides;
  }
  
  /**
   * Generate presentation title
   */
  private async generateTitle(
    sourceContent: string,
    input: PresentationSlideInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<string> {
    try {
      const prompt = `Generate a concise, engaging title for a research presentation based on:

${sourceContent.substring(0, 500)}

Presentation Type: ${input.presentationType || 'conference'}

Return only the title, no additional text.`;
      
      const response = await aiProvider.chat([
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.7,
        maxTokens: 50
      });
      
      return response.content.trim().replace(/^["']|["']$/g, '');
    } catch (error) {
      console.error('Error generating title:', error);
      return 'Research Presentation';
    }
  }
  
  /**
   * Estimate presentation duration
   */
  async estimateDuration(input: any, config?: AgentConfig): Promise<number> {
    // Rough estimate: 1-2 minutes per slide
    if (input?.presentation?.slides) {
      return Math.ceil(input.presentation.slides.length * 1.5);
    }
    // Default estimate based on slideCount if provided
    const slideCount = input?.slideCount || 10;
    return Math.ceil(slideCount * 1.5);
  }
  
  /**
   * Extract sections from slides
   */
  private extractSections(slides: PresentationSlideResult['presentation']['slides']): string[] {
    const sections = new Set<string>();
    slides.forEach(slide => {
      const title = slide.title.toLowerCase();
      if (title.includes('introduction')) sections.add('Introduction');
      if (title.includes('method')) sections.add('Methods');
      if (title.includes('result')) sections.add('Results');
      if (title.includes('discussion')) sections.add('Discussion');
      if (title.includes('conclusion')) sections.add('Conclusion');
    });
    return Array.from(sections);
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    slides: PresentationSlideResult['presentation']['slides'],
    input: PresentationSlideInput
  ): string[] {
    const recommendations: string[] = [];
    
    if (slides.length < 5) {
      recommendations.push('Consider adding more slides for better coverage');
    }
    
    if (slides.length > 30) {
      recommendations.push('Presentation may be too long. Consider condensing content');
    }
    
    const slidesWithNotes = slides.filter(s => s.speakerNotes).length;
    if (slidesWithNotes < slides.length * 0.5) {
      recommendations.push('Add speaker notes to more slides for better presentation delivery');
    }
    
    const slidesWithVisuals = slides.filter(s => s.visualizations && s.visualizations.length > 0).length;
    if (slidesWithVisuals < slides.length * 0.3) {
      recommendations.push('Consider adding more visualizations to enhance engagement');
    }
    
    if (input.presentationType === 'conference' && !slides.some(s => s.title.toLowerCase().includes('reference'))) {
      recommendations.push('Add a references slide for conference presentations');
    }
    
    return recommendations;
  }
}

