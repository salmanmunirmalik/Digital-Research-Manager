/**
 * Data Analysis Agent
 * Task 10: Analyze experimental data and provide insights
 * 
 * Analyzes experimental data, identifies patterns, performs statistical analysis,
 * and provides actionable insights and interpretations.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { VisualizationRecommender } from '../VisualizationRecommender.js';

export interface DataAnalysisInput {
  data: any; // Can be structured data, CSV text, JSON, or description
  dataType?: 'numerical' | 'categorical' | 'time_series' | 'mixed';
  analysisType?: 'descriptive' | 'inferential' | 'exploratory' | 'predictive' | 'comparative';
  researchQuestion?: string;
  hypothesis?: string;
  variables?: {
    independent?: string[];
    dependent?: string[];
    covariates?: string[];
  };
  context?: string; // Additional context about the experiment
}

export interface DataAnalysisResult {
  analysis: {
    summary: {
      dataOverview: string;
      sampleSize?: number;
      variables: string[];
      dataQuality: 'high' | 'medium' | 'low';
    };
    descriptiveStats?: {
      variable: string;
      mean?: number;
      median?: number;
      stdDev?: number;
      min?: number;
      max?: number;
      distribution?: string;
    }[];
    patterns: {
      pattern: string;
      description: string;
      significance?: string;
    }[];
    statisticalTests?: {
      test: string;
      purpose: string;
      result?: string;
      interpretation?: string;
    }[];
    insights: {
      finding: string;
      evidence: string;
      implications: string;
    }[];
    visualizations?: {
      type: string;
      description: string;
      variables: string[];
      recommended: boolean;
      chartConfig?: {
        chartType: 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'heatmap' | 'pie' | 'violin';
        xAxis?: string;
        yAxis?: string;
        colorBy?: string;
        title?: string;
        insights?: string[];
      };
    }[];
    limitations?: string[];
    recommendations?: string[];
  };
  interpretation: string;
  conclusions: string[];
  wordCount: number;
}

export class DataAnalysisAgent extends BaseAgent implements Agent {
  readonly agentType = 'data_analysis';
  readonly agentName = 'Data Analysis Agent';
  readonly description = 'Analyzes experimental data, identifies patterns, and provides statistical insights';
  
  getRequiredContext(): string[] {
    return ['experiments', 'notebooks']; // Needs access to experimental data
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.data) {
      return false;
    }
    // Data can be various formats, so just check it exists
    return true;
  }
  
  async execute(
    input: DataAnalysisInput,
    context?: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      if (!this.validateInput(input)) {
        return {
          success: false,
          content: null,
          error: 'Invalid input: data is required'
        };
      }
      
      const userId = context?.additionalData?.userId;
      if (!userId) {
        return {
          success: false,
          content: null,
          error: 'User ID is required in context'
        };
      }
      
      // Initialize provider
      const provider = config?.provider || await this.getProviderForTask(userId);
      const apiKey = await getUserApiKey(userId, provider);
      
      if (!apiKey) {
        return {
          success: false,
          content: null,
          error: `No API key found for provider: ${provider}`
        };
      }
      
      await this.initializeProvider(provider, apiKey);
      
      // Build prompt
      const systemPrompt = this.buildSystemPrompt(
        { taskType: 'data_analysis' } as TaskAnalysis,
        context?.userContext
      );
      
      const userPrompt = this.buildDataAnalysisPrompt(input, context?.userContext);
      
      // Call AI provider
      const startTime = Date.now();
      const response = await this.getProvider().chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        apiKey: apiKey,
        temperature: 0.5, // Lower temperature for more analytical, factual responses
        maxTokens: config?.maxTokens || 3000
      });
      
      const duration = Date.now() - startTime;
      
      // Parse analysis
      const analysisResult = this.parseDataAnalysis(response.content, input);
      
      // Enhance with intelligent visualization recommendations
      if (analysisResult.analysis && input.data) {
        const variables: string[] = [];
        if (input.variables) {
          if (input.variables.independent) variables.push(...input.variables.independent);
          if (input.variables.dependent) variables.push(...input.variables.dependent);
          if (input.variables.covariates) variables.push(...input.variables.covariates);
        }
        
        // If no variables specified, try to infer from data
        if (variables.length === 0 && typeof input.data === 'object') {
          if (Array.isArray(input.data) && input.data.length > 0 && typeof input.data[0] === 'object') {
            variables.push(...Object.keys(input.data[0]).slice(0, 5));
          } else if (!Array.isArray(input.data)) {
            variables.push(...Object.keys(input.data).slice(0, 5));
          }
        }
        
        if (variables.length > 0) {
          const vizRecommendations = VisualizationRecommender.getRecommendationsForAnalysis(
            input.data,
            variables,
            input.analysisType
          );
          
          // Merge with AI-generated visualizations
          if (analysisResult.analysis.visualizations) {
            analysisResult.analysis.visualizations = [
              ...vizRecommendations.map((viz: any) => ({
                type: viz.chartType,
                description: viz.description,
                variables: viz.variables,
                recommended: viz.recommended,
                chartConfig: viz.config
              })),
              ...analysisResult.analysis.visualizations
            ];
          } else {
            analysisResult.analysis.visualizations = vizRecommendations.map((viz: any) => ({
              type: viz.chartType,
              description: viz.description,
              variables: viz.variables,
              recommended: viz.recommended,
              chartConfig: viz.config
            }));
          }
        }
      }
      
      return {
        success: true,
        content: analysisResult,
        metadata: {
          provider,
          tokensUsed: response.usage?.totalTokens,
          duration,
          wordCount: analysisResult.wordCount
        }
      };
    } catch (error: any) {
      return this.handleError(error, 'data analysis');
    }
  }
  
  /**
   * Build prompt for data analysis
   */
  private buildDataAnalysisPrompt(
    input: DataAnalysisInput,
    userContext?: UserContext
  ): string {
    let prompt = `Analyze the following experimental data and provide comprehensive insights:\n\n`;
    
    // Format data for prompt
    const dataString = this.formatDataForPrompt(input.data);
    prompt += `--- Data ---\n${dataString}\n\n`;
    
    if (input.researchQuestion) {
      prompt += `Research Question: ${input.researchQuestion}\n\n`;
    }
    
    if (input.hypothesis) {
      prompt += `Hypothesis: ${input.hypothesis}\n\n`;
    }
    
    if (input.variables) {
      prompt += `Variables:\n`;
      if (input.variables.independent && input.variables.independent.length > 0) {
        prompt += `- Independent: ${input.variables.independent.join(', ')}\n`;
      }
      if (input.variables.dependent && input.variables.dependent.length > 0) {
        prompt += `- Dependent: ${input.variables.dependent.join(', ')}\n`;
      }
      if (input.variables.covariates && input.variables.covariates.length > 0) {
        prompt += `- Covariates: ${input.variables.covariates.join(', ')}\n`;
      }
      prompt += `\n`;
    }
    
    if (input.dataType) {
      prompt += `Data Type: ${input.dataType}\n`;
    }
    
    if (input.analysisType) {
      prompt += `Analysis Type: ${input.analysisType}\n`;
    }
    
    if (input.context) {
      prompt += `Context: ${input.context}\n\n`;
    }
    
    prompt += `Provide a comprehensive data analysis with the following sections:\n\n`;
    prompt += `1. **Summary**:\n`;
    prompt += `   - Data overview (sample size, variables, data quality)\n`;
    prompt += `   - Initial observations\n\n`;
    prompt += `2. **Descriptive Statistics**:\n`;
    prompt += `   - For each variable: mean, median, standard deviation, min, max\n`;
    prompt += `   - Distribution characteristics\n`;
    prompt += `   - Data quality assessment\n\n`;
    prompt += `3. **Pattern Identification**:\n`;
    prompt += `   - Trends and patterns in the data\n`;
    prompt += `   - Relationships between variables\n`;
    prompt += `   - Outliers or anomalies\n`;
    prompt += `   - Significance of patterns\n\n`;
    prompt += `4. **Statistical Analysis**:\n`;
    prompt += `   - Appropriate statistical tests (if applicable)\n`;
    prompt += `   - Test results and interpretations\n`;
    prompt += `   - Effect sizes (if relevant)\n`;
    prompt += `   - Confidence intervals\n\n`;
    prompt += `5. **Key Insights**:\n`;
    prompt += `   - Main findings with supporting evidence\n`;
    prompt += `   - Implications of findings\n`;
    prompt += `   - How findings relate to research question/hypothesis\n\n`;
    prompt += `6. **Visualization Recommendations**:\n`;
    prompt += `   - Suggested charts/graphs\n`;
    prompt += `   - Variables to visualize\n`;
    prompt += `   - Visualization types (scatter, bar, line, etc.)\n\n`;
    prompt += `7. **Limitations**:\n`;
    prompt += `   - Data limitations\n`;
    prompt += `   - Analysis constraints\n`;
    prompt += `   - Potential confounding factors\n\n`;
    prompt += `8. **Recommendations**:\n`;
    prompt += `   - Next steps for analysis\n`;
    prompt += `   - Additional data needed\n`;
    prompt += `   - Follow-up experiments\n\n`;
    prompt += `9. **Interpretation**: Overall interpretation of results\n\n`;
    prompt += `10. **Conclusions**: Key conclusions drawn from the analysis\n\n`;
    
    if (userContext?.experiments && userContext.experiments.length > 0) {
      prompt += `--- Related Experiments ---\n`;
      userContext.experiments.slice(0, 3).forEach((exp, idx) => {
        prompt += `${idx + 1}. ${exp.title || 'Experiment'}\n`;
      });
      prompt += `\nConsider how this data relates to previous experiments.\n\n`;
    }
    
    prompt += `Ensure the analysis:\n`;
    prompt += `- Is statistically sound\n`;
    prompt += `- Identifies meaningful patterns\n`;
    prompt += `- Provides actionable insights\n`;
    prompt += `- Relates findings to research objectives\n`;
    prompt += `- Acknowledges limitations\n`;
    prompt += `- Suggests next steps\n`;
    
    return prompt;
  }
  
  /**
   * Format data for prompt
   */
  private formatDataForPrompt(data: any): string {
    if (typeof data === 'string') {
      // Assume it's already formatted (CSV, JSON, etc.)
      return data;
    }
    
    if (Array.isArray(data)) {
      // Array of objects or values
      if (data.length > 0 && typeof data[0] === 'object') {
        // Array of objects - format as table
        const headers = Object.keys(data[0]);
        let formatted = headers.join('\t') + '\n';
        data.slice(0, 50).forEach((row: any) => {
          formatted += headers.map(h => row[h] || '').join('\t') + '\n';
        });
        if (data.length > 50) {
          formatted += `... (${data.length - 50} more rows)\n`;
        }
        return formatted;
      } else {
        // Simple array
        return data.slice(0, 100).join(', ') + (data.length > 100 ? ` ... (${data.length - 100} more values)` : '');
      }
    }
    
    if (typeof data === 'object') {
      // Object - format as JSON
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
  }
  
  /**
   * Parse data analysis from response
   */
  private parseDataAnalysis(response: string, input: DataAnalysisInput): DataAnalysisResult {
    const wordCount = response.split(/\s+/).length;
    
    // Extract sections
    const summaryMatch = response.match(/(?:summary|overview)[:\s]+(.+?)(?=\n(?:descriptive|patterns?|statistical)|$)/is);
    const descriptiveMatch = response.match(/(?:descriptive statistics?)[:\s]+(.+?)(?=\n(?:patterns?|statistical|insights?)|$)/is);
    const patternsMatch = response.match(/(?:patterns?|pattern identification)[:\s]+(.+?)(?=\n(?:statistical|insights?|visualization)|$)/is);
    const statisticalMatch = response.match(/(?:statistical (?:analysis|tests?))[:\s]+(.+?)(?=\n(?:insights?|visualization|limitations?)|$)/is);
    const insightsMatch = response.match(/(?:insights?|key findings?)[:\s]+(.+?)(?=\n(?:visualization|limitations?|recommendations?)|$)/is);
    const visualizationMatch = response.match(/(?:visualization|charts?|graphs?)[:\s]+(.+?)(?=\n(?:limitations?|recommendations?)|$)/is);
    const limitationsMatch = response.match(/(?:limitations?)[:\s]+(.+?)(?=\n(?:recommendations?|interpretation|conclusions?)|$)/is);
    const recommendationsMatch = response.match(/(?:recommendations?)[:\s]+(.+?)(?=\n(?:interpretation|conclusions?)|$)/is);
    const interpretationMatch = response.match(/(?:interpretation|overall interpretation)[:\s]+(.+?)(?=\n(?:conclusions?|$)|$)/is);
    const conclusionsMatch = response.match(/(?:conclusions?)[:\s]+(.+?)$/is);
    
    // Parse descriptive statistics
    const descriptiveStats: any[] = [];
    if (descriptiveMatch) {
      const statsText = descriptiveMatch[1];
      const variableMatches = statsText.match(/(?:variable|column)[:\s]+(.+?)(?=\n(?:variable|column|mean|median)|$)/gis);
      
      if (variableMatches) {
        variableMatches.forEach(varText => {
          const varNameMatch = varText.match(/^(.+?)(?:\n|$)/);
          const meanMatch = varText.match(/mean[:\s]+([\d.]+)/i);
          const medianMatch = varText.match(/median[:\s]+([\d.]+)/i);
          const stdMatch = varText.match(/(?:std|standard deviation)[:\s]+([\d.]+)/i);
          const minMatch = varText.match(/min[:\s]+([\d.]+)/i);
          const maxMatch = varText.match(/max[:\s]+([\d.]+)/i);
          
          if (varNameMatch) {
            descriptiveStats.push({
              variable: varNameMatch[1].trim(),
              mean: meanMatch ? parseFloat(meanMatch[1]) : undefined,
              median: medianMatch ? parseFloat(medianMatch[1]) : undefined,
              stdDev: stdMatch ? parseFloat(stdMatch[1]) : undefined,
              min: minMatch ? parseFloat(minMatch[1]) : undefined,
              max: maxMatch ? parseFloat(maxMatch[1]) : undefined
            });
          }
        });
      }
    }
    
    // Parse patterns
    const patterns: any[] = [];
    if (patternsMatch) {
      const patternsText = patternsMatch[1];
      const patternList = patternsText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (patternList) {
        patternList.forEach(patternText => {
          const descMatch = patternText.match(/^(.+?)(?:\n|$)/);
          if (descMatch) {
            patterns.push({
              pattern: descMatch[1].trim(),
              description: descMatch[1].trim(),
              significance: undefined
            });
          }
        });
      }
    }
    
    // Parse statistical tests
    const statisticalTests: any[] = [];
    if (statisticalMatch) {
      const testsText = statisticalMatch[1];
      const testList = testsText.match(/(?:test|analysis)[:\s]+(.+?)(?=\n(?:test|analysis|result)|$)/gis);
      if (testList) {
        testList.forEach(testText => {
          const testNameMatch = testText.match(/^(.+?)(?:\n|$)/);
          const purposeMatch = testText.match(/(?:purpose)[:\s]+(.+?)(?:\n|$)/i);
          if (testNameMatch) {
            statisticalTests.push({
              test: testNameMatch[1].trim(),
              purpose: purposeMatch ? purposeMatch[1].trim() : '',
              result: undefined,
              interpretation: undefined
            });
          }
        });
      }
    }
    
    // Parse insights
    const insights: any[] = [];
    if (insightsMatch) {
      const insightsText = insightsMatch[1];
      const insightList = insightsText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (insightList) {
        insightList.forEach(insightText => {
          const findingMatch = insightText.match(/^(.+?)(?:\n|$)/);
          if (findingMatch) {
            insights.push({
              finding: findingMatch[1].trim(),
              evidence: '',
              implications: ''
            });
          }
        });
      }
    }
    
    // Parse visualizations
    const visualizations: any[] = [];
    if (visualizationMatch) {
      const vizText = visualizationMatch[1];
      const vizList = vizText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (vizList) {
        vizList.forEach(vizText => {
          const typeMatch = vizText.match(/(?:type|chart)[:\s]+(.+?)(?:\n|$)/i);
          const descMatch = vizText.match(/(?:description)[:\s]+(.+?)(?:\n|$)/i);
          if (typeMatch) {
            visualizations.push({
              type: typeMatch[1].trim(),
              description: descMatch ? descMatch[1].trim() : '',
              variables: []
            });
          }
        });
      }
    }
    
    // Parse limitations
    const limitations: string[] = [];
    if (limitationsMatch) {
      const limitsText = limitationsMatch[1];
      const limitsList = limitsText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (limitsList) {
        limitations.push(...limitsList.map(limit => limit.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse recommendations
    const recommendations: string[] = [];
    if (recommendationsMatch) {
      const recsText = recommendationsMatch[1];
      const recsList = recsText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (recsList) {
        recommendations.push(...recsList.map(rec => rec.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    // Parse conclusions
    const conclusions: string[] = [];
    if (conclusionsMatch) {
      const conclText = conclusionsMatch[1];
      const conclList = conclText.match(/(?:\d+\.|[-*])\s*(.+?)(?=\n(?:\d+\.|[-*])|$)/g);
      if (conclList) {
        conclusions.push(...conclList.map(concl => concl.replace(/^(?:\d+\.|[-*])\s*/, '').trim()));
      }
    }
    
    return {
      analysis: {
        summary: {
          dataOverview: summaryMatch ? summaryMatch[1].trim() : '',
          variables: input.variables ? [
            ...(input.variables.independent || []),
            ...(input.variables.dependent || []),
            ...(input.variables.covariates || [])
          ] : [],
          dataQuality: 'medium'
        },
        descriptiveStats: descriptiveStats.length > 0 ? descriptiveStats : undefined,
        patterns: patterns.length > 0 ? patterns : [],
        statisticalTests: statisticalTests.length > 0 ? statisticalTests : undefined,
        insights: insights.length > 0 ? insights : [],
        visualizations: visualizations.length > 0 ? visualizations : undefined,
        limitations: limitations.length > 0 ? limitations : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined
      },
      interpretation: interpretationMatch ? interpretationMatch[1].trim() : '',
      conclusions: conclusions.length > 0 ? conclusions : [],
      wordCount
    };
  }
  
  /**
   * Get provider for data analysis task
   */
  private async getProviderForTask(userId: string): Promise<string> {
    const assignment = await getApiForTask(userId, 'data_analysis');
    return assignment?.provider || 'google_gemini'; // Gemini is good for analytical tasks
  }
}

