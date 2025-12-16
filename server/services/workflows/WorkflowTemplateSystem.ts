/**
 * Workflow Template System
 * Task 77: Pre-built templates for common workflows
 * 
 * Provides pre-built workflow templates for common research tasks,
 * allowing users to quickly start workflows without manual configuration.
 */

import { WorkflowDefinition } from '../ResearchOrchestrator.js';
import { AgentContext } from '../Agent.js';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'paper' | 'analysis' | 'experiment' | 'presentation' | 'writing' | 'other';
  tags: string[];
  estimatedDuration: number; // minutes
  estimatedCost?: number; // USD
  requiredInput: {
    [key: string]: {
      type: string;
      description: string;
      required: boolean;
    };
  };
  optionalInput?: {
    [key: string]: {
      type: string;
      description: string;
      default?: any;
    };
  };
  createWorkflow: (input: any, context: AgentContext) => WorkflowDefinition;
}

export class WorkflowTemplateSystem {
  private templates: Map<string, WorkflowTemplate> = new Map();
  
  constructor() {
    this.registerDefaultTemplates();
  }
  
  /**
   * Register a workflow template
   */
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }
  
  /**
   * Get a template by ID
   */
  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }
  
  /**
   * Get all templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }
  
  /**
   * Get templates by tag
   */
  getTemplatesByTag(tag: string): WorkflowTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tags.includes(tag));
  }
  
  /**
   * Search templates
   */
  searchTemplates(query: string): WorkflowTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  /**
   * Create workflow from template
   */
  createWorkflowFromTemplate(
    templateId: string,
    input: any,
    context: AgentContext
  ): WorkflowDefinition {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Validate required input
    for (const [key, field] of Object.entries(template.requiredInput)) {
      if (field.required && !input[key]) {
        throw new Error(`Required input missing: ${key} - ${field.description}`);
      }
    }
    
    // Merge with optional defaults
    const fullInput = {
      ...Object.fromEntries(
        Object.entries(template.optionalInput || {}).map(([key, field]) => [
          key,
          input[key] !== undefined ? input[key] : field.default
        ])
      ),
      ...input
    };
    
    return template.createWorkflow(fullInput, context);
  }
  
  /**
   * Register default templates
   */
  private registerDefaultTemplates(): void {
    // Paper Generation Template
    this.registerTemplate({
      id: 'paper-generation-full',
      name: 'Complete Paper Generation',
      description: 'Generate a complete research paper from data: read data → analyze → write paper → create figures → add references → compile draft',
      category: 'paper',
      tags: ['paper', 'writing', 'data', 'figures', 'references'],
      estimatedDuration: 30,
      requiredInput: {
        dataSource: {
          type: 'object',
          description: 'Data source information (type, sourceId, filePath, etc.)',
          required: true
        },
        researchQuestion: {
          type: 'string',
          description: 'Main research question',
          required: true
        }
      },
      optionalInput: {
        target: {
          type: 'object',
          description: 'Target journal/conference',
          default: { style: 'APA' }
        }
      },
      createWorkflow: (input, context) => ({
        name: 'Complete Paper Generation',
        description: 'Full paper generation workflow',
        synthesisStrategy: 'sequential',
        tasks: [
          {
            id: 'read_data',
            agentType: 'data_reading',
            input: {
              dataSource: input.dataSource.type,
              sourceId: input.dataSource.sourceId,
              filePath: input.dataSource.filePath,
              fileContent: input.dataSource.fileContent,
              fileType: input.dataSource.fileType
            },
            priority: 1
          },
          {
            id: 'analyze_data',
            agentType: 'data_analysis',
            input: {
              researchQuestion: input.researchQuestion,
              data: '{{read_data.result}}'
            },
            dependencies: ['read_data'],
            priority: 2
          },
          {
            id: 'write_paper',
            agentType: 'paper_writing',
            input: {
              researchQuestion: input.researchQuestion,
              data: '{{read_data.result}}',
              context: {
                methodology: '{{analyze_data.result}}'
              },
              style: input.target
            },
            dependencies: ['read_data', 'analyze_data'],
            priority: 3
          },
          {
            id: 'generate_figures',
            agentType: 'figure_generation',
            input: {
              data: '{{read_data.result}}',
              purpose: 'Visualize research findings'
            },
            dependencies: ['read_data'],
            priority: 3
          },
          {
            id: 'add_references',
            agentType: 'reference_management',
            input: {
              content: '{{write_paper.result}}',
              topics: [input.researchQuestion],
              citationStyle: input.target?.style || 'APA'
            },
            dependencies: ['write_paper'],
            priority: 4
          },
          {
            id: 'compile_draft',
            agentType: 'draft_compilation',
            input: {
              sections: '{{write_paper.result}}',
              references: '{{add_references.result}}'
            },
            dependencies: ['write_paper', 'add_references'],
            priority: 5
          }
        ]
      })
    });
    
    // Quick Paper Writing Template
    this.registerTemplate({
      id: 'paper-writing-quick',
      name: 'Quick Paper Writing',
      description: 'Generate paper sections from existing data and research question',
      category: 'paper',
      tags: ['paper', 'writing', 'quick'],
      estimatedDuration: 15,
      requiredInput: {
        researchQuestion: {
          type: 'string',
          description: 'Main research question',
          required: true
        },
        data: {
          type: 'any',
          description: 'Research data or content',
          required: true
        }
      },
      optionalInput: {
        style: {
          type: 'string',
          description: 'Citation style',
          default: 'APA'
        }
      },
      createWorkflow: (input, context) => ({
        name: 'Quick Paper Writing',
        description: 'Fast paper generation',
        synthesisStrategy: 'sequential',
        tasks: [
          {
            id: 'write_paper',
            agentType: 'paper_writing',
            input: {
              researchQuestion: input.researchQuestion,
              data: input.data,
              style: { format: input.style || 'APA' }
            },
            priority: 1
          }
        ]
      })
    });
    
    // Presentation Generation Template
    this.registerTemplate({
      id: 'presentation-generation',
      name: 'Presentation Generation',
      description: 'Generate presentation slides from research data or paper',
      category: 'presentation',
      tags: ['presentation', 'slides', 'data'],
      estimatedDuration: 20,
      requiredInput: {
        dataSource: {
          type: 'object',
          description: 'Data source or paper ID',
          required: true
        }
      },
      optionalInput: {
        presentationType: {
          type: 'string',
          description: 'Type of presentation',
          default: 'conference'
        },
        duration: {
          type: 'number',
          description: 'Presentation duration in minutes',
          default: 15
        }
      },
      createWorkflow: (input, context) => ({
        name: 'Presentation Generation',
        description: 'Generate presentation from research',
        synthesisStrategy: 'sequential',
        tasks: [
          {
            id: 'read_data',
            agentType: 'data_reading',
            input: {
              dataSource: input.dataSource.type,
              sourceId: input.dataSource.sourceId,
              filePath: input.dataSource.filePath,
              fileContent: input.dataSource.fileContent
            },
            priority: 1
          },
          {
            id: 'analyze_data',
            agentType: 'data_analysis',
            input: {
              data: '{{read_data.result}}'
            },
            dependencies: ['read_data'],
            priority: 2
          },
          {
            id: 'generate_slides',
            agentType: 'presentation_slide',
            input: {
              source: {
                type: input.dataSource.type,
                content: '{{read_data.result}}',
                data: '{{analyze_data.result}}'
              },
              presentationType: input.presentationType || 'conference',
              duration: input.duration || 15
            },
            dependencies: ['read_data', 'analyze_data'],
            priority: 3
          },
          {
            id: 'generate_figures',
            agentType: 'figure_generation',
            input: {
              data: '{{read_data.result}}',
              purpose: 'Visualize for presentation'
            },
            dependencies: ['read_data'],
            priority: 3
          }
        ]
      })
    });
    
    // Literature Review Template
    this.registerTemplate({
      id: 'literature-review',
      name: 'Literature Review',
      description: 'Conduct comprehensive literature review on a topic',
      category: 'analysis',
      tags: ['literature', 'review', 'research'],
      estimatedDuration: 25,
      requiredInput: {
        topic: {
          type: 'string',
          description: 'Research topic',
          required: true
        }
      },
      optionalInput: {
        maxPapers: {
          type: 'number',
          description: 'Maximum number of papers',
          default: 20
        }
      },
      createWorkflow: (input, context) => ({
        name: 'Literature Review',
        description: 'Comprehensive literature review',
        synthesisStrategy: 'sequential',
        tasks: [
          {
            id: 'find_papers',
            agentType: 'paper_finding',
            input: {
              topic: input.topic,
              maxResults: input.maxPapers || 20
            },
            priority: 1
          },
          {
            id: 'literature_review',
            agentType: 'literature_review',
            input: {
              topic: input.topic,
              papers: '{{find_papers.result}}',
              maxPapers: input.maxPapers || 20
            },
            dependencies: ['find_papers'],
            priority: 2
          }
        ]
      })
    });
    
    // Experiment Design Template
    this.registerTemplate({
      id: 'experiment-design',
      name: 'Experiment Design',
      description: 'Design experiment and analyze results',
      category: 'experiment',
      tags: ['experiment', 'design', 'analysis'],
      estimatedDuration: 20,
      requiredInput: {
        researchQuestion: {
          type: 'string',
          description: 'Research question',
          required: true
        }
      },
      optionalInput: {
        constraints: {
          type: 'object',
          description: 'Experimental constraints',
          default: {}
        }
      },
      createWorkflow: (input, context) => ({
        name: 'Experiment Design',
        description: 'Design and analyze experiment',
        synthesisStrategy: 'sequential',
        tasks: [
          {
            id: 'design_experiment',
            agentType: 'experiment_design',
            input: {
              researchQuestion: input.researchQuestion,
              constraints: input.constraints || {}
            },
            priority: 1
          },
          {
            id: 'analyze_data',
            agentType: 'data_analysis',
            input: {
              researchQuestion: input.researchQuestion,
              data: 'Experimental data'
            },
            dependencies: ['design_experiment'],
            priority: 2
          }
        ]
      })
    });
    
    // Abstract Writing Template
    this.registerTemplate({
      id: 'abstract-writing',
      name: 'Abstract Writing',
      description: 'Generate abstract from research content',
      category: 'writing',
      tags: ['abstract', 'writing', 'quick'],
      estimatedDuration: 5,
      requiredInput: {
        content: {
          type: 'string',
          description: 'Research content or data',
          required: true
        }
      },
      optionalInput: {
        wordLimit: {
          type: 'number',
          description: 'Word limit for abstract',
          default: 250
        }
      },
      createWorkflow: (input, context) => ({
        name: 'Abstract Writing',
        description: 'Generate research abstract',
        synthesisStrategy: 'sequential',
        tasks: [
          {
            id: 'write_abstract',
            agentType: 'abstract_writing',
            input: {
              content: input.content,
              wordLimit: input.wordLimit || 250
            },
            priority: 1
          }
        ]
      })
    });
  }
}

// Singleton instance
export const workflowTemplateSystem = new WorkflowTemplateSystem();

