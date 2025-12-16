/**
 * Agent Execution API Routes
 * Endpoints for executing individual agents directly
 */

import { Router } from 'express';
import { AgentFactory } from '../services/AgentFactory.js';
import { UserContextRetriever } from '../services/UserContextRetriever.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

/**
 * Execute a specific agent
 * POST /api/agents/:agentType/execute
 */
router.post('/:agentType/execute', authenticateToken, async (req: any, res) => {
  try {
    const { agentType } = req.params;
    const { input, config } = req.body;
    const userId = req.user?.id;
    
    if (!AgentFactory.isAgentSupported(agentType)) {
      return res.status(400).json({
        error: `Unsupported agent type: ${agentType}`,
        availableAgents: AgentFactory.getAvailableAgents()
      });
    }
    
    // Create agent
    const agent = AgentFactory.createAgent(agentType);
    
    // Validate input
    if (!agent.validateInput(input)) {
      return res.status(400).json({
        error: 'Invalid input for agent',
        agentType,
        requiredContext: agent.getRequiredContext()
      });
    }
    
    // Retrieve user context if needed
    const requiredContext = agent.getRequiredContext();
    const userContext = requiredContext.length > 0
      ? await UserContextRetriever.retrieveContext(userId, input.query || input.content || '')
      : { user: null, papers: [], notebooks: [], protocols: [], experiments: [], relevantContent: [] };
    
    // Execute agent
    const result = await agent.execute(input, {
      userContext,
      conversationHistory: [],
      additionalData: { userId }
    }, config);
    
    if (result.success) {
      res.json({
        success: true,
        result: result.content,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        metadata: result.metadata
      });
    }
  } catch (error: any) {
    console.error('Error executing agent:', error);
    res.status(500).json({
      error: 'Failed to execute agent',
      details: error.message
    });
  }
});

/**
 * Get available agents
 * GET /api/agents
 */
router.get('/', authenticateToken, (req, res) => {
  const agents = AgentFactory.getAvailableAgents().map(agentType => {
    const agent = AgentFactory.createAgent(agentType);
    return {
      type: agent.agentType,
      name: agent.agentName,
      description: agent.description,
      requiredContext: agent.getRequiredContext()
    };
  });
  
  res.json({ agents });
});

/**
 * Get agent details
 * GET /api/agents/:agentType
 */
router.get('/:agentType', authenticateToken, (req: any, res) => {
  const { agentType } = req.params;
  
  if (!AgentFactory.isAgentSupported(agentType)) {
    return res.status(400).json({
      error: `Unsupported agent type: ${agentType}`,
      availableAgents: AgentFactory.getAvailableAgents()
    });
  }
  
  const agent = AgentFactory.createAgent(agentType);
  
  res.json({
    type: agent.agentType,
    name: agent.agentName,
    description: agent.description,
    requiredContext: agent.getRequiredContext()
  });
});

export default router;

