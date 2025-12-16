/**
 * Figure Generation Agent
 * Task 67: Create scientific figures and visualizations
 * 
 * Generates descriptions and specifications for scientific figures,
 * charts, graphs, and visualizations based on data and research context.
 * Can also generate image descriptions for AI image generation.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface FigureGenerationInput {
  data?: any; // Data to visualize (from DataReadingAgent or DataAnalysisAgent)
  dataType?: 'numerical' | 'categorical' | 'time_series' | 'correlation' | 'comparison';
  figureType?: 'chart' | 'graph' | 'diagram' | 'illustration' | 'schematic';
  chartType?: 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'heatmap' | 'pie' | 'network';
  purpose?: string; // What the figure should show/illustrate
  context?: {
    paperSection?: string; // Which section of paper (Results, Methods, etc.)
    researchQuestion?: string;
    keyFinding?: string; // Main finding to highlight
  };
  style?: {
    colorScheme?: 'default' | 'colorblind_friendly' | 'grayscale' | 'publication';
    format?: 'png' | 'svg' | 'pdf' | 'jpg';
    size?: { width: number; height: number };
    dpi?: number; // Resolution for publication
  };
  caption?: string; // Desired caption text
  labels?: {
    xAxis?: string;
    yAxis?: string;
    title?: string;
    legend?: string[];
  };
}

export interface FigureGenerationResult {
  success: boolean;
  figures: Array<{
    number: number;
    type: string;
    description: string; // Detailed description of what the figure shows
    specification: {
      chartType: string;
      dataMapping: {
        xAxis?: string;
        yAxis?: string;
        series?: string[];
        categories?: string[];
      };
      styling: {
        colorScheme: string;
        labels: Record<string, string>;
        annotations?: string[];
      };
    };
    caption: string;
    imagePrompt?: string; // For AI image generation (if applicable)
    recommendations?: string[];
  }>;
  metadata: {
    totalFigures: number;
    formats: string[];
    estimatedFileSize?: string;
  };
  code?: {
    python?: string; // Python code for generating the figure (e.g., matplotlib, seaborn)
    r?: string; // R code for generating the figure (e.g., ggplot2)
    javascript?: string; // JavaScript code (e.g., D3.js, Chart.js)
  };
}

export class FigureGenerationAgent extends BaseAgent implements Agent {
  readonly agentType = 'figure_generation';
  readonly agentName = 'Figure Generation Agent';
  readonly description = 'Creates scientific figures, charts, and visualizations from research data';
  
  getRequiredContext(): string[] {
    return ['experiments', 'research_data', 'notebooks'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    
    // Need at least data, purpose, or context
    if (!input.data && !input.purpose && !input.context) {
      return false;
    }
    
    return true;
  }
  
  async execute(
    input: FigureGenerationInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: data, purpose, or context required',
          content: null
        };
      }
      
      // Get API assignment for content writing or image creation
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'image_creation') || 
                           await getApiForTask(userId, 'content_writing');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for figure generation. Please add an API key in Settings.',
          content: null
        };
      }
      
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      
      // Determine figure type if not specified
      const figureType = input.figureType || this.determineFigureType(input);
      const chartType = input.chartType || this.determineChartType(input);
      
      // Generate figure specifications
      const figures = await this.generateFigureSpecifications(
        input,
        figureType,
        chartType,
        aiProvider,
        apiAssignment,
        context
      );
      
      // Generate code for creating figures
      const code = await this.generateFigureCode(input, figures, aiProvider, apiAssignment);
      
      // Generate image prompts if applicable (for illustrations, schematics)
      if (figureType === 'illustration' || figureType === 'schematic' || figureType === 'diagram') {
        for (const figure of figures) {
          figure.imagePrompt = await this.generateImagePrompt(figure, input, aiProvider, apiAssignment);
        }
      }
      
      const result: FigureGenerationResult = {
        success: true,
        figures,
        metadata: {
          totalFigures: figures.length,
          formats: input.style?.format ? [input.style.format] : ['png', 'svg'],
          estimatedFileSize: this.estimateFileSize(figures.length, input.style?.format || 'png')
        },
        code
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
      console.error('Error in FigureGenerationAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate figures',
        content: null
      };
    }
  }
  
  /**
   * Determine appropriate figure type based on input
   */
  private determineFigureType(input: FigureGenerationInput): 'chart' | 'graph' | 'diagram' | 'illustration' | 'schematic' {
    if (input.dataType === 'numerical' || input.dataType === 'time_series') {
      return 'graph';
    }
    if (input.dataType === 'categorical' || input.dataType === 'comparison') {
      return 'chart';
    }
    if (input.purpose?.toLowerCase().includes('illustrate') || input.purpose?.toLowerCase().includes('show')) {
      return 'illustration';
    }
    if (input.purpose?.toLowerCase().includes('diagram') || input.purpose?.toLowerCase().includes('schematic')) {
      return 'schematic';
    }
    return 'chart';
  }
  
  /**
   * Determine appropriate chart type based on data
   */
  private determineChartType(input: FigureGenerationInput): 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'heatmap' | 'pie' | 'network' {
    if (input.dataType === 'time_series') {
      return 'line';
    }
    if (input.dataType === 'categorical') {
      return 'bar';
    }
    if (input.dataType === 'correlation') {
      return 'scatter';
    }
    if (input.dataType === 'comparison') {
      return 'box';
    }
    return 'bar';
  }
  
  /**
   * Generate figure specifications using AI
   */
  private async generateFigureSpecifications(
    input: FigureGenerationInput,
    figureType: string,
    chartType: string,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string },
    context: AgentContext
  ): Promise<FigureGenerationResult['figures']> {
    try {
      const dataInfo = input.data
        ? `Data: ${JSON.stringify(input.data).substring(0, 1000)}`
        : 'No specific data provided';
      
      const prompt = `You are a scientific visualization expert. Design a figure specification for a research paper.

Figure Type: ${figureType}
Chart Type: ${chartType}
Purpose: ${input.purpose || 'Visualize research findings'}
${input.context?.researchQuestion ? `Research Question: ${input.context.researchQuestion}` : ''}
${input.context?.keyFinding ? `Key Finding: ${input.context.keyFinding}` : ''}
${dataInfo}

Create a detailed specification for this figure including:
1. A clear description of what the figure should show
2. Data mapping (which variables go on which axes, what series to plot)
3. Appropriate styling (colors, labels, annotations)
4. A professional caption
5. Recommendations for improving the visualization

Format your response as JSON:
{
  "description": "What the figure shows",
  "specification": {
    "chartType": "${chartType}",
    "dataMapping": {
      "xAxis": "variable name",
      "yAxis": "variable name",
      "series": ["series1", "series2"],
      "categories": ["cat1", "cat2"]
    },
    "styling": {
      "colorScheme": "${input.style?.colorScheme || 'publication'}",
      "labels": {
        "xAxis": "${input.labels?.xAxis || 'X Axis'}",
        "yAxis": "${input.labels?.yAxis || 'Y Axis'}",
        "title": "${input.labels?.title || 'Figure Title'}"
      },
      "annotations": ["annotation1", "annotation2"]
    }
  },
  "caption": "Professional figure caption",
  "recommendations": ["rec1", "rec2"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert in scientific visualization. Create detailed, publication-ready figure specifications in JSON format.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.5,
        maxTokens: 1500
      });
      
      // Parse JSON response
      try {
        const spec = JSON.parse(response.content);
        return [{
          number: 1,
          type: figureType,
          description: spec.description,
          specification: spec.specification,
          caption: spec.caption || input.caption || 'Figure caption',
          recommendations: spec.recommendations || []
        }];
      } catch {
        // If JSON parsing fails, create basic specification
        return [{
          number: 1,
          type: figureType,
          description: response.content.substring(0, 200),
          specification: {
            chartType: chartType,
            dataMapping: {
              xAxis: input.labels?.xAxis,
              yAxis: input.labels?.yAxis
            },
            styling: {
              colorScheme: input.style?.colorScheme || 'publication',
              labels: {
                xAxis: input.labels?.xAxis || 'X Axis',
                yAxis: input.labels?.yAxis || 'Y Axis',
                title: input.labels?.title || 'Figure Title'
              }
            }
          },
          caption: input.caption || 'Figure caption',
          recommendations: []
        }];
      }
    } catch (error) {
      console.error('Error generating figure specifications:', error);
      return [{
        number: 1,
        type: figureType,
        description: 'Figure visualization',
        specification: {
          chartType: chartType,
          dataMapping: {},
          styling: {
            colorScheme: input.style?.colorScheme || 'publication',
            labels: {}
          }
        },
        caption: input.caption || 'Figure caption',
        recommendations: []
      }];
    }
  }
  
  /**
   * Generate code for creating figures
   */
  private async generateFigureCode(
    input: FigureGenerationInput,
    figures: FigureGenerationResult['figures'],
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<FigureGenerationResult['code']> {
    try {
      const figure = figures[0];
      if (!figure) return undefined;
      
      const prompt = `Generate code to create the following scientific figure:

Figure Type: ${figure.type}
Chart Type: ${figure.specification.chartType}
Data Mapping: ${JSON.stringify(figure.specification.dataMapping)}
Styling: ${JSON.stringify(figure.specification.styling)}
${input.data ? `Sample Data: ${JSON.stringify(input.data).substring(0, 500)}` : ''}

Generate code in the following formats:
1. Python using matplotlib/seaborn
2. R using ggplot2
3. JavaScript using Chart.js or D3.js

Format as JSON:
{
  "python": "import matplotlib.pyplot as plt\n...",
  "r": "library(ggplot2)\n...",
  "javascript": "const chart = new Chart(...)"
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert programmer specializing in data visualization. Generate clean, publication-ready code.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 2000
      });
      
      try {
        const code = JSON.parse(response.content);
        return {
          python: code.python,
          r: code.r,
          javascript: code.javascript
        };
      } catch {
        // Extract code blocks if JSON parsing fails
        const pythonMatch = response.content.match(/```python\n([\s\S]*?)\n```/);
        const rMatch = response.content.match(/```r\n([\s\S]*?)\n```/);
        const jsMatch = response.content.match(/```javascript\n([\s\S]*?)\n```/);
        
        return {
          python: pythonMatch ? pythonMatch[1] : undefined,
          r: rMatch ? rMatch[1] : undefined,
          javascript: jsMatch ? jsMatch[1] : undefined
        };
      }
    } catch (error) {
      console.error('Error generating figure code:', error);
      return undefined;
    }
  }
  
  /**
   * Generate image prompt for AI image generation
   */
  private async generateImagePrompt(
    figure: FigureGenerationResult['figures'][0],
    input: FigureGenerationInput,
    aiProvider: any,
    apiAssignment: { provider: string; apiKey: string }
  ): Promise<string> {
    try {
      const prompt = `Create a detailed image generation prompt for a scientific ${figure.type}.

Description: ${figure.description}
Purpose: ${input.purpose || 'Scientific illustration'}
${input.context?.keyFinding ? `Key Finding: ${input.context.keyFinding}` : ''}

The prompt should be:
- Detailed and specific
- Suitable for AI image generation (DALL-E, Midjourney, Stable Diffusion)
- Include style specifications (scientific, clean, professional)
- Include color scheme if relevant

Return only the image generation prompt, no additional text.`;
      
      const response = await aiProvider.chat([
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.7,
        maxTokens: 300
      });
      
      return response.content.trim();
    } catch (error) {
      console.error('Error generating image prompt:', error);
      return `Scientific ${figure.type}: ${figure.description}`;
    }
  }
  
  /**
   * Estimate file size for generated figures
   */
  private estimateFileSize(figureCount: number, format: string): string {
    // Rough estimates in KB
    const sizePerFigure: Record<string, number> = {
      'png': 200,
      'svg': 50,
      'pdf': 100,
      'jpg': 150
    };
    
    const size = (sizePerFigure[format] || 200) * figureCount;
    if (size < 1024) {
      return `${size} KB`;
    }
    return `${(size / 1024).toFixed(1)} MB`;
  }
}

