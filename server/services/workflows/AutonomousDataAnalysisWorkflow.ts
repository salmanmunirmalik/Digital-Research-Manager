/**
 * Autonomous Data Analysis Workflow
 * Task 19: Create autonomous data analysis workflow
 * 
 * An autonomous workflow that independently:
 * 1. Reads and interprets data
 * 2. Performs comprehensive analysis
 * 3. Identifies patterns and insights
 * 4. Generates visualizations
 * 5. Provides actionable recommendations
 */

import { AgentFactory } from '../AgentFactory.js';
import { AgentContext } from '../Agent.js';
import { TaskAnalysisEngine } from '../TaskAnalysisEngine.js';

export interface AutonomousDataAnalysisInput {
  dataSource: {
    type: 'lab_notebook' | 'experiment' | 'research_data' | 'file';
    sourceId?: string;
    filePath?: string;
    fileContent?: string;
    fileType?: 'csv' | 'json' | 'excel' | 'txt' | 'tsv';
  };
  researchQuestion?: string;
  hypothesis?: string;
  analysisType?: 'exploratory' | 'confirmatory' | 'predictive' | 'comprehensive';
  focusAreas?: string[]; // Specific areas to focus on
  constraints?: {
    timeLimit?: number; // Analysis time limit in minutes
    complexity?: 'simple' | 'moderate' | 'advanced';
  };
}

export interface AutonomousDataAnalysisResult {
  success: boolean;
  analysis: {
    dataOverview: {
      structure: string;
      sampleSize: number;
      variables: Array<{
        name: string;
        type: string;
        description: string;
        statistics?: {
          mean?: number;
          median?: number;
          stdDev?: number;
          min?: number;
          max?: number;
        };
      }>;
      dataQuality: {
        completeness: number; // 0-100
        issues: string[];
      };
    };
    findings: Array<{
      finding: string;
      evidence: string;
      significance: 'high' | 'medium' | 'low';
      confidence: number; // 0-100
    }>;
    patterns: Array<{
      pattern: string;
      description: string;
      variables: string[];
      strength: number; // 0-1
    }>;
    relationships: Array<{
      variable1: string;
      variable2: string;
      relationship: string;
      strength: number; // 0-1
      direction?: 'positive' | 'negative' | 'none';
      significance?: number; // p-value
    }>;
    statisticalTests: Array<{
      test: string;
      purpose: string;
      result: string;
      interpretation: string;
      significance?: number;
    }>;
    insights: Array<{
      insight: string;
      category: string;
      implications: string[];
      actionable: boolean;
    }>;
    visualizations: Array<{
      type: string;
      description: string;
      variables: string[];
      code?: {
        python?: string;
        r?: string;
        javascript?: string;
      };
    }>;
  };
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>;
  nextSteps: Array<{
    step: string;
    description: string;
    rationale: string;
  }>;
  metadata: {
    analysisType: string;
    complexity: string;
    duration: number;
    dataQuality: string;
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

export class AutonomousDataAnalysisWorkflow {
  /**
   * Execute autonomous data analysis
   */
  async execute(
    input: AutonomousDataAnalysisInput,
    userId: string,
    context: AgentContext
  ): Promise<AutonomousDataAnalysisResult> {
    const startTime = Date.now();
    const workflowSteps: AutonomousDataAnalysisResult['workflow']['steps'] = [];
    
    try {
      const analysisType = input.analysisType || 'comprehensive';
      const complexity = input.constraints?.complexity || 'moderate';
      
      // Step 1: Read and interpret data
      const stepStart = Date.now();
      let dataReadingResult: any = null;
      try {
        const dataReadingAgent = AgentFactory.createAgent('data_reading');
        
        const readingInput = {
          dataSource: input.dataSource.type,
          sourceId: input.dataSource.sourceId,
          filePath: input.dataSource.filePath,
          fileContent: input.dataSource.fileContent,
          fileType: input.dataSource.fileType
        };
        
        const result = await dataReadingAgent.execute(readingInput, context);
        
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
        console.error('Error reading data:', error);
        workflowSteps.push({
          step: 'Read Data',
          agent: 'DataReadingAgent',
          status: 'failed',
          duration: Date.now() - stepStart
        });
        throw error;
      }
      
      // Step 2: Perform comprehensive data analysis
      const stepStart2 = Date.now();
      let analysisResult: any = null;
      try {
        const dataAnalysisAgent = AgentFactory.createAgent('data_analysis');
        
        const analysisInput = {
          data: dataReadingResult.rawData || dataReadingResult,
          dataType: dataReadingResult.dataStructure?.format === 'tabular' ? 'numerical' : 'mixed',
          analysisType: analysisType === 'comprehensive' ? 'exploratory' : analysisType,
          researchQuestion: input.researchQuestion,
          hypothesis: input.hypothesis,
          variables: this.extractVariables(dataReadingResult)
        };
        
        const result = await dataAnalysisAgent.execute(analysisInput, context);
        
        if (result.success) {
          analysisResult = result.content;
          workflowSteps.push({
            step: 'Analyze Data',
            agent: 'DataAnalysisAgent',
            status: 'completed',
            duration: Date.now() - stepStart2
          });
        } else {
          throw new Error(result.error || 'Failed to analyze data');
        }
      } catch (error: any) {
        console.error('Error analyzing data:', error);
        workflowSteps.push({
          step: 'Analyze Data',
          agent: 'DataAnalysisAgent',
          status: 'failed',
          duration: Date.now() - stepStart2
        });
        throw error;
      }
      
      // Step 3: Generate visualizations
      const stepStart3 = Date.now();
      let visualizations: any[] = [];
      try {
        const figureAgent = AgentFactory.createAgent('figure_generation');
        
        const figureInput = {
          data: dataReadingResult.rawData,
          dataType: dataReadingResult.dataStructure?.format === 'tabular' ? 'numerical' : 'mixed',
          purpose: 'Visualize key findings and patterns',
          context: {
            researchQuestion: input.researchQuestion,
            keyFinding: analysisResult?.insights?.[0]?.finding || 'Data analysis findings'
          },
          figureType: 'chart',
          chartType: this.determineChartType(dataReadingResult, analysisResult)
        };
        
        const result = await figureAgent.execute(figureInput, context);
        
        if (result.success && result.content?.figures) {
          visualizations = result.content.figures.map((fig: any) => ({
            type: fig.type,
            description: fig.description,
            variables: this.extractVariablesFromFigure(fig),
            code: result.content.code
          }));
          
          workflowSteps.push({
            step: 'Generate Visualizations',
            agent: 'FigureGenerationAgent',
            status: 'completed',
            duration: Date.now() - stepStart3
          });
        } else {
          workflowSteps.push({
            step: 'Generate Visualizations',
            agent: 'FigureGenerationAgent',
            status: 'skipped',
            duration: Date.now() - stepStart3
          });
        }
      } catch (error) {
        console.error('Error generating visualizations:', error);
        workflowSteps.push({
          step: 'Generate Visualizations',
          agent: 'FigureGenerationAgent',
          status: 'failed',
          duration: Date.now() - stepStart3
        });
      }
      
      // Step 4: Enhance analysis with advanced insights
      const stepStart4 = Date.now();
      let enhancedInsights: any = null;
      try {
        const apiAssignment = await this.getApiAssignment(userId, 'data_analysis');
        if (apiAssignment) {
          const { AIProviderFactory } = await import('../AIProviderFactory.js');
          const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
          
          const insightPrompt = `Provide advanced insights and recommendations based on the following data analysis.

Research Question: ${input.researchQuestion || 'Not specified'}
Data Overview: ${JSON.stringify(dataReadingResult.dataStructure || {}, null, 2)}
Analysis Results: ${JSON.stringify(analysisResult?.analysis || {}, null, 2)}
Key Findings: ${JSON.stringify(analysisResult?.insights || [], null, 2)}

Provide:
1. Additional insights not captured in basic analysis
2. Actionable recommendations
3. Next steps for further analysis
4. Potential limitations or concerns

Format as JSON:
{
  "insights": [
    {
      "insight": "Insight description",
      "category": "Category",
      "implications": ["Implication 1", "Implication 2"],
      "actionable": true/false
    }
  ],
  "recommendations": [
    {
      "category": "Category",
      "recommendation": "Recommendation text",
      "priority": "high|medium|low",
      "rationale": "Why this is important"
    }
  ],
  "nextSteps": [
    {
      "step": "Step description",
      "description": "Detailed description",
      "rationale": "Why this step is needed"
    }
  ]
}`;
          
          const response = await aiProvider.chat([
            { role: 'system', content: 'You are an expert data scientist. Provide deep insights, actionable recommendations, and next steps in JSON format.' },
            { role: 'user', content: insightPrompt }
          ], {
            apiKey: apiAssignment.apiKey,
            temperature: 0.5,
            maxTokens: 3000
          });
          
          try {
            enhancedInsights = JSON.parse(response.content);
          } catch {
            enhancedInsights = {
              insights: [],
              recommendations: [],
              nextSteps: []
            };
          }
        } else {
          enhancedInsights = {
            insights: [],
            recommendations: [],
            nextSteps: []
          };
        }
        
        workflowSteps.push({
          step: 'Generate Advanced Insights',
          agent: 'AIProvider',
          status: 'completed',
          duration: Date.now() - stepStart4
        });
      } catch (error) {
        console.error('Error generating advanced insights:', error);
        enhancedInsights = {
          insights: [],
          recommendations: [],
          nextSteps: []
        };
        workflowSteps.push({
          step: 'Generate Advanced Insights',
          agent: 'AIProvider',
          status: 'failed',
          duration: Date.now() - stepStart4
        });
      }
      
      // Build final result
      const result: AutonomousDataAnalysisResult = {
        success: true,
        analysis: {
          dataOverview: {
            structure: dataReadingResult.dataStructure?.format || 'unknown',
            sampleSize: dataReadingResult.dataStructure?.rows || 0,
            variables: this.extractVariableDetails(dataReadingResult),
            dataQuality: {
              completeness: this.calculateCompleteness(dataReadingResult),
              issues: dataReadingResult.dataStructure?.summary?.missingValues 
                ? Object.entries(dataReadingResult.dataStructure.summary.missingValues)
                    .filter(([_, count]: [string, any]) => count > 0)
                    .map(([varName, count]: [string, any]) => `${varName}: ${count} missing values`)
                : []
            }
          },
          findings: analysisResult?.analysis?.insights?.map((i: any) => ({
            finding: i.finding,
            evidence: i.evidence,
            significance: this.assessSignificance(i),
            confidence: 75 // Default confidence
          })) || [],
          patterns: analysisResult?.analysis?.patterns || [],
          relationships: this.extractRelationships(analysisResult),
          statisticalTests: analysisResult?.analysis?.statisticalTests || [],
          insights: [
            ...(analysisResult?.analysis?.insights || []),
            ...(enhancedInsights?.insights || [])
          ],
          visualizations
        },
        recommendations: enhancedInsights?.recommendations || [],
        nextSteps: enhancedInsights?.nextSteps || [],
        metadata: {
          analysisType,
          complexity,
          duration: Date.now() - startTime,
          dataQuality: this.assessDataQuality(dataReadingResult)
        },
        workflow: {
          steps: workflowSteps,
          totalDuration: Date.now() - startTime
        }
      };
      
      return result;
    } catch (error: any) {
      console.error('Error in AutonomousDataAnalysisWorkflow:', error);
      throw error;
    }
  }
  
  /**
   * Extract variables from data reading result
   */
  private extractVariables(dataReadingResult: any): any {
    if (!dataReadingResult?.dataStructure?.columns) {
      return {};
    }
    
    const numericColumns = dataReadingResult.dataStructure.summary?.numericColumns || [];
    const categoricalColumns = dataReadingResult.dataStructure.summary?.categoricalColumns || [];
    
    return {
      independent: numericColumns.slice(0, 2),
      dependent: numericColumns.slice(2, 3),
      covariates: categoricalColumns
    };
  }
  
  /**
   * Extract variable details
   */
  private extractVariableDetails(dataReadingResult: any): Array<{
    name: string;
    type: string;
    description: string;
    statistics?: any;
  }> {
    if (!dataReadingResult?.dataStructure?.columns) {
      return [];
    }
    
    return dataReadingResult.dataStructure.columns.map((col: string) => ({
      name: col,
      type: dataReadingResult.dataStructure.dataTypes?.[col] || 'unknown',
      description: dataReadingResult.interpretation?.variables?.find((v: any) => v.name === col)?.description || '',
      statistics: dataReadingResult.interpretation?.variables?.find((v: any) => v.name === col)?.range
    }));
  }
  
  /**
   * Calculate data completeness
   */
  private calculateCompleteness(dataReadingResult: any): number {
    if (!dataReadingResult?.dataStructure?.summary?.missingValues) {
      return 100;
    }
    
    const totalCells = (dataReadingResult.dataStructure.rows || 0) * (dataReadingResult.dataStructure.columns?.length || 0);
    const missingCells = Object.values(dataReadingResult.dataStructure.summary.missingValues)
      .reduce((sum: number, count: any) => sum + count, 0);
    
    if (totalCells === 0) return 100;
    
    return Math.round(((totalCells - missingCells) / totalCells) * 100);
  }
  
  /**
   * Extract relationships from analysis
   */
  private extractRelationships(analysisResult: any): Array<{
    variable1: string;
    variable2: string;
    relationship: string;
    strength: number;
    direction?: 'positive' | 'negative' | 'none';
    significance?: number;
  }> {
    const relationships: any[] = [];
    
    // From interpretation
    if (analysisResult?.interpretation?.relationships) {
      relationships.push(...analysisResult.interpretation.relationships.map((r: any) => ({
        variable1: r.variable1,
        variable2: r.variable2,
        relationship: r.relationship,
        strength: r.strength || 0.5,
        direction: r.direction
      })));
    }
    
    return relationships;
  }
  
  /**
   * Assess significance
   */
  private assessSignificance(insight: any): 'high' | 'medium' | 'low' {
    // Simplified assessment
    if (insight.significance === 'high' || insight.implications?.length > 2) {
      return 'high';
    }
    if (insight.significance === 'medium' || insight.implications?.length > 0) {
      return 'medium';
    }
    return 'low';
  }
  
  /**
   * Assess data quality
   */
  private assessDataQuality(dataReadingResult: any): string {
    const completeness = this.calculateCompleteness(dataReadingResult);
    
    if (completeness >= 95) return 'high';
    if (completeness >= 80) return 'medium';
    return 'low';
  }
  
  /**
   * Determine appropriate chart type
   */
  private determineChartType(dataReadingResult: any, analysisResult: any): string {
    const numericCount = dataReadingResult?.dataStructure?.summary?.numericColumns?.length || 0;
    const categoricalCount = dataReadingResult?.dataStructure?.summary?.categoricalColumns?.length || 0;
    
    if (numericCount >= 2) return 'scatter';
    if (categoricalCount > 0) return 'bar';
    if (numericCount === 1) return 'histogram';
    return 'bar';
  }
  
  /**
   * Extract variables from figure
   */
  private extractVariablesFromFigure(figure: any): string[] {
    if (figure.specification?.dataMapping) {
      const mapping = figure.specification.dataMapping;
      return [
        mapping.xAxis,
        mapping.yAxis,
        ...(mapping.series || [])
      ].filter(Boolean);
    }
    return [];
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

