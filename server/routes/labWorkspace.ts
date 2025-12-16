/**
 * Lab Workspace Routes
 * ClickUp-inspired task management system for lab management
 */

import express, { type Router } from 'express';
import { Pool } from 'pg';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router: Router = express.Router();

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper function to get user's lab
async function getUserLab(userId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT lab_id FROM lab_members WHERE user_id = $1 AND is_active = true LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0].lab_id : null;
}

// Helper function to get workspace for lab
async function getWorkspaceForLab(labId: string): Promise<any | null> {
  const result = await pool.query(
    `SELECT * FROM lab_workspaces WHERE lab_id = $1 LIMIT 1`,
    [labId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
}

// ==================== Workspace Management ====================

// Get user's workspace
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Safety check for req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const labId = await getUserLab(userId);
    
    if (!labId) {
      return res.status(404).json({ error: 'User is not a member of any lab' });
    }

    const workspace = await getWorkspaceForLab(labId);
    
    if (!workspace) {
      // Auto-create workspace if it doesn't exist
      const createResult = await pool.query(
        `INSERT INTO lab_workspaces (lab_id, name, created_by)
         VALUES ($1, (SELECT name || ' Workspace' FROM labs WHERE id = $1), $2)
         RETURNING *`,
        [labId, userId]
      );
      
      // Create default space
      const spaceResult = await pool.query(
        `INSERT INTO workspace_spaces (workspace_id, name, created_by, position)
         VALUES ($1, 'General', $2, 0)
         RETURNING *`,
        [createResult.rows[0].id, userId]
      );
      
      // Create default list in the space
      await pool.query(
        `INSERT INTO workspace_lists (space_id, name, created_by, position)
         VALUES ($1, 'My Tasks', $2, 0)`,
        [spaceResult.rows[0].id, userId]
      );
      
      // Return workspace with spaces
      const newWorkspace = await getWorkspaceForLab(labId);
      if (newWorkspace) {
        const spaces = await pool.query(
          `SELECT s.*, 
            (SELECT COUNT(*) FROM workspace_tasks t WHERE t.space_id = s.id AND t.status != 'done') as task_count
           FROM workspace_spaces s
           WHERE s.workspace_id = $1 AND s.is_archived = false
           ORDER BY s.position, s.created_at`,
          [newWorkspace.id]
        );
        
        const spacesWithData = await Promise.all(
          spaces.rows.map(async (space) => {
            const directLists = await pool.query(
              `SELECT l.*,
                (SELECT COUNT(*) FROM workspace_tasks t WHERE t.list_id = l.id AND t.status != 'done') as task_count
               FROM workspace_lists l
               WHERE l.space_id = $1 AND l.folder_id IS NULL AND l.is_archived = false
               ORDER BY l.position, l.created_at`,
              [space.id]
            );
            return { ...space, folders: [], lists: directLists.rows };
          })
        );
        
        return res.json({
          workspace: { ...newWorkspace, spaces: spacesWithData }
        });
      }
      
      return res.json({ workspace: createResult.rows[0] });
    }

    // Get spaces with folders and lists
    const spaces = await pool.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM workspace_tasks t WHERE t.space_id = s.id AND t.status != 'done') as task_count
       FROM workspace_spaces s
       WHERE s.workspace_id = $1 AND s.is_archived = false
       ORDER BY s.position, s.created_at`,
      [workspace.id]
    );

    const spacesWithData = await Promise.all(
      spaces.rows.map(async (space) => {
        const folders = await pool.query(
          `SELECT f.*,
            (SELECT COUNT(*) FROM workspace_tasks t 
             JOIN workspace_lists l ON t.list_id = l.id 
             WHERE l.folder_id = f.id AND t.status != 'done') as task_count
           FROM workspace_folders f
           WHERE f.space_id = $1 AND f.is_archived = false
           ORDER BY f.position, f.created_at`,
          [space.id]
        );

        const foldersWithLists = await Promise.all(
          folders.rows.map(async (folder) => {
            const lists = await pool.query(
              `SELECT l.*,
                (SELECT COUNT(*) FROM workspace_tasks t WHERE t.list_id = l.id AND t.status != 'done') as task_count
               FROM workspace_lists l
               WHERE l.folder_id = $1 AND l.is_archived = false
               ORDER BY l.position, l.created_at`,
              [folder.id]
            );
            return { ...folder, lists: lists.rows };
          })
        );

        const directLists = await pool.query(
          `SELECT l.*,
            (SELECT COUNT(*) FROM workspace_tasks t WHERE t.list_id = l.id AND t.status != 'done') as task_count
           FROM workspace_lists l
           WHERE l.space_id = $1 AND l.folder_id IS NULL AND l.is_archived = false
           ORDER BY l.position, l.created_at`,
          [space.id]
        );

        return {
          ...space,
          folders: foldersWithLists,
          lists: directLists.rows
        };
      })
    );

    res.json({
      workspace: { ...workspace, spaces: spacesWithData, lab_id: labId }
    });
  } catch (error: any) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ error: 'Failed to fetch workspace', details: error.message });
  }
});

// Create space
router.post('/spaces', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, color, icon, workspace_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Space name is required' });
    }

    // Get workspace if not provided
    let workspaceId = workspace_id;
    if (!workspaceId) {
      const labId = await getUserLab(userId);
      if (!labId) {
        return res.status(404).json({ error: 'User is not a member of any lab' });
      }
      const workspace = await getWorkspaceForLab(labId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }
      workspaceId = workspace.id;
    }

    // Get max position
    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position
       FROM workspace_spaces WHERE workspace_id = $1`,
      [workspaceId]
    );

    const result = await pool.query(
      `INSERT INTO workspace_spaces (workspace_id, name, description, color, icon, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [workspaceId, name, description || null, color || '#6366f1', icon || null, positionResult.rows[0].next_position, userId]
    );

    res.status(201).json({ space: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating space:', error);
    res.status(500).json({ error: 'Failed to create space', details: error.message });
  }
});

// Update space
router.put('/spaces/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, color, icon, is_archived } = req.body;

    const result = await pool.query(
      `UPDATE workspace_spaces
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon),
           is_archived = COALESCE($5, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, color, icon, is_archived, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.json({ space: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating space:', error);
    res.status(500).json({ error: 'Failed to update space', details: error.message });
  }
});

// Delete space
router.delete('/spaces/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Archive instead of delete
    await pool.query(
      `UPDATE workspace_spaces SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Space archived successfully' });
  } catch (error: any) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Failed to delete space', details: error.message });
  }
});

// Create folder
router.post('/folders', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, color, space_id } = req.body;

    if (!name || !space_id) {
      return res.status(400).json({ error: 'Folder name and space_id are required' });
    }

    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position
       FROM workspace_folders WHERE space_id = $1`,
      [space_id]
    );

    const result = await pool.query(
      `INSERT INTO workspace_folders (space_id, name, description, color, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [space_id, name, description || null, color || '#8b5cf6', positionResult.rows[0].next_position, userId]
    );

    res.status(201).json({ folder: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder', details: error.message });
  }
});

// Update folder
router.put('/folders/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, color, is_archived } = req.body;

    const result = await pool.query(
      `UPDATE workspace_folders
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           is_archived = COALESCE($4, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, description, color, is_archived, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    res.json({ folder: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder', details: error.message });
  }
});

// Delete folder
router.delete('/folders/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Archive instead of delete
    await pool.query(
      `UPDATE workspace_folders SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Folder archived successfully' });
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder', details: error.message });
  }
});

// Create list
router.post('/lists', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, color, space_id, folder_id } = req.body;

    if (!name || !space_id) {
      return res.status(400).json({ error: 'List name and space_id are required' });
    }

    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position
       FROM workspace_lists 
       WHERE space_id = $1 AND (folder_id = $2 OR (folder_id IS NULL AND $2 IS NULL))`,
      [space_id, folder_id || null]
    );

    const result = await pool.query(
      `INSERT INTO workspace_lists (space_id, folder_id, name, description, color, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [space_id, folder_id || null, name, description || null, color || '#10b981', positionResult.rows[0].next_position, userId]
    );

    res.status(201).json({ list: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list', details: error.message });
  }
});

// ==================== Task Management ====================

// List tasks with filters
router.get('/tasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      workspace_id,
      space_id,
      list_id,
      status,
      priority,
      assignee_id,
      due_date_from,
      due_date_to,
      search,
      group_by,
      sort_by = 'position',
      sort_order = 'ASC'
    } = req.query;

    let query = `
      SELECT t.*,
        u1.first_name || ' ' || u1.last_name as assignee_name,
        u1.avatar_url as assignee_avatar,
        u2.first_name || ' ' || u2.last_name as creator_name,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id AND st.is_completed = false) as incomplete_subtasks,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id) as total_subtasks,
        (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) as comment_count
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (workspace_id) {
      paramCount++;
      query += ` AND t.workspace_id = $${paramCount}`;
      params.push(workspace_id);
    }

    if (space_id) {
      paramCount++;
      query += ` AND t.space_id = $${paramCount}`;
      params.push(space_id);
    }

    if (list_id) {
      paramCount++;
      query += ` AND t.list_id = $${paramCount}`;
      params.push(list_id);
    }

    if (status) {
      // Handle both single value and comma-separated values
      const statusArray = typeof status === 'string' ? status.split(',') : [status];
      if (statusArray.length > 0) {
        paramCount++;
        query += ` AND t.status = ANY($${paramCount})`;
        params.push(statusArray);
      }
    }

    if (priority) {
      // Handle both single value and comma-separated values
      const priorityArray = typeof priority === 'string' ? priority.split(',') : [priority];
      if (priorityArray.length > 0) {
        paramCount++;
        query += ` AND t.priority = ANY($${paramCount})`;
        params.push(priorityArray);
      }
    }

    if (assignee_id) {
      // Handle both single value and comma-separated values
      const assigneeArray = typeof assignee_id === 'string' ? assignee_id.split(',') : [assignee_id];
      if (assigneeArray.length > 0) {
        paramCount++;
        query += ` AND t.assignee_id = ANY($${paramCount})`;
        params.push(assigneeArray);
      }
    }

    if (due_date_from) {
      paramCount++;
      query += ` AND t.due_date >= $${paramCount}`;
      params.push(due_date_from);
    }

    if (due_date_to) {
      paramCount++;
      query += ` AND t.due_date <= $${paramCount}`;
      params.push(due_date_to);
    }

    if (search) {
      paramCount++;
      query += ` AND (t.title ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` AND t.is_archived = false`;

    // Validate sort_by
    const validSortFields = ['position', 'created_at', 'updated_at', 'due_date', 'priority', 'title'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'position';
    const sortDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY t.${sortField} ${sortDir}, t.position ASC`;

    const result = await pool.query(query, params);

    // Group tasks if group_by is specified
    let groupedTasks: any = {};
    if (group_by) {
      result.rows.forEach((task) => {
        const key = task[group_by as string] || 'unassigned';
        if (!groupedTasks[key]) {
          groupedTasks[key] = [];
        }
        groupedTasks[key].push(task);
      });
    }

    res.json({
      tasks: group_by ? groupedTasks : result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
});

// Create task
router.post('/tasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      status = 'to_do',
      priority = 'normal',
      due_date,
      start_date,
      assignee_id,
      list_id,
      space_id,
      folder_id,
      workspace_id,
      tags = [],
      project_id,
      protocol_id,
      inventory_item_id,
      instrument_id,
      time_estimated
    } = req.body;

    if (!title || !list_id) {
      return res.status(400).json({ error: 'Task title and list_id are required' });
    }

    // Get workspace and space if not provided
    let finalWorkspaceId = workspace_id;
    let finalSpaceId = space_id;

    if (!finalSpaceId || !finalWorkspaceId) {
      const listResult = await pool.query(
        `SELECT l.space_id, s.workspace_id 
         FROM workspace_lists l
         JOIN workspace_spaces s ON l.space_id = s.id
         WHERE l.id = $1`,
        [list_id]
      );

      if (listResult.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }

      finalSpaceId = listResult.rows[0].space_id;
      finalWorkspaceId = listResult.rows[0].workspace_id;
    }

    // Get max position in list
    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position
       FROM workspace_tasks WHERE list_id = $1`,
      [list_id]
    );

    const result = await pool.query(
      `INSERT INTO workspace_tasks (
        workspace_id, space_id, folder_id, list_id,
        title, description, status, priority,
        due_date, start_date, assignee_id, created_by,
        tags, project_id, protocol_id, inventory_item_id, instrument_id,
        time_estimated, position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        finalWorkspaceId,
        finalSpaceId,
        folder_id || null,
        list_id,
        title,
        description || null,
        status,
        priority,
        due_date || null,
        start_date || null,
        assignee_id || null,
        userId,
        tags,
        project_id || null,
        protocol_id || null,
        inventory_item_id || null,
        instrument_id || null,
        time_estimated || null,
        positionResult.rows[0].next_position
      ]
    );

    // Get full task with relations
    const taskResult = await pool.query(
      `SELECT t.*,
        u1.first_name || ' ' || u1.last_name as assignee_name,
        u1.avatar_url as assignee_avatar,
        u2.first_name || ' ' || u2.last_name as creator_name
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ task: taskResult.rows[0] });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
});

// Update task
router.put('/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const allowedFields = [
      'title', 'description', 'status', 'priority', 'due_date', 'start_date',
      'assignee_id', 'list_id', 'tags', 'progress_percentage', 'time_estimated',
      'time_tracked', 'project_id', 'protocol_id', 'inventory_item_id', 'instrument_id'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    values.push(id);

    const query = `UPDATE workspace_tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get full task with relations
    const taskResult = await pool.query(
      `SELECT t.*,
        u1.first_name || ' ' || u1.last_name as assignee_name,
        u1.avatar_url as assignee_avatar,
        u2.first_name || ' ' || u2.last_name as creator_name,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id AND st.is_completed = false) as incomplete_subtasks,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id) as total_subtasks
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1`,
      [id]
    );

    res.json({ task: taskResult.rows[0] });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

// Get single task
router.get('/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT t.*,
        u1.first_name || ' ' || u1.last_name as assignee_name,
        u1.avatar_url as assignee_avatar,
        u2.first_name || ' ' || u2.last_name as creator_name,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id AND st.is_completed = false) as incomplete_subtasks,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id) as total_subtasks,
        (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) as comment_count
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1 AND t.is_archived = false`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task', details: error.message });
  }
});

// Delete task
router.delete('/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Archive instead of delete
    await pool.query(
      `UPDATE workspace_tasks SET is_archived = true, archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Task archived successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task', details: error.message });
  }
});

// Add subtask
router.post('/tasks/:id/subtasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, assignee_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Subtask title is required' });
    }

    // Get max position
    const positionResult = await pool.query(
      `SELECT COALESCE(MAX(position), -1) + 1 as next_position
       FROM workspace_subtasks WHERE task_id = $1`,
      [id]
    );

    const result = await pool.query(
      `INSERT INTO workspace_subtasks (task_id, title, description, assignee_id, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, title, description || null, assignee_id || null, positionResult.rows[0].next_position, userId]
    );

    res.status(201).json({ subtask: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask', details: error.message });
  }
});

// Add comment
router.post('/tasks/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, content, parent_comment_id || null]
    );

    // Get comment with user info
    const commentResult = await pool.query(
      `SELECT c.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url as user_avatar
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ comment: commentResult.rows[0] });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
});

// Reorder tasks
router.put('/tasks/reorder', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { task_orders } = req.body; // Array of { task_id, position, list_id? }

    if (!Array.isArray(task_orders)) {
      return res.status(400).json({ error: 'task_orders must be an array' });
    }

    await pool.query('BEGIN');

    try {
      for (const order of task_orders) {
        if (order.list_id) {
          await pool.query(
            `UPDATE workspace_tasks SET position = $1, list_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [order.position, order.list_id, order.task_id]
          );
        } else {
          await pool.query(
            `UPDATE workspace_tasks SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [order.position, order.task_id]
          );
        }
      }

      await pool.query('COMMIT');
      res.json({ success: true, message: 'Tasks reordered successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks', details: error.message });
  }
});

// ==================== Views ====================

// Get board view data
router.get('/tasks/board', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { workspace_id, space_id, list_id } = req.query;

    let query = `
      SELECT t.*,
        u1.first_name || ' ' || u1.last_name as assignee_name,
        u1.avatar_url as assignee_avatar
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      WHERE t.is_archived = false
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (workspace_id) {
      paramCount++;
      query += ` AND t.workspace_id = $${paramCount}`;
      params.push(workspace_id);
    }

    if (space_id) {
      paramCount++;
      query += ` AND t.space_id = $${paramCount}`;
      params.push(space_id);
    }

    if (list_id) {
      paramCount++;
      query += ` AND t.list_id = $${paramCount}`;
      params.push(list_id);
    }

    query += ` ORDER BY t.position ASC`;

    const result = await pool.query(query, params);

    // Group by status
    const board: any = {
      to_do: [],
      in_progress: [],
      in_review: [],
      done: []
    };

    result.rows.forEach((task) => {
      if (board[task.status]) {
        board[task.status].push(task);
      }
    });

    res.json({ board });
  } catch (error: any) {
    console.error('Error fetching board view:', error);
    res.status(500).json({ error: 'Failed to fetch board view', details: error.message });
  }
});

// Get subtasks for a task
router.get('/tasks/:id/subtasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT s.*,
        u.first_name || ' ' || u.last_name as assignee_name,
        u.avatar_url as assignee_avatar
      FROM workspace_subtasks s
      LEFT JOIN users u ON s.assignee_id = u.id
      WHERE s.task_id = $1
      ORDER BY s.position ASC`,
      [id]
    );
    
    res.json({ subtasks: result.rows });
  } catch (error: any) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Failed to fetch subtasks', details: error.message });
  }
});

// Update subtask
router.put('/subtasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, is_completed, assignee_id } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }
    
    if (is_completed !== undefined) {
      paramCount++;
      if (is_completed) {
        updates.push(`is_completed = $${paramCount}, completed_at = CURRENT_TIMESTAMP`);
      } else {
        updates.push(`is_completed = $${paramCount}, completed_at = NULL`);
      }
      values.push(is_completed);
    }
    
    if (assignee_id !== undefined) {
      paramCount++;
      updates.push(`assignee_id = $${paramCount}`);
      values.push(assignee_id || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    paramCount++;
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    values.push(id);
    
    const query = `UPDATE workspace_subtasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    res.json({ subtask: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask', details: error.message });
  }
});

// Get comments for a task
router.get('/tasks/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.avatar_url as user_avatar
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC`,
      [id]
    );
    
    res.json({ comments: result.rows });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

// Update list
router.put('/lists/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, description, color, is_archived } = req.body;

    const result = await pool.query(
      `UPDATE workspace_lists
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           is_archived = COALESCE($4, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, description, color, is_archived, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ list: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: 'Failed to update list', details: error.message });
  }
});

// Delete list
router.delete('/lists/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Archive instead of delete
    await pool.query(
      `UPDATE workspace_lists SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'List archived successfully' });
  } catch (error: any) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list', details: error.message });
  }
});

// Get calendar view data
router.get('/tasks/calendar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { workspace_id, space_id, start_date, end_date } = req.query;

    let query = `
      SELECT t.*,
        u1.first_name || ' ' || u1.last_name as assignee_name,
        u1.avatar_url as assignee_avatar
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      WHERE t.is_archived = false
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (workspace_id) {
      paramCount++;
      query += ` AND t.workspace_id = $${paramCount}`;
      params.push(workspace_id);
    }

    if (space_id) {
      paramCount++;
      query += ` AND t.space_id = $${paramCount}`;
      params.push(space_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND (t.due_date >= $${paramCount} OR t.start_date >= $${paramCount})`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND (t.due_date <= $${paramCount} OR t.start_date <= $${paramCount})`;
      params.push(end_date);
    }

    query += ` ORDER BY t.due_date ASC, t.start_date ASC`;

    const result = await pool.query(query, params);

    res.json({ tasks: result.rows });
  } catch (error: any) {
    console.error('Error fetching calendar view:', error);
    res.status(500).json({ error: 'Failed to fetch calendar view', details: error.message });
  }
});

export default router;

