/**
 * Data Reading Agent
 * Task 65: Read and interpret experimental data
 * 
 * Reads experimental data from various sources (CSV, JSON, Excel, Personal NoteBooks)
 * and interprets the data structure, types, and meaning for downstream processing.
 */

import { BaseAgent, Agent, AgentConfig, AgentResult, AgentContext } from '../Agent.js';
import { TaskAnalysis } from '../TaskAnalysisEngine.js';
import { UserContext } from '../UserContextRetriever.js';
import { getApiForTask } from '../../routes/apiTaskAssignments.js';
import { getUserApiKey } from '../../routes/aiProviderKeys.js';
import { AIProviderFactory } from '../AIProviderFactory.js';

export interface DataReadingInput {
  dataSource: string; // 'lab_notebook', 'file', 'experiment', 'research_data'
  sourceId?: string; // ID of the source (for lab_notebook, experiment, etc.)
  filePath?: string; // For file-based data
  fileContent?: string; // Direct file content
  fileType?: 'csv' | 'json' | 'excel' | 'txt' | 'tsv';
  dataFormat?: 'structured' | 'unstructured' | 'mixed';
  context?: string; // Additional context about the data
}

export interface DataReadingResult {
  success: boolean;
  dataStructure: {
    format: string; // 'tabular', 'time_series', 'categorical', 'mixed'
    columns?: string[]; // Column names for tabular data
    rows?: number; // Number of data points/rows
    dataTypes?: Record<string, string>; // Column name -> data type mapping
    summary?: {
      numericColumns?: string[];
      categoricalColumns?: string[];
      dateColumns?: string[];
      missingValues?: Record<string, number>;
    };
  };
  interpretation: {
    description: string; // What the data represents
    variables: Array<{
      name: string;
      type: string;
      description: string;
      unit?: string;
      range?: { min: number; max: number };
    }>;
    relationships?: Array<{
      variable1: string;
      variable2: string;
      relationship: string; // 'correlation', 'dependency', 'independent'
      strength?: number; // 0-1
    }>;
    patterns?: string[]; // Detected patterns or anomalies
  };
  metadata: {
    source: string;
    timestamp?: string;
    experimentType?: string;
    methodology?: string;
  };
  rawData?: any; // Parsed data structure (for structured data)
  recommendations?: string[]; // Recommendations for analysis or processing
}

export class DataReadingAgent extends BaseAgent implements Agent {
  readonly agentType = 'data_reading';
  readonly agentName = 'Data Reading Agent';
  readonly description = 'Reads and interprets experimental data from various sources';
  
  getRequiredContext(): string[] {
    return ['notebooks', 'experiments', 'research_data'];
  }
  
  validateInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;
    if (!input.dataSource) return false;
    
    // Validate based on data source
    if (input.dataSource === 'file' && !input.filePath && !input.fileContent) {
      return false;
    }
    
    if (input.dataSource !== 'file' && !input.sourceId) {
      return false;
    }
    
    return true;
  }
  
  async execute(
    input: DataReadingInput,
    context: AgentContext,
    config?: AgentConfig
  ): Promise<AgentResult> {
    try {
      // Validate input
      if (!this.validateInput(input)) {
        return {
          success: false,
          error: 'Invalid input: dataSource and appropriate source identifier required',
          content: null
        };
      }
      
      // Get API assignment for data analysis task
      const userId = context.additionalData?.userId || '';
      const apiAssignment = await getApiForTask(userId, 'data_analysis');
      
      if (!apiAssignment) {
        return {
          success: false,
          error: 'No API configured for data analysis. Please add an API key in Settings.',
          content: null
        };
      }
      
      // Read data based on source type
      const dataContent = await this.readData(input, context);
      
      if (!dataContent) {
        return {
          success: false,
          error: 'Failed to read data from source',
          content: null
        };
      }
      
      // Analyze data structure
      const dataStructure = await this.analyzeDataStructure(dataContent, input);
      
      // Interpret data using AI
      const interpretation = await this.interpretData(
        dataContent,
        dataStructure,
        input,
        apiAssignment,
        context
      );
      
      // Extract metadata
      const metadata = await this.extractMetadata(input, context);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        dataStructure,
        interpretation,
        apiAssignment,
        context
      );
      
      const result: DataReadingResult = {
        success: true,
        dataStructure,
        interpretation,
        metadata,
        recommendations
      };
      
      // Store parsed data if structured
      if (dataStructure.format === 'tabular' && dataContent.parsed) {
        result.rawData = dataContent.parsed;
      }
      
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
      console.error('Error in DataReadingAgent:', error);
      return {
        success: false,
        error: error.message || 'Failed to read and interpret data',
        content: null
      };
    }
  }
  
  /**
   * Read data from various sources
   */
  private async readData(
    input: DataReadingInput,
    context: AgentContext
  ): Promise<{ raw: string; parsed?: any; format: string } | null> {
    try {
      switch (input.dataSource) {
        case 'lab_notebook':
          return await this.readFromLabNotebook(input.sourceId!, context);
        
        case 'experiment':
          return await this.readFromExperiment(input.sourceId!, context);
        
        case 'research_data':
          return await this.readFromResearchData(input.sourceId!, context);
        
        case 'file':
          return await this.readFromFile(input);
        
        default:
          throw new Error(`Unsupported data source: ${input.dataSource}`);
      }
    } catch (error: any) {
      console.error('Error reading data:', error);
      return null;
    }
  }
  
  /**
   * Read data from Personal NoteBook entry
   */
  private async readFromLabNotebook(
    entryId: string,
    context: AgentContext
  ): Promise<{ raw: string; parsed?: any; format: string } | null> {
    // This would query the database for Personal NoteBook entry
    // For now, return a placeholder
    return {
      raw: 'Personal NoteBook data',
      format: 'unstructured'
    };
  }
  
  /**
   * Read data from experiment
   */
  private async readFromExperiment(
    experimentId: string,
    context: AgentContext
  ): Promise<{ raw: string; parsed?: any; format: string } | null> {
    // This would query the database for experiment data
    return {
      raw: 'Experiment data',
      format: 'structured'
    };
  }
  
  /**
   * Read data from research data entry
   */
  private async readFromResearchData(
    dataId: string,
    context: AgentContext
  ): Promise<{ raw: string; parsed?: any; format: string } | null> {
    // This would query the database for research data
    return {
      raw: 'Research data',
      format: 'structured'
    };
  }
  
  /**
   * Read data from file
   */
  private async readFromFile(
    input: DataReadingInput
  ): Promise<{ raw: string; parsed?: any; format: string } | null> {
    if (!input.fileContent && !input.filePath) {
      return null;
    }
    
    const content = input.fileContent || '';
    const fileType = input.fileType || this.detectFileType(content);
    
    let parsed: any = null;
    
    try {
      switch (fileType) {
        case 'csv':
        case 'tsv':
          parsed = this.parseCSV(content, fileType === 'tsv');
          break;
        
        case 'json':
          parsed = JSON.parse(content);
          break;
        
        case 'txt':
          parsed = { text: content };
          break;
        
        default:
          parsed = null;
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    }
    
    return {
      raw: content,
      parsed,
      format: parsed ? 'structured' : 'unstructured'
    };
  }
  
  /**
   * Detect file type from content
   */
  private detectFileType(content: string): 'csv' | 'json' | 'txt' | 'tsv' {
    // Try JSON first
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      // Not JSON
    }
    
    // Check for CSV/TSV patterns
    const lines = content.split('\n').slice(0, 5);
    if (lines.length > 0) {
      const commaCount = (lines[0].match(/,/g) || []).length;
      const tabCount = (lines[0].match(/\t/g) || []).length;
      
      if (tabCount > commaCount && tabCount > 0) {
        return 'tsv';
      } else if (commaCount > 0) {
        return 'csv';
      }
    }
    
    return 'txt';
  }
  
  /**
   * Parse CSV/TSV content
   */
  private parseCSV(content: string, isTSV: boolean = false): any {
    const delimiter = isTSV ? '\t' : ',';
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return null;
    
    const headers = lines[0].split(delimiter).map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      return row;
    });
    
    return {
      headers,
      rows,
      rowCount: rows.length
    };
  }
  
  /**
   * Analyze data structure
   */
  private async analyzeDataStructure(
    dataContent: { raw: string; parsed?: any; format: string },
    input: DataReadingInput
  ): Promise<DataReadingResult['dataStructure']> {
    if (!dataContent.parsed) {
      return {
        format: 'unstructured',
        summary: {}
      };
    }
    
    // Analyze parsed data
    if (dataContent.parsed.headers && dataContent.parsed.rows) {
      // Tabular data
      const headers = dataContent.parsed.headers;
      const rows = dataContent.parsed.rows;
      const dataTypes: Record<string, string> = {};
      const numericColumns: string[] = [];
      const categoricalColumns: string[] = [];
      const dateColumns: string[] = [];
      const missingValues: Record<string, number> = {};
      
      headers.forEach((header: string) => {
        const values = rows.map((row: any) => row[header]).filter((v: any) => v !== null && v !== undefined);
        const nonEmptyValues = values.filter((v: any) => v !== '' && v !== 'N/A');
        
        missingValues[header] = values.length - nonEmptyValues.length;
        
        if (nonEmptyValues.length === 0) {
          dataTypes[header] = 'unknown';
          return;
        }
        
        // Try to detect type
        const firstValue = nonEmptyValues[0];
        
        // Check if numeric
        if (!isNaN(Number(firstValue)) && firstValue !== '') {
          dataTypes[header] = 'numeric';
          numericColumns.push(header);
        }
        // Check if date
        else if (this.isDate(firstValue)) {
          dataTypes[header] = 'date';
          dateColumns.push(header);
        }
        // Otherwise categorical
        else {
          dataTypes[header] = 'categorical';
          categoricalColumns.push(header);
        }
      });
      
      return {
        format: 'tabular',
        columns: headers,
        rows: rows.length,
        dataTypes,
        summary: {
          numericColumns,
          categoricalColumns,
          dateColumns,
          missingValues
        }
      };
    }
    
    // For other structured formats
    return {
      format: 'structured',
      summary: {}
    };
  }
  
  /**
   * Check if string is a date
   */
  private isDate(value: string): boolean {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value));
  }
  
  /**
   * Interpret data using AI
   */
  private async interpretData(
    dataContent: { raw: string; parsed?: any; format: string },
    dataStructure: DataReadingResult['dataStructure'],
    input: DataReadingInput,
    apiAssignment: { provider: string; apiKey: string },
    context: AgentContext
  ): Promise<DataReadingResult['interpretation']> {
    try {
      const aiProvider = AIProviderFactory.createProvider(apiAssignment.provider, apiAssignment.apiKey);
      
      // Build prompt for data interpretation
      const structureInfo = dataStructure.format === 'tabular'
        ? `Data Structure:
- Format: Tabular
- Columns: ${dataStructure.columns?.join(', ')}
- Rows: ${dataStructure.rows}
- Numeric columns: ${dataStructure.summary?.numericColumns?.join(', ') || 'None'}
- Categorical columns: ${dataStructure.summary?.categoricalColumns?.join(', ') || 'None'}
- Date columns: ${dataStructure.summary?.dateColumns?.join(', ') || 'None'}
- Missing values: ${JSON.stringify(dataStructure.summary?.missingValues || {})}
`
        : `Data Structure:
- Format: ${dataStructure.format}
`;
      
      const sampleData = dataContent.parsed?.rows
        ? `Sample data (first 3 rows):\n${JSON.stringify(dataContent.parsed.rows.slice(0, 3), null, 2)}`
        : `Data content:\n${dataContent.raw.substring(0, 1000)}`;
      
      const prompt = `You are a data interpretation expert. Analyze the following experimental data and provide a detailed interpretation.

${structureInfo}

${sampleData}

${input.context ? `Additional context: ${input.context}` : ''}

Please provide:
1. A clear description of what this data represents
2. For each variable/column, describe its meaning, type, and if applicable, its unit and range
3. Identify any relationships between variables (correlations, dependencies, etc.)
4. Note any patterns, trends, or anomalies you detect

Format your response as JSON with this structure:
{
  "description": "What the data represents",
  "variables": [
    {
      "name": "variable_name",
      "type": "numeric|categorical|date",
      "description": "What this variable represents",
      "unit": "unit if applicable",
      "range": {"min": number, "max": number} // if numeric
    }
  ],
  "relationships": [
    {
      "variable1": "var1",
      "variable2": "var2",
      "relationship": "correlation|dependency|independent",
      "strength": 0.0-1.0
    }
  ],
  "patterns": ["pattern1", "pattern2"]
}`;
      
      const response = await aiProvider.chat([
        { role: 'system', content: 'You are an expert data scientist specializing in experimental data interpretation. Provide accurate, detailed analysis in JSON format.' },
        { role: 'user', content: prompt }
      ], {
        apiKey: apiAssignment.apiKey,
        temperature: 0.3,
        maxTokens: 2000
      });
      
      // Parse JSON response
      try {
        const interpretation = JSON.parse(response.content);
        return interpretation;
      } catch {
        // If JSON parsing fails, try to extract JSON from markdown
        const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/) || 
                         response.content.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        
        // Fallback: create basic interpretation
        return {
          description: response.content.substring(0, 200),
          variables: [],
          relationships: [],
          patterns: []
        };
      }
    } catch (error: any) {
      console.error('Error interpreting data:', error);
      return {
        description: 'Failed to interpret data automatically',
        variables: [],
        relationships: [],
        patterns: []
      };
    }
  }
  
  /**
   * Extract metadata from input and context
   */
  private async extractMetadata(
    input: DataReadingInput,
    context: AgentContext
  ): Promise<DataReadingResult['metadata']> {
    return {
      source: input.dataSource,
      timestamp: new Date().toISOString(),
      experimentType: input.context || undefined,
      methodology: undefined
    };
  }
  
  /**
   * Generate recommendations for data analysis
   */
  private async generateRecommendations(
    dataStructure: DataReadingResult['dataStructure'],
    interpretation: DataReadingResult['interpretation'],
    apiAssignment: { provider: string; apiKey: string },
    context: AgentContext
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (dataStructure.format === 'tabular') {
      if (dataStructure.summary?.numericColumns && dataStructure.summary.numericColumns.length > 1) {
        recommendations.push('Consider correlation analysis between numeric variables');
        recommendations.push('Statistical tests (t-test, ANOVA) may be appropriate');
      }
      
      if (dataStructure.summary?.categoricalColumns && dataStructure.summary.categoricalColumns.length > 0) {
        recommendations.push('Categorical variables can be analyzed using chi-square tests or frequency analysis');
      }
      
      if (dataStructure.summary?.missingValues) {
        const missingCount = Object.values(dataStructure.summary.missingValues).reduce((sum: number, count: number) => sum + count, 0);
        if (missingCount > 0) {
          recommendations.push(`Consider handling ${missingCount} missing values (imputation or exclusion)`);
        }
      }
      
      if (dataStructure.summary?.dateColumns && dataStructure.summary.dateColumns.length > 0) {
        recommendations.push('Time series analysis may be appropriate for date columns');
      }
    }
    
    if (interpretation.relationships && interpretation.relationships.length > 0) {
      recommendations.push('Further investigate detected relationships with statistical analysis');
    }
    
    if (interpretation.patterns && interpretation.patterns.length > 0) {
      recommendations.push('Validate detected patterns with additional analysis');
    }
    
    return recommendations;
  }
}

