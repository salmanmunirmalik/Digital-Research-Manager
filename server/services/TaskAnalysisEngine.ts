/**
 * Task Analysis Engine - Enhanced
 * Task 73: Analyzes tasks to determine optimal agent/provider selection
 * 
 * Enhanced version with better task type detection, parameter extraction,
 * and context requirement analysis.
 */

export interface TaskAnalysis {
  taskType: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresContext: boolean;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  contextRequirements?: {
    minContextLength?: number;
    requiredSources?: string[]; // 'papers', 'notebooks', 'protocols', 'experiments'
    requiresEmbeddings?: boolean;
  };
  qualityRequirement: 'high' | 'medium' | 'low';
  speedRequirement: 'fast' | 'medium' | 'slow';
  costSensitivity: 'low' | 'medium' | 'high';
}

export class TaskAnalysisEngine {
  /**
   * Analyze user query to determine task type and requirements
   */
  static analyzeTask(message: string): TaskAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // Task patterns with confidence scores and requirements
    const taskPatterns: Array<{
      taskType: string;
      patterns: RegExp[];
      confidence: number;
      requiresContext: boolean;
      complexity: 'simple' | 'moderate' | 'complex';
      qualityRequirement: 'high' | 'medium' | 'low';
      speedRequirement: 'fast' | 'medium' | 'slow';
      costSensitivity: 'low' | 'medium' | 'high';
      contextRequirements?: {
        minContextLength?: number;
        requiredSources?: string[];
        requiresEmbeddings?: boolean;
      };
      extractParams?: (msg: string) => Record<string, any>;
    }> = [
      {
        taskType: 'paper_finding',
        patterns: [
          /find.*paper/i,
          /search.*paper/i,
          /look.*for.*paper/i,
          /paper.*about/i,
          /research.*paper/i,
          /literature.*review/i,
          /find.*research/i
        ],
        confidence: 0.9,
        requiresContext: false,
        complexity: 'simple',
        qualityRequirement: 'high',
        speedRequirement: 'fast',
        costSensitivity: 'medium',
        extractParams: (msg) => {
          const topicMatch = msg.match(/(?:on|about|for|regarding|related to)\s+([^.!?]+)/i);
          return { topic: topicMatch ? topicMatch[1].trim() : null };
        }
      },
      {
        taskType: 'abstract_writing',
        patterns: [
          /write.*abstract/i,
          /generate.*abstract/i,
          /create.*abstract/i,
          /abstract.*for/i,
          /summary.*of.*experiment/i
        ],
        confidence: 0.95,
        requiresContext: true,
        complexity: 'moderate',
        qualityRequirement: 'high',
        speedRequirement: 'medium',
        costSensitivity: 'low',
        contextRequirements: {
          minContextLength: 2000,
          requiredSources: ['notebooks', 'experiments'],
          requiresEmbeddings: true
        },
        extractParams: (msg) => {
          const experimentMatch = msg.match(/(?:experiment|study|research).*?(?:on|about)\s+([^.!?]+)/i);
          return { experiment: experimentMatch ? experimentMatch[1].trim() : null };
        }
      },
      {
        taskType: 'content_writing',
        patterns: [
          /write.*content/i,
          /generate.*content/i,
          /create.*content/i,
          /write.*about/i,
          /draft.*section/i
        ],
        confidence: 0.85,
        requiresContext: true,
        complexity: 'moderate',
        qualityRequirement: 'high',
        speedRequirement: 'medium',
        costSensitivity: 'medium',
        contextRequirements: {
          minContextLength: 1500,
          requiredSources: ['papers', 'notebooks']
        }
      },
      {
        taskType: 'idea_generation',
        patterns: [
          /generate.*idea/i,
          /suggest.*idea/i,
          /research.*idea/i,
          /new.*idea/i,
          /hypothesis/i,
          /research.*direction/i
        ],
        confidence: 0.9,
        requiresContext: true,
        complexity: 'moderate',
        qualityRequirement: 'high',
        speedRequirement: 'fast',
        costSensitivity: 'low',
        contextRequirements: {
          minContextLength: 1000,
          requiredSources: ['papers', 'notebooks'],
          requiresEmbeddings: true
        },
        extractParams: (msg) => {
          const fieldMatch = msg.match(/(?:in|for|field of)\s+([^.!?]+)/i);
          return { field: fieldMatch ? fieldMatch[1].trim() : null };
        }
      },
      {
        taskType: 'proposal_writing',
        patterns: [
          /write.*proposal/i,
          /grant.*proposal/i,
          /research.*proposal/i,
          /funding.*proposal/i,
          /project.*proposal/i
        ],
        confidence: 0.95,
        requiresContext: true,
        complexity: 'complex',
        qualityRequirement: 'high',
        speedRequirement: 'slow',
        costSensitivity: 'low',
        contextRequirements: {
          minContextLength: 5000,
          requiredSources: ['papers', 'notebooks', 'experiments'],
          requiresEmbeddings: true
        },
        extractParams: (msg) => {
          const topicMatch = msg.match(/(?:for|about|on)\s+([^.!?]+)/i);
          return { topic: topicMatch ? topicMatch[1].trim() : null };
        }
      },
      {
        taskType: 'data_analysis',
        patterns: [
          /analyze.*data/i,
          /data.*analysis/i,
          /interpret.*data/i,
          /analyze.*results/i,
          /statistical.*analysis/i
        ],
        confidence: 0.9,
        requiresContext: true,
        complexity: 'moderate',
        qualityRequirement: 'high',
        speedRequirement: 'medium',
        costSensitivity: 'medium',
        contextRequirements: {
          minContextLength: 3000,
          requiredSources: ['experiments', 'notebooks'],
          requiresEmbeddings: false
        }
      },
      {
        taskType: 'image_creation',
        patterns: [
          /create.*image/i,
          /generate.*image/i,
          /create.*figure/i,
          /generate.*figure/i,
          /visualization/i,
          /diagram/i
        ],
        confidence: 0.9,
        requiresContext: true,
        complexity: 'moderate',
        qualityRequirement: 'high',
        speedRequirement: 'fast',
        costSensitivity: 'high',
        contextRequirements: {
          minContextLength: 1000,
          requiredSources: ['experiments', 'notebooks']
        }
      },
      {
        taskType: 'paper_generation',
        patterns: [
          /write.*paper/i,
          /generate.*paper/i,
          /create.*paper/i,
          /draft.*paper/i,
          /full.*paper/i
        ],
        confidence: 0.95,
        requiresContext: true,
        complexity: 'complex',
        qualityRequirement: 'high',
        speedRequirement: 'slow',
        costSensitivity: 'low',
        contextRequirements: {
          minContextLength: 10000,
          requiredSources: ['papers', 'notebooks', 'experiments', 'protocols'],
          requiresEmbeddings: true
        }
      },
      {
        taskType: 'presentation_generation',
        patterns: [
          /create.*presentation/i,
          /generate.*presentation/i,
          /make.*slides/i,
          /create.*ppt/i,
          /powerpoint/i
        ],
        confidence: 0.9,
        requiresContext: true,
        complexity: 'complex',
        qualityRequirement: 'medium',
        speedRequirement: 'fast',
        costSensitivity: 'medium',
        contextRequirements: {
          minContextLength: 5000,
          requiredSources: ['papers', 'experiments']
        }
      },
      {
        taskType: 'code_generation',
        patterns: [
          /write.*code/i,
          /generate.*code/i,
          /create.*code/i,
          /code.*for/i,
          /programming/i
        ],
        confidence: 0.85,
        requiresContext: false,
        complexity: 'moderate',
        qualityRequirement: 'high',
        speedRequirement: 'fast',
        costSensitivity: 'low'
      },
      {
        taskType: 'translation',
        patterns: [
          /translate/i,
          /translation/i,
          /convert.*language/i
        ],
        confidence: 0.9,
        requiresContext: false,
        complexity: 'simple',
        qualityRequirement: 'high',
        speedRequirement: 'fast',
        costSensitivity: 'high'
      },
      {
        taskType: 'summarization',
        patterns: [
          /summarize/i,
          /summary/i,
          /brief.*overview/i,
          /condense/i
        ],
        confidence: 0.85,
        requiresContext: true,
        complexity: 'simple',
        qualityRequirement: 'medium',
        speedRequirement: 'fast',
        costSensitivity: 'high',
        contextRequirements: {
          minContextLength: 2000,
          requiredSources: ['papers', 'notebooks']
        }
      }
    ];
    
    // Find best matching pattern
    let bestMatch: TaskAnalysis | null = null;
    let highestConfidence = 0;
    
    for (const pattern of taskPatterns) {
      const matches = pattern.patterns.some(p => p.test(lowerMessage));
      
      if (matches && pattern.confidence > highestConfidence) {
        const parameters = pattern.extractParams 
          ? pattern.extractParams(message)
          : {};
        
        bestMatch = {
          taskType: pattern.taskType,
          confidence: pattern.confidence,
          parameters,
          requiresContext: pattern.requiresContext,
          estimatedComplexity: pattern.complexity,
          contextRequirements: pattern.contextRequirements,
          qualityRequirement: pattern.qualityRequirement,
          speedRequirement: pattern.speedRequirement,
          costSensitivity: pattern.costSensitivity
        };
        
        highestConfidence = pattern.confidence;
      }
    }
    
    // Default fallback
    if (!bestMatch) {
      bestMatch = {
        taskType: 'content_writing',
        confidence: 0.5,
        parameters: {},
        requiresContext: true,
        estimatedComplexity: 'moderate',
        qualityRequirement: 'medium',
        speedRequirement: 'medium',
        costSensitivity: 'medium'
      };
    }
    
    return bestMatch;
  }
  
  /**
   * Extract additional parameters from message
   */
  static extractParameters(message: string, taskType: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Extract topic/field
    const topicMatch = message.match(/(?:on|about|for|regarding|related to)\s+([^.!?]+)/i);
    if (topicMatch) {
      params.topic = topicMatch[1].trim();
    }
    
    // Extract dates
    const dateMatch = message.match(/(?:since|after|before|from)\s+(\d{4})/i);
    if (dateMatch) {
      params.year = parseInt(dateMatch[1]);
    }
    
    // Extract quantity
    const quantityMatch = message.match(/(\d+)\s+(?:papers?|articles?|results?)/i);
    if (quantityMatch) {
      params.quantity = parseInt(quantityMatch[1]);
    }
    
    // Extract language for translation
    if (taskType === 'translation') {
      const langMatch = message.match(/to\s+([a-z]+)/i);
      if (langMatch) {
        params.targetLanguage = langMatch[1];
      }
    }
    
    return params;
  }
  
  /**
   * Determine if task requires user context
   */
  static requiresUserContext(taskType: string, message: string): boolean {
    const contextRequiredTasks = [
      'abstract_writing',
      'content_writing',
      'idea_generation',
      'proposal_writing',
      'data_analysis',
      'paper_generation',
      'presentation_generation',
      'summarization'
    ];
    
    if (contextRequiredTasks.includes(taskType)) {
      return true;
    }
    
    // Check for context indicators in message
    const contextIndicators = [
      /my\s+(?:paper|experiment|data|research|notebook)/i,
      /based\s+on\s+my/i,
      /from\s+my/i,
      /using\s+my/i
    ];
    
    return contextIndicators.some(pattern => pattern.test(message));
  }
}

