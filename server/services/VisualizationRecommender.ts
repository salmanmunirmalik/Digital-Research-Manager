/**
 * VisualizationRecommender - Intelligent visualization recommendations
 * 
 * Analyzes data and recommends appropriate visualizations with configurations
 */

export interface DataCharacteristics {
  dataType: 'numerical' | 'categorical' | 'time_series' | 'mixed';
  variableCount: number;
  sampleSize: number;
  hasTimeDimension: boolean;
  hasGroups: boolean;
  distribution?: 'normal' | 'skewed' | 'bimodal' | 'uniform' | 'unknown';
}

export interface VisualizationRecommendation {
  chartType: 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'heatmap' | 'pie' | 'violin' | 'violin' | 'area';
  title: string;
  description: string;
  variables: string[];
  recommended: boolean;
  config: {
    xAxis?: string;
    yAxis?: string;
    colorBy?: string;
    groupBy?: string;
    facetBy?: string;
    insights?: string[];
    useCase: string;
  };
}

export class VisualizationRecommender {
  /**
   * Recommend visualizations based on data characteristics
   */
  static recommendVisualizations(
    characteristics: DataCharacteristics,
    variables: string[]
  ): VisualizationRecommendation[] {
    const recommendations: VisualizationRecommendation[] = [];

    // Time series data
    if (characteristics.hasTimeDimension) {
      recommendations.push({
        chartType: 'line',
        title: 'Time Series Trend',
        description: 'Shows how values change over time',
        variables: variables.slice(0, 2),
        recommended: true,
        config: {
          xAxis: 'time',
          yAxis: variables[0],
          useCase: 'Track trends and patterns over time',
          insights: ['Identify trends', 'Detect seasonality', 'Spot anomalies']
        }
      });

      recommendations.push({
        chartType: 'area',
        title: 'Cumulative Time Series',
        description: 'Shows cumulative values over time',
        variables: variables.slice(0, 2),
        recommended: false,
        config: {
          xAxis: 'time',
          yAxis: variables[0],
          useCase: 'Show cumulative progress or accumulation',
          insights: ['Total accumulation', 'Growth rate']
        }
      });
    }

    // Categorical data
    if (characteristics.dataType === 'categorical' || characteristics.hasGroups) {
      recommendations.push({
        chartType: 'bar',
        title: 'Category Comparison',
        description: 'Compare values across categories',
        variables: variables.slice(0, 2),
        recommended: true,
        config: {
          xAxis: variables[0],
          yAxis: variables[1] || 'count',
          useCase: 'Compare categories or groups',
          insights: ['Category rankings', 'Relative differences']
        }
      });

      if (variables.length >= 2) {
        recommendations.push({
          chartType: 'pie',
          title: 'Category Distribution',
          description: 'Show proportional distribution',
          variables: variables.slice(0, 1),
          recommended: false,
          config: {
            useCase: 'Show proportions and percentages',
            insights: ['Proportional distribution', 'Dominant categories']
          }
        });
      }
    }

    // Numerical data
    if (characteristics.dataType === 'numerical') {
      // Distribution visualization
      recommendations.push({
        chartType: 'histogram',
        title: 'Data Distribution',
        description: 'Show the distribution of numerical values',
        variables: variables.slice(0, 1),
        recommended: true,
        config: {
          xAxis: variables[0],
          useCase: 'Understand data distribution',
          insights: [
            `Distribution shape: ${characteristics.distribution || 'unknown'}`,
            'Identify outliers',
            'Check normality'
          ]
        }
      });

      // Box plot for comparison
      if (characteristics.hasGroups && variables.length >= 2) {
        recommendations.push({
          chartType: 'box',
          title: 'Group Comparison',
          description: 'Compare distributions across groups',
          variables: variables.slice(0, 2),
          recommended: true,
          config: {
            xAxis: variables[1], // Group variable
            yAxis: variables[0], // Value variable
            useCase: 'Compare distributions and identify outliers',
            insights: ['Median comparison', 'Spread comparison', 'Outlier detection']
          }
        });
      }

      // Violin plot (enhanced box plot)
      if (characteristics.hasGroups && variables.length >= 2) {
        recommendations.push({
          chartType: 'violin',
          title: 'Detailed Distribution Comparison',
          description: 'Show full distribution shape for each group',
          variables: variables.slice(0, 2),
          recommended: false,
          config: {
            xAxis: variables[1],
            yAxis: variables[0],
            useCase: 'Detailed distribution comparison with density',
            insights: ['Full distribution shape', 'Density patterns', 'Multi-modal detection']
          }
        });
      }
    }

    // Relationship visualization
    if (variables.length >= 2 && characteristics.dataType !== 'categorical') {
      recommendations.push({
        chartType: 'scatter',
        title: 'Relationship Analysis',
        description: 'Explore relationships between variables',
        variables: variables.slice(0, 2),
        recommended: true,
        config: {
          xAxis: variables[0],
          yAxis: variables[1],
          useCase: 'Identify correlations and relationships',
          insights: ['Correlation strength', 'Outlier detection', 'Pattern identification']
        }
      });

      // Multi-variable scatter with color
      if (variables.length >= 3) {
        recommendations.push({
          chartType: 'scatter',
          title: 'Multi-Variable Relationship',
          description: 'Explore relationships with additional dimensions',
          variables: variables.slice(0, 3),
          recommended: false,
          config: {
            xAxis: variables[0],
            yAxis: variables[1],
            colorBy: variables[2],
            useCase: 'Multi-dimensional relationship analysis',
            insights: ['Multi-variable patterns', 'Grouped relationships']
          }
        });
      }
    }

    // Heatmap for correlation matrix
    if (variables.length >= 3) {
      recommendations.push({
        chartType: 'heatmap',
        title: 'Correlation Matrix',
        description: 'Show correlations between all variables',
        variables: variables.slice(0, Math.min(variables.length, 10)),
        recommended: false,
        config: {
          useCase: 'Identify correlations across multiple variables',
          insights: ['Strong correlations', 'Variable clusters', 'Redundant variables']
        }
      });
    }

    return recommendations;
  }

  /**
   * Analyze data to extract characteristics
   */
  static analyzeDataCharacteristics(data: any, variables: string[]): DataCharacteristics {
    // This is a simplified analysis - in production, would do actual statistical analysis
    const sampleSize = Array.isArray(data) ? data.length : 0;
    const variableCount = variables.length;

    // Check for time dimension
    const hasTimeDimension = variables.some(v => 
      v.toLowerCase().includes('time') || 
      v.toLowerCase().includes('date') ||
      v.toLowerCase().includes('day')
    );

    // Check for groups
    const hasGroups = variables.some(v =>
      v.toLowerCase().includes('group') ||
      v.toLowerCase().includes('category') ||
      v.toLowerCase().includes('type')
    );

    // Determine data type (simplified)
    let dataType: 'numerical' | 'categorical' | 'time_series' | 'mixed' = 'mixed';
    if (hasTimeDimension && variableCount >= 2) {
      dataType = 'time_series';
    } else if (hasGroups && !hasTimeDimension) {
      dataType = 'categorical';
    } else if (!hasGroups && !hasTimeDimension) {
      dataType = 'numerical';
    }

    return {
      dataType,
      variableCount,
      sampleSize,
      hasTimeDimension,
      hasGroups,
      distribution: 'unknown' // Would be calculated from actual data
    };
  }

  /**
   * Get visualization recommendations for DataAnalysisAgent
   */
  static getRecommendationsForAnalysis(
    data: any,
    variables: string[],
    analysisType?: string
  ): VisualizationRecommendation[] {
    const characteristics = this.analyzeDataCharacteristics(data, variables);
    let recommendations = this.recommendVisualizations(characteristics, variables);

    // Filter and prioritize based on analysis type
    if (analysisType === 'comparative') {
      recommendations = recommendations.filter(r => 
        r.chartType === 'bar' || r.chartType === 'box' || r.chartType === 'violin'
      );
    } else if (analysisType === 'exploratory') {
      recommendations = recommendations.filter(r => 
        r.chartType === 'scatter' || r.chartType === 'histogram' || r.chartType === 'heatmap'
      );
    } else if (analysisType === 'predictive') {
      recommendations = recommendations.filter(r => 
        r.chartType === 'scatter' || r.chartType === 'line'
      );
    }

    // Sort by recommended flag
    return recommendations.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
  }
}


