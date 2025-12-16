/**
 * Workflow Builder API Routes
 * Visual workflow creation and execution system (Make.com style)
 */

import { Router } from 'express';
import pool from "../../database/config.js";
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

// Get user's workflows
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        id, name, description, is_active, config,
        execution_count, last_executed_at, success_count, failure_count,
        created_at, updated_at
      FROM workflows
      WHERE user_id = $1
      ORDER BY updated_at DESC`,
      [userId]
    );
    
    res.json({ workflows: result.rows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Get single workflow
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM workflows WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json({ workflow: result.rows[0] });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Create workflow
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, description, config } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO workflows (user_id, name, description, config)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, description || null, JSON.stringify(config || {})]
    );
    
    res.json({ workflow: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Workflow with this name already exists' });
    }
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, config, is_active } = req.body;
    
    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM workflows WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(config));
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id, userId);
    
    const result = await pool.query(
      `UPDATE workflows 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    
    res.json({ workflow: result.rows[0] });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM workflows WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// Execute workflow
router.post('/:id/execute', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { input_data } = req.body;
    
    // Get workflow
    const workflowResult = await pool.query(
      'SELECT * FROM workflows WHERE id = $1 AND user_id = $2 AND is_active = true',
      [id, userId]
    );
    
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found or inactive' });
    }
    
    const workflow = workflowResult.rows[0];
    const config = workflow.config;
    
    // Create execution record
    const executionResult = await pool.query(
      `INSERT INTO workflow_executions (workflow_id, user_id, status, input_data)
       VALUES ($1, $2, 'running', $3)
       RETURNING id`,
      [id, userId, JSON.stringify(input_data || {})]
    );
    
    const executionId = executionResult.rows[0].id;
    const startTime = Date.now();
    
    try {
      // Execute workflow
      const output = await executeWorkflow(config, input_data || {}, userId);
      const executionTime = Date.now() - startTime;
      
      // Update execution record
      await pool.query(
        `UPDATE workflow_executions 
         SET status = 'completed', output_data = $1, execution_time_ms = $2, completed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [JSON.stringify(output), executionTime, executionId]
      );
      
      // Update workflow stats
      await pool.query(
        `UPDATE workflows 
         SET execution_count = execution_count + 1,
             success_count = success_count + 1,
             last_executed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      
      res.json({ 
        success: true, 
        output,
        execution_id: executionId,
        execution_time_ms: executionTime
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // Update execution record with error
      await pool.query(
        `UPDATE workflow_executions 
         SET status = 'failed', error_message = $1, execution_time_ms = $2, completed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [error.message, executionTime, executionId]
      );
      
      // Update workflow stats
      await pool.query(
        `UPDATE workflows 
         SET execution_count = execution_count + 1,
             failure_count = failure_count + 1,
             last_executed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      
      res.status(500).json({ 
        error: 'Workflow execution failed', 
        message: error.message,
        execution_id: executionId
      });
    }
  } catch (error: any) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ error: 'Failed to execute workflow', message: error.message });
  }
});

// Get workflow execution history
router.get('/:id/executions', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    // Verify ownership
    const check = await pool.query(
      'SELECT id FROM workflows WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const result = await pool.query(
      `SELECT * FROM workflow_executions
       WHERE workflow_id = $1
       ORDER BY started_at DESC
       LIMIT $2`,
      [id, limit]
    );
    
    res.json({ executions: result.rows });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

/**
 * Execute workflow based on config
 */
async function executeWorkflow(config: any, inputData: any, userId: string): Promise<any> {
  const nodes = config.nodes || [];
  const connections = config.connections || [];
  
  if (nodes.length === 0) {
    throw new Error('Workflow has no nodes');
  }
  
  // Find start node (input node)
  const startNode = nodes.find((n: any) => n.type === 'input');
  if (!startNode) {
    throw new Error('Workflow must have an input node');
  }
  
  // Build execution graph
  const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));
  const nodeOutputs = new Map<string, any>();
  
  // Set input data
  nodeOutputs.set(startNode.id, inputData);
  
  // Execute nodes in topological order
  const executed = new Set<string>();
  const queue: string[] = [startNode.id];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    
    if (executed.has(nodeId)) {
      continue;
    }
    
    const node = nodeMap.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    // Get input data from connected nodes
    const inputConnections = connections.filter((c: any) => c.to === nodeId);
    const nodeInputs: any = {};
    
    for (const conn of inputConnections) {
      if (!executed.has(conn.from)) {
        // Dependency not executed yet, skip for now
        queue.push(nodeId);
        continue;
      }
      
      const fromOutput = nodeOutputs.get(conn.from);
      nodeInputs[conn.fromOutput || 'data'] = fromOutput;
    }
    
    // Execute node
    const output = await executeNode(node, nodeInputs, userId);
    nodeOutputs.set(nodeId, output);
    executed.add(nodeId);
    
    // Add connected nodes to queue
    const outputConnections = connections.filter((c: any) => c.from === nodeId);
    for (const conn of outputConnections) {
      if (!executed.has(conn.to)) {
        queue.push(conn.to);
      }
    }
  }
  
  // Find output node and return its data
  const outputNode = nodes.find((n: any) => n.type === 'output');
  if (outputNode && nodeOutputs.has(outputNode.id)) {
    return nodeOutputs.get(outputNode.id);
  }
  
  // Return last node's output
  const lastNodeId = Array.from(executed).pop();
  return lastNodeId ? nodeOutputs.get(lastNodeId) : {};
}

/**
 * Execute a single node
 */
async function executeNode(node: any, inputs: any, userId: string): Promise<any> {
  switch (node.type) {
    case 'input':
      return inputs.data || inputs;
    
    case 'api_call':
      return await executeApiCallNode(node, inputs, userId);
    
    case 'transform':
      return executeTransformNode(node, inputs);
    
    case 'condition':
      return executeConditionNode(node, inputs);
    
    case 'output':
      return inputs.data || inputs;
    
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * Execute API Call node
 */
async function executeApiCallNode(node: any, inputs: any, userId: string): Promise<any> {
  const { api_key_id, provider, endpoint, method, headers, body_template } = node.config;
  
  // Get API key
  const { getApiForTask } = await import('./apiTaskAssignments.js');
  const apiAssignment = await getApiForTask(userId, 'content_writing'); // Temporary
  
  if (!apiAssignment) {
    throw new Error('API key not found');
  }
  
  // Build request
  const axios = (await import('axios')).default;
  const url = endpoint || getDefaultEndpoint(provider);
  
  // Replace template variables in body
  let body = body_template || {};
  if (typeof body === 'string') {
    // Replace {{variable}} with actual values
    body = body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return inputs[key] || match;
    });
    try {
      body = JSON.parse(body);
    } catch {
      // Keep as string
    }
  }
  
  const response = await axios({
    method: method || 'POST',
    url,
    headers: {
      'Authorization': `Bearer ${apiAssignment.apiKey}`,
      'Content-Type': 'application/json',
      ...headers
    },
    data: body
  });
  
  return response.data;
}

function getDefaultEndpoint(provider: string): string {
  const endpoints: Record<string, string> = {
    'openai': 'https://api.openai.com/v1/chat/completions',
    'google_gemini': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    'anthropic_claude': 'https://api.anthropic.com/v1/messages',
    'perplexity': 'https://api.perplexity.ai/chat/completions'
  };
  
  return endpoints[provider] || '';
}

/**
 * Execute Transform node
 */
function executeTransformNode(node: any, inputs: any): any {
  const { mapping } = node.config;
  
  if (!mapping) {
    return inputs;
  }
  
  const output: any = {};
  
  for (const [outputKey, inputKey] of Object.entries(mapping)) {
    if (typeof inputKey === 'string' && inputs[inputKey] !== undefined) {
      output[outputKey] = inputs[inputKey];
    } else if (typeof inputKey === 'object') {
      // Complex mapping
      output[outputKey] = inputKey;
    }
  }
  
  return output;
}

/**
 * Execute Condition node
 */
function executeConditionNode(node: any, inputs: any): any {
  const { condition, true_path, false_path } = node.config;
  
  // Simple condition evaluation
  const { field, operator, value } = condition || {};
  
  let result = false;
  
  if (field && inputs[field] !== undefined) {
    const fieldValue = inputs[field];
    
    switch (operator) {
      case 'equals':
        result = fieldValue === value;
        break;
      case 'not_equals':
        result = fieldValue !== value;
        break;
      case 'greater_than':
        result = fieldValue > value;
        break;
      case 'less_than':
        result = fieldValue < value;
        break;
      case 'contains':
        result = String(fieldValue).includes(String(value));
        break;
    }
  }
  
  return {
    condition_result: result,
    data: inputs.data || inputs
  };
}

export default router;

