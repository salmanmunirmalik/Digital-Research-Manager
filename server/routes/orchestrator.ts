/**
 * Research Orchestrator API Routes
 * Endpoints for executing multi-agent workflows
 */

import { Router } from 'express';
import { ResearchOrchestrator, WorkflowDefinition } from '../services/ResearchOrchestrator.js';
import { UserContextRetriever } from '../services/UserContextRetriever.js';
import { authenticateToken } from '../middleware/auth.js';
import { PaperGenerationPipeline } from '../services/workflows/PaperGenerationPipeline.js';
import { PresentationGenerationPipeline } from '../services/workflows/PresentationGenerationPipeline.js';
import { WorkflowTemplateSystem } from '../services/workflows/WorkflowTemplateSystem.js';
import { AutonomousLiteratureSynthesisWorkflow } from '../services/workflows/AutonomousLiteratureSynthesisWorkflow.js';
import { AutonomousExperimentDesignWorkflow } from '../services/workflows/AutonomousExperimentDesignWorkflow.js';
import { AutonomousDataAnalysisWorkflow } from '../services/workflows/AutonomousDataAnalysisWorkflow.js';

const router: Router = Router();

/**
 * Paper Generation Pipeline
 * POST /api/orchestrator/paper-generation
 */
router.post('/paper-generation', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const pipeline = new PaperGenerationPipeline();
    
    const result = await pipeline.execute(req.body, userId);
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error executing paper generation pipeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute paper generation pipeline'
    });
  }
});

/**
 * Presentation Generation Pipeline
 * POST /api/orchestrator/presentation-generation
 */
router.post('/presentation-generation', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const pipeline = new PresentationGenerationPipeline();
    
    const result = await pipeline.execute(req.body, userId);
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error executing presentation generation pipeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute presentation generation pipeline'
    });
  }
});

/**
 * Autonomous Literature Synthesis Workflow
 * POST /api/orchestrator/autonomous-literature-synthesis
 */
router.post('/autonomous-literature-synthesis', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userContext = await UserContextRetriever.retrieveContext(userId, '');
    
    const workflow = new AutonomousLiteratureSynthesisWorkflow();
    const result = await workflow.execute(req.body, userId, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error executing autonomous literature synthesis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute autonomous literature synthesis'
    });
  }
});

/**
 * Autonomous Experiment Design Workflow
 * POST /api/orchestrator/autonomous-experiment-design
 */
router.post('/autonomous-experiment-design', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userContext = await UserContextRetriever.retrieveContext(userId, '');
    
    const workflow = new AutonomousExperimentDesignWorkflow();
    const result = await workflow.execute(req.body, userId, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error executing autonomous experiment design:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute autonomous experiment design'
    });
  }
});

/**
 * Autonomous Data Analysis Workflow
 * POST /api/orchestrator/autonomous-data-analysis
 */
router.post('/autonomous-data-analysis', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userContext = await UserContextRetriever.retrieveContext(userId, '');
    
    const workflow = new AutonomousDataAnalysisWorkflow();
    const result = await workflow.execute(req.body, userId, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error executing autonomous data analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute autonomous data analysis'
    });
  }
});

/**
 * Execute a custom workflow
 * POST /api/orchestrator/execute
 */
router.post('/execute', authenticateToken, async (req: any, res) => {
  try {
    const { workflow } = req.body;
    const userId = req.user?.id;
    
    if (!workflow || !workflow.tasks || workflow.tasks.length === 0) {
      return res.status(400).json({
        error: 'Workflow definition with tasks is required'
      });
    }
    
    // Retrieve user context
    const userContext = await UserContextRetriever.retrieveContext(userId, '');
    
    // Create orchestrator
    const orchestrator = new ResearchOrchestrator(workflow, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    });
    
    // Execute workflow
    const result = await orchestrator.execute();
    
    if (result.success) {
      res.json({
        success: true,
        workflowId: result.workflowId,
        result: result.synthesizedResult,
        tasks: result.tasks,
        metadata: result.metadata,
        duration: result.totalDuration
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Workflow execution failed',
        tasks: result.tasks,
        metadata: result.metadata
      });
    }
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      error: 'Failed to execute workflow',
      details: error.message
    });
  }
});

/**
 * Execute a predefined workflow
 * POST /api/orchestrator/execute/:workflowType
 */
router.post('/execute/:workflowType', authenticateToken, async (req: any, res) => {
  try {
    const { workflowType } = req.params;
    const { input } = req.body;
    const userId = req.user?.id;
    
    // Retrieve user context
    const userContext = await UserContextRetriever.retrieveContext(userId, '');
    
    let workflow: WorkflowDefinition;
    
    switch (workflowType) {
      case 'paper-generation':
        if (!input?.researchQuestion) {
          return res.status(400).json({
            error: 'researchQuestion is required for paper-generation workflow'
          });
        }
        workflow = ResearchOrchestrator.createPaperGenerationWorkflow(
          input.researchQuestion,
          input.data,
          { userContext, conversationHistory: [], additionalData: { userId } }
        );
        break;
      
      case 'experiment':
        if (!input?.researchQuestion) {
          return res.status(400).json({
            error: 'researchQuestion is required for experiment workflow'
          });
        }
        workflow = ResearchOrchestrator.createExperimentWorkflow(
          input.researchQuestion,
          input.constraints,
          { userContext, conversationHistory: [], additionalData: { userId } }
        );
        break;
      
      default:
        return res.status(400).json({
          error: `Unknown workflow type: ${workflowType}`,
          availableTypes: ['paper-generation', 'experiment']
        });
    }
    
    // Create orchestrator
    const orchestrator = new ResearchOrchestrator(workflow, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    });
    
    // Execute workflow
    const result = await orchestrator.execute();
    
    if (result.success) {
      res.json({
        success: true,
        workflowId: result.workflowId,
        workflowType,
        result: result.synthesizedResult,
        tasks: result.tasks,
        metadata: result.metadata,
        duration: result.totalDuration
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Workflow execution failed',
        tasks: result.tasks,
        metadata: result.metadata
      });
    }
  } catch (error: any) {
    console.error('Error executing predefined workflow:', error);
    res.status(500).json({
      error: 'Failed to execute workflow',
      details: error.message
    });
  }
});

/**
 * Get available workflow templates
 * GET /api/orchestrator/templates
 */
router.get('/templates', authenticateToken, (req: any, res) => {
  const templateSystem = new WorkflowTemplateSystem();
  
  const category = req.query.category as string | undefined;
  const tag = req.query.tag as string | undefined;
  const search = req.query.search as string | undefined;
  
  let templates;
  
  if (category) {
    templates = templateSystem.getTemplatesByCategory(category as any);
  } else if (tag) {
    templates = templateSystem.getTemplatesByTag(tag);
  } else if (search) {
    templates = templateSystem.searchTemplates(search);
  } else {
    templates = templateSystem.getAllTemplates();
  }
  
  res.json({
    templates: templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      tags: t.tags,
      estimatedDuration: t.estimatedDuration,
      estimatedCost: t.estimatedCost,
      requiredInput: t.requiredInput,
      optionalInput: t.optionalInput
    }))
  });
});

/**
 * Get a specific workflow template
 * GET /api/orchestrator/templates/:templateId
 */
router.get('/templates/:templateId', authenticateToken, (req: any, res) => {
  const templateSystem = new WorkflowTemplateSystem();
  
  const template = templateSystem.getTemplate(req.params.templateId);
  
  if (!template) {
    return res.status(404).json({
      error: `Template ${req.params.templateId} not found`
    });
  }
  
  res.json({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    estimatedDuration: template.estimatedDuration,
    estimatedCost: template.estimatedCost,
    requiredInput: template.requiredInput,
    optionalInput: template.optionalInput
  });
});

/**
 * Create workflow from template
 * POST /api/orchestrator/templates/:templateId/execute
 */
router.post('/templates/:templateId/execute', authenticateToken, async (req: any, res) => {
  try {
    const templateSystem = new WorkflowTemplateSystem();
    
    const template = templateSystem.getTemplate(req.params.templateId);
    if (!template) {
      return res.status(404).json({
        error: `Template ${req.params.templateId} not found`
      });
    }
    
    const userId = req.user.id;
    const userContext = await UserContextRetriever.retrieveContext(userId, '');
    
    // Create workflow from template
    const workflow = templateSystem.createWorkflowFromTemplate(
      req.params.templateId,
      req.body,
      {
        userContext,
        conversationHistory: [],
        additionalData: { userId }
      }
    );
    
    // Execute workflow
    const orchestrator = new ResearchOrchestrator(workflow, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    });
    
    const result = await orchestrator.execute();
    
    if (result.success) {
      res.json({
        success: true,
        templateId: req.params.templateId,
        workflowId: result.workflowId,
        result: result.synthesizedResult,
        tasks: result.tasks,
        metadata: result.metadata,
        duration: result.totalDuration
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Workflow execution failed',
        tasks: result.tasks,
        metadata: result.metadata
      });
    }
  } catch (error: any) {
    console.error('Error executing template workflow:', error);
    res.status(500).json({
      error: 'Failed to execute template workflow',
      details: error.message
    });
  }
});

export default router;

