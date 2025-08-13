import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all projects for the authenticated user
router.get('/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = getDatabase();
    const projects = await db.all(`
      SELECT p.*, u.username as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ?
      ORDER BY p.updated_at DESC
    `, [req.user.id]);

    res.json({ projects });
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create new project
router.post('/projects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const db = getDatabase();
    const projectId = uuidv4();
    
    await db.run(`
      INSERT INTO projects (id, name, description, owner_id)
      VALUES (?, ?, ?, ?)
    `, [projectId, name, description, req.user.id]);

    res.status(201).json({
      message: 'Project created successfully',
      projectId
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project with experiments and entries
router.get('/projects/:projectId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const db = getDatabase();
    
    // Get project details
    const project = await db.get(`
      SELECT p.*, u.username as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [projectId]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get experiments
    const experiments = await db.all(`
      SELECT * FROM experiments WHERE project_id = ? ORDER BY created_at DESC
    `, [projectId]);

    // Get notebook entries for each experiment
    const experimentsWithEntries = await Promise.all(
      experiments.map(async (experiment) => {
        const entries = await db.all(`
          SELECT ne.*, u.username as author_name
          FROM notebook_entries ne
          JOIN users u ON ne.author_id = u.id
          WHERE ne.experiment_id = ?
          ORDER BY ne.last_modified DESC
        `, [experiment.id]);

        // Get content blocks for each entry
        const entriesWithContent = await Promise.all(
          entries.map(async (entry) => {
            const contentBlocks = await db.all(`
              SELECT * FROM content_blocks 
              WHERE entry_id = ? 
              ORDER BY order_index
            `, [entry.id]);

            return {
              ...entry,
              content: contentBlocks.map(block => ({
                ...block,
                data: JSON.parse(block.data)
              }))
            };
          })
        );

        return {
          ...experiment,
          entries: entriesWithContent
        };
      })
    );

    const projectWithDetails = {
      ...project,
      experiments: experimentsWithEntries
    };

    res.json({ project: projectWithDetails });
  } catch (error) {
    console.error('Fetch project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new experiment
router.post('/projects/:projectId/experiments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { projectId } = req.params;
    const { name, goal } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Experiment name is required' });
    }

    const db = getDatabase();
    
    // Verify project ownership
    const project = await db.get('SELECT owner_id FROM projects WHERE id = ?', [projectId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const experimentId = uuidv4();
    
    await db.run(`
      INSERT INTO experiments (id, project_id, name, goal)
      VALUES (?, ?, ?, ?)
    `, [experimentId, projectId, name, goal]);

    res.status(201).json({
      message: 'Experiment created successfully',
      experimentId
    });
  } catch (error) {
    console.error('Create experiment error:', error);
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

// Create new notebook entry
router.post('/experiments/:experimentId/entries', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { experimentId } = req.params;
    const { title, protocolId, content, summary } = req.body;
    
    if (!title || !content || !Array.isArray(content)) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const db = getDatabase();
    
    // Verify experiment exists and user has access
    const experiment = await db.get(`
      SELECT e.*, p.owner_id 
      FROM experiments e
      JOIN projects p ON e.project_id = p.id
      WHERE e.id = ?
    `, [experimentId]);

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    if (experiment.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const entryId = uuidv4();
    
    // Create notebook entry
    await db.run(`
      INSERT INTO notebook_entries (
        id, experiment_id, title, author_id, protocol_id, summary, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [entryId, experimentId, title, req.user.id, protocolId, summary, 'In Progress']);

    // Create content blocks
    for (let i = 0; i < content.length; i++) {
      const block = content[i];
      const blockId = uuidv4();
      
      await db.run(`
        INSERT INTO content_blocks (id, entry_id, type, data, order_index)
        VALUES (?, ?, ?, ?, ?)
      `, [blockId, entryId, block.type, JSON.stringify(block.data), i]);
    }

    res.status(201).json({
      message: 'Notebook entry created successfully',
      entryId
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Failed to create notebook entry' });
  }
});

// Update notebook entry
router.put('/entries/:entryId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { entryId } = req.params;
    const { title, content, summary, status } = req.body;
    
    const db = getDatabase();
    
    // Verify entry exists and user has access
    const entry = await db.get(`
      SELECT ne.*, p.owner_id 
      FROM notebook_entries ne
      JOIN experiments e ON ne.experiment_id = e.id
      JOIN projects p ON e.project_id = p.id
      WHERE ne.id = ?
    `, [entryId]);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.owner_id !== req.user.id && entry.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update entry
    await db.run(`
      UPDATE notebook_entries SET 
        title = ?, summary = ?, status = ?, last_modified = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, summary, status, entryId]);

    // Update content blocks if provided
    if (content && Array.isArray(content)) {
      // Delete existing content blocks
      await db.run('DELETE FROM content_blocks WHERE entry_id = ?', [entryId]);
      
      // Insert new content blocks
      for (let i = 0; i < content.length; i++) {
        const block = content[i];
        const blockId = uuidv4();
        
        await db.run(`
          INSERT INTO content_blocks (id, entry_id, type, data, order_index)
          VALUES (?, ?, ?, ?, ?)
        `, [blockId, entryId, block.type, JSON.stringify(block.data), i]);
      }
    }

    res.json({ message: 'Notebook entry updated successfully' });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Failed to update notebook entry' });
  }
});

// Get single notebook entry
router.get('/entries/:entryId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { entryId } = req.params;
    const db = getDatabase();
    
    const entry = await db.get(`
      SELECT ne.*, u.username as author_name, e.name as experiment_name, p.name as project_name
      FROM notebook_entries ne
      JOIN users u ON ne.author_id = u.id
      JOIN experiments e ON ne.experiment_id = e.id
      JOIN projects p ON e.project_id = p.id
      WHERE ne.id = ?
    `, [entryId]);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Get content blocks
    const contentBlocks = await db.all(`
      SELECT * FROM content_blocks 
      WHERE entry_id = ? 
      ORDER BY order_index
    `, [entryId]);

    const entryWithContent = {
      ...entry,
      content: contentBlocks.map(block => ({
        ...block,
        data: JSON.parse(block.data)
      }))
    };

    res.json({ entry: entryWithContent });
  } catch (error) {
    console.error('Fetch entry error:', error);
    res.status(500).json({ error: 'Failed to fetch notebook entry' });
  }
});

// Delete notebook entry
router.delete('/entries/:entryId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { entryId } = req.params;
    const db = getDatabase();
    
    // Verify entry exists and user has access
    const entry = await db.get(`
      SELECT ne.*, p.owner_id 
      FROM notebook_entries ne
      JOIN experiments e ON ne.experiment_id = e.id
      JOIN projects p ON e.project_id = p.id
      WHERE ne.id = ?
    `, [entryId]);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.owner_id !== req.user.id && entry.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Delete entry (cascade will delete content blocks)
    await db.run('DELETE FROM notebook_entries WHERE id = ?', [entryId]);

    res.json({ message: 'Notebook entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Failed to delete notebook entry' });
  }
});

export default router;
