/**
 * Lab Workspace Routes
 * ClickUp-inspired task management system for lab management
 * MySQL-compatible (VARCHAR UUID ids, 0/1 booleans, no RETURNING)
 */

import crypto from 'crypto';
import express, { type Router } from 'express';
import pool from '../../database/config.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router: Router = express.Router();

function toBoolInt(value: unknown): number {
  return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
}

function appendInFilter(
  query: string,
  params: any[],
  paramCount: number,
  column: string,
  raw: unknown
): { query: string; paramCount: number } {
  const values = (typeof raw === 'string' ? raw.split(',') : Array.isArray(raw) ? raw : [raw])
    .map((v) => String(v).trim())
    .filter(Boolean);
  if (values.length === 0) {
    return { query, paramCount };
  }
  const placeholders = values.map(() => {
    paramCount++;
    return `$${paramCount}`;
  });
  params.push(...values);
  return {
    query: `${query} AND ${column} IN (${placeholders.join(', ')})`,
    paramCount
  };
}

// Helper function to get user's first lab membership
async function getUserLab(userId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT lab_id FROM lab_members WHERE user_id = $1 AND is_active = 1 LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0 ? result.rows[0].lab_id : null;
}

async function listUserLabs(userId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT l.*, lm.role AS membership_role,
      COALESCE(l.is_showcased, 0) AS is_showcased
     FROM lab_members lm
     JOIN labs l ON l.id = lm.lab_id
     WHERE lm.user_id = $1 AND lm.is_active = 1
     ORDER BY l.name ASC`,
    [userId]
  );
  return result.rows;
}

async function userBelongsToLab(userId: string, labId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 AS ok FROM lab_members
     WHERE user_id = $1 AND lab_id = $2 AND is_active = 1 LIMIT 1`,
    [userId, labId]
  );
  return result.rows.length > 0;
}

/** Resolve active lab: optional lab_id query (must be a membership), else first / auto-create. */
async function resolveActiveLabId(userId: string, requestedLabId?: string | null): Promise<string> {
  if (requestedLabId && (await userBelongsToLab(userId, requestedLabId))) {
    return requestedLabId;
  }
  return ensureUserLab(userId);
}

/** Ensure the user belongs to a lab; create a personal lab if needed (private, not showcased). */
async function ensureUserLab(userId: string): Promise<string> {
  const existing = await getUserLab(userId);
  if (existing) return existing;

  const userResult = await pool.query(
    `SELECT id, username, email, first_name, last_name, current_institution, department
     FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) {
    throw new Error('User not found');
  }

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    user.username ||
    user.email ||
    'Personal';

  const institution = user.current_institution || null;
  // Neutral lab label - avoid "{Person}'s Lab" in the shared ops UI
  const labName = institution ? `${institution} lab` : 'Personal lab';

  const labId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO labs (
      id, name, description, institution, department, principal_researcher_id, contact_email, is_showcased
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0)`,
    [
      labId,
      labName,
      `Lab workspace for ${displayName}`,
      institution || 'Independent',
      user.department || 'General',
      userId,
      user.email || null,
    ]
  );

  await pool.query(
    `INSERT INTO lab_members (id, lab_id, user_id, role, permissions, is_active)
     VALUES ($1, $2, $3, $4, $5, 1)`,
    [crypto.randomUUID(), labId, userId, 'principal_researcher', '{}']
  );

  return labId;
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
    const requestedLabId =
      typeof req.query.lab_id === 'string' && req.query.lab_id.trim()
        ? req.query.lab_id.trim()
        : null;
    const labId = await resolveActiveLabId(userId, requestedLabId);
    const myLabs = await listUserLabs(userId);

    const workspace = await getWorkspaceForLab(labId);
    
    if (!workspace) {
      // Auto-create workspace if it doesn't exist
      const workspaceId = crypto.randomUUID();
      const workspaceName = 'Lab workspace';
      await pool.query(
        `INSERT INTO lab_workspaces (id, lab_id, name, created_by)
         VALUES ($1, $2, $3, $4)`,
        [workspaceId, labId, workspaceName, userId]
      );
      
      // Create default space
      const spaceId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO workspace_spaces (id, workspace_id, name, created_by, position)
         VALUES ($1, $2, 'General', $3, 0)`,
        [spaceId, workspaceId, userId]
      );
      
      // Create default list in the space
      const listId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO workspace_lists (id, space_id, name, created_by, position)
         VALUES ($1, $2, 'My Tasks', $3, 0)`,
        [listId, spaceId, userId]
      );
      
      // Return workspace with spaces
      const newWorkspace = await getWorkspaceForLab(labId);
      if (newWorkspace) {
        const spaces = await pool.query(
          `SELECT s.*, 
            (SELECT COUNT(*) FROM workspace_tasks t WHERE t.space_id = s.id AND t.status != 'done') as task_count
           FROM workspace_spaces s
           WHERE s.workspace_id = $1 AND s.is_archived = 0
           ORDER BY s.position, s.created_at`,
          [newWorkspace.id]
        );
        
        const spacesWithData = await Promise.all(
          spaces.rows.map(async (space) => {
            const directLists = await pool.query(
              `SELECT l.*,
                (SELECT COUNT(*) FROM workspace_tasks t WHERE t.list_id = l.id AND t.status != 'done') as task_count
               FROM workspace_lists l
               WHERE l.space_id = $1 AND l.folder_id IS NULL AND l.is_archived = 0
               ORDER BY l.position, l.created_at`,
              [space.id]
            );
            return { ...space, folders: [], lists: directLists.rows };
          })
        );
        
        return res.json({
          workspace: { ...newWorkspace, spaces: spacesWithData, lab_id: labId },
          labs: myLabs,
          activeLabId: labId,
        });
      }
      
      const created = await pool.query(`SELECT * FROM lab_workspaces WHERE id = $1`, [workspaceId]);
      return res.json({
        workspace: { ...created.rows[0], lab_id: labId },
        labs: myLabs,
        activeLabId: labId,
      });
    }

    // Get spaces with folders and lists
    const spaces = await pool.query(
      `SELECT s.*, 
        (SELECT COUNT(*) FROM workspace_tasks t WHERE t.space_id = s.id AND t.status != 'done') as task_count
       FROM workspace_spaces s
       WHERE s.workspace_id = $1 AND s.is_archived = 0
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
           WHERE f.space_id = $1 AND f.is_archived = 0
           ORDER BY f.position, f.created_at`,
          [space.id]
        );

        const foldersWithLists = await Promise.all(
          folders.rows.map(async (folder) => {
            const lists = await pool.query(
              `SELECT l.*,
                (SELECT COUNT(*) FROM workspace_tasks t WHERE t.list_id = l.id AND t.status != 'done') as task_count
               FROM workspace_lists l
               WHERE l.folder_id = $1 AND l.is_archived = 0
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
           WHERE l.space_id = $1 AND l.folder_id IS NULL AND l.is_archived = 0
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
      workspace: { ...workspace, spaces: spacesWithData, lab_id: labId },
      labs: myLabs,
      activeLabId: labId,
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
      const labId = await ensureUserLab(userId);
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

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workspace_spaces (id, workspace_id, name, description, color, icon, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, workspaceId, name, description || null, color || '#6366f1', icon || null, positionResult.rows[0].next_position, userId]
    );

    const result = await pool.query(`SELECT * FROM workspace_spaces WHERE id = $1`, [id]);
    res.status(201).json({ space: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating space:', error);
    res.status(500).json({ error: 'Failed to create space', details: error.message });
  }
});

// Update space
router.put('/spaces/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, is_archived } = req.body;

    await pool.query(
      `UPDATE workspace_spaces
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           icon = COALESCE($4, icon),
           is_archived = COALESCE($5, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        name ?? null,
        description ?? null,
        color ?? null,
        icon ?? null,
        is_archived !== undefined ? toBoolInt(is_archived) : null,
        id
      ]
    );

    const result = await pool.query(`SELECT * FROM workspace_spaces WHERE id = $1`, [id]);
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
      `UPDATE workspace_spaces SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
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

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workspace_folders (id, space_id, name, description, color, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, space_id, name, description || null, color || '#8b5cf6', positionResult.rows[0].next_position, userId]
    );

    const result = await pool.query(`SELECT * FROM workspace_folders WHERE id = $1`, [id]);
    res.status(201).json({ folder: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder', details: error.message });
  }
});

// Update folder
router.put('/folders/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_archived } = req.body;

    await pool.query(
      `UPDATE workspace_folders
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           is_archived = COALESCE($4, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        name ?? null,
        description ?? null,
        color ?? null,
        is_archived !== undefined ? toBoolInt(is_archived) : null,
        id
      ]
    );

    const result = await pool.query(`SELECT * FROM workspace_folders WHERE id = $1`, [id]);
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
      `UPDATE workspace_folders SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
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

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workspace_lists (id, space_id, folder_id, name, description, color, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, space_id, folder_id || null, name, description || null, color || '#10b981', positionResult.rows[0].next_position, userId]
    );

    const result = await pool.query(`SELECT * FROM workspace_lists WHERE id = $1`, [id]);
    res.status(201).json({ list: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: 'Failed to create list', details: error.message });
  }
});

// Update list
router.put('/lists/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, is_archived } = req.body;

    await pool.query(
      `UPDATE workspace_lists
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           is_archived = COALESCE($4, is_archived),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        name ?? null,
        description ?? null,
        color ?? null,
        is_archived !== undefined ? toBoolInt(is_archived) : null,
        id
      ]
    );

    const result = await pool.query(`SELECT * FROM workspace_lists WHERE id = $1`, [id]);
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
      `UPDATE workspace_lists SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'List archived successfully' });
  } catch (error: any) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: 'Failed to delete list', details: error.message });
  }
});

// ==================== Task Management ====================

async function ensureInboxList(workspaceId: string, userId: string): Promise<{
  listId: string;
  spaceId: string;
}> {
  const existing = await pool.query(
    `SELECT l.id AS list_id, l.space_id
     FROM workspace_lists l
     JOIN workspace_spaces s ON s.id = l.space_id
     WHERE s.workspace_id = $1 AND l.name = 'Inbox' AND l.is_archived = 0
     ORDER BY l.created_at ASC
     LIMIT 1`,
    [workspaceId]
  );
  if (existing.rows.length > 0) {
    return { listId: existing.rows[0].list_id, spaceId: existing.rows[0].space_id };
  }

  let spaceId: string;
  const spaceRes = await pool.query(
    `SELECT id FROM workspace_spaces WHERE workspace_id = $1 AND is_archived = 0 ORDER BY position ASC LIMIT 1`,
    [workspaceId]
  );
  if (spaceRes.rows.length > 0) {
    spaceId = spaceRes.rows[0].id;
  } else {
    spaceId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workspace_spaces (id, workspace_id, name, created_by, position)
       VALUES ($1, $2, 'General', $3, 0)`,
      [spaceId, workspaceId, userId]
    );
  }

  const listId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO workspace_lists (id, space_id, name, created_by, position)
     VALUES ($1, $2, 'Inbox', $3, 0)`,
    [listId, spaceId, userId]
  );
  return { listId, spaceId };
}

// List tasks with filters
router.get('/tasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      workspace_id,
      space_id,
      list_id,
      status,
      priority,
      assignee_id,
      unassigned,
      mine,
      due_date_from,
      due_date_to,
      search,
      group_by,
      sort_by = 'position',
      sort_order = 'ASC'
    } = req.query;

    let query = `
      SELECT t.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee_name,
        u1.avatar_url as assignee_avatar,
        CONCAT(u2.first_name, ' ', u2.last_name) as creator_name,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id AND st.is_completed = 0) as incomplete_subtasks,
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
      const filtered = appendInFilter(query, params, paramCount, 't.status', status);
      query = filtered.query;
      paramCount = filtered.paramCount;
    }

    if (priority) {
      const filtered = appendInFilter(query, params, paramCount, 't.priority', priority);
      query = filtered.query;
      paramCount = filtered.paramCount;
    }

    if (mine === '1' || mine === 'true') {
      paramCount++;
      query += ` AND t.assignee_id = $${paramCount}`;
      params.push(req.user!.id);
    } else if (unassigned === '1' || unassigned === 'true') {
      query += ` AND (t.assignee_id IS NULL OR t.assignee_id = '')`;
    } else if (assignee_id) {
      const filtered = appendInFilter(query, params, paramCount, 't.assignee_id', assignee_id);
      query = filtered.query;
      paramCount = filtered.paramCount;
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
      const searchParam = paramCount;
      paramCount++;
      query += ` AND (t.title LIKE $${searchParam} OR t.description LIKE $${paramCount})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ` AND t.is_archived = 0`;

    const validSortFields = ['position', 'created_at', 'updated_at', 'due_date', 'priority', 'title'];
    const sortField = validSortFields.includes(sort_by as string) ? sort_by : 'due_date';
    const sortDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY t.${sortField} ${sortDir}, t.position ASC`;

    const result = await pool.query(query, params);

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

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Resolve workspace + optional list (auto-Inbox when list omitted - space-free UX)
    let finalWorkspaceId = workspace_id;
    let finalSpaceId = space_id;
    let finalListId = list_id;

    if (!finalWorkspaceId) {
      const labId = await ensureUserLab(userId);
      const workspace = await getWorkspaceForLab(labId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }
      finalWorkspaceId = workspace.id;
    }

    if (!finalListId) {
      const inbox = await ensureInboxList(finalWorkspaceId, userId);
      finalListId = inbox.listId;
      finalSpaceId = inbox.spaceId;
    } else if (!finalSpaceId || !finalWorkspaceId) {
      const listResult = await pool.query(
        `SELECT l.space_id, s.workspace_id 
         FROM workspace_lists l
         JOIN workspace_spaces s ON l.space_id = s.id
         WHERE l.id = $1`,
        [finalListId]
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
      [finalListId]
    );

    const id = crypto.randomUUID();
    const tagsValue = typeof tags === 'string' ? tags : JSON.stringify(Array.isArray(tags) ? tags : []);

    await pool.query(
      `INSERT INTO workspace_tasks (
        id, workspace_id, space_id, folder_id, list_id,
        title, description, status, priority,
        due_date, start_date, assignee_id, created_by,
        tags, project_id, protocol_id, inventory_item_id, instrument_id,
        time_estimated, position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        id,
        finalWorkspaceId,
        finalSpaceId,
        folder_id || null,
        finalListId,
        title,
        description || null,
        status,
        priority,
        due_date || null,
        start_date || null,
        assignee_id || null,
        userId,
        tagsValue,
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
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee_name,
        u1.avatar_url as assignee_avatar,
        CONCAT(u2.first_name, ' ', u2.last_name) as creator_name
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1`,
      [id]
    );

    res.status(201).json({ task: taskResult.rows[0] });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
});

// ==================== Views (must be BEFORE /tasks/:id) ====================

// Get board view data
router.get('/tasks/board', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { workspace_id, space_id, list_id } = req.query;

    let query = `
      SELECT t.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee_name,
        u1.avatar_url as assignee_avatar
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      WHERE t.is_archived = 0
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

// Get calendar view data
router.get('/tasks/calendar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { workspace_id, space_id, start_date, end_date } = req.query;

    let query = `
      SELECT t.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee_name,
        u1.avatar_url as assignee_avatar
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      WHERE t.is_archived = 0
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
      const startA = paramCount;
      paramCount++;
      query += ` AND (t.due_date >= $${startA} OR t.start_date >= $${paramCount})`;
      params.push(start_date, start_date);
    }

    if (end_date) {
      paramCount++;
      const endA = paramCount;
      paramCount++;
      query += ` AND (t.due_date <= $${endA} OR t.start_date <= $${paramCount})`;
      params.push(end_date, end_date);
    }

    query += ` ORDER BY t.due_date ASC, t.start_date ASC`;

    const result = await pool.query(query, params);

    res.json({ tasks: result.rows });
  } catch (error: any) {
    console.error('Error fetching calendar view:', error);
    res.status(500).json({ error: 'Failed to fetch calendar view', details: error.message });
  }
});

// Reorder tasks
router.put('/tasks/reorder', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { task_orders } = req.body; // Array of { task_id, position, list_id? }

    if (!Array.isArray(task_orders)) {
      return res.status(400).json({ error: 'task_orders must be an array' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const order of task_orders) {
        if (order.list_id) {
          await client.query(
            `UPDATE workspace_tasks SET position = $1, list_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [order.position, order.list_id, order.task_id]
          );
        } else {
          await client.query(
            `UPDATE workspace_tasks SET position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [order.position, order.task_id]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'Tasks reordered successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks', details: error.message });
  }
});

// Get single task
router.get('/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT t.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee_name,
        u1.avatar_url as assignee_avatar,
        CONCAT(u2.first_name, ' ', u2.last_name) as creator_name,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id AND st.is_completed = 0) as incomplete_subtasks,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id) as total_subtasks,
        (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) as comment_count
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1 AND t.is_archived = 0`,
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

// Update task
router.put('/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
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
        let value = updateData[field];
        if (field === 'tags' && typeof value !== 'string') {
          value = JSON.stringify(Array.isArray(value) ? value : []);
        }
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    values.push(id);

    const query = `UPDATE workspace_tasks SET ${updates.join(', ')} WHERE id = $${paramCount}`;
    await pool.query(query, values);

    // Get full task with relations
    const taskResult = await pool.query(
      `SELECT t.*,
        CONCAT(u1.first_name, ' ', u1.last_name) as assignee_name,
        u1.avatar_url as assignee_avatar,
        CONCAT(u2.first_name, ' ', u2.last_name) as creator_name,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id AND st.is_completed = 0) as incomplete_subtasks,
        (SELECT COUNT(*) FROM workspace_subtasks st WHERE st.task_id = t.id) as total_subtasks
      FROM workspace_tasks t
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1`,
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: taskResult.rows[0] });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

// Delete task
router.delete('/tasks/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Archive instead of delete
    await pool.query(
      `UPDATE workspace_tasks SET is_archived = 1, archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
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

    const subtaskId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workspace_subtasks (id, task_id, title, description, assignee_id, position, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [subtaskId, id, title, description || null, assignee_id || null, positionResult.rows[0].next_position, userId]
    );

    const result = await pool.query(`SELECT * FROM workspace_subtasks WHERE id = $1`, [subtaskId]);
    res.status(201).json({ subtask: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask', details: error.message });
  }
});

// Get subtasks for a task
router.get('/tasks/:id/subtasks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT s.*,
        CONCAT(u.first_name, ' ', u.last_name) as assignee_name,
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

// Add comment
router.post('/tasks/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const commentId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO task_comments (id, task_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [commentId, id, userId, content, parent_comment_id || null]
    );

    // Get comment with user info
    const commentResult = await pool.query(
      `SELECT c.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.avatar_url as user_avatar
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [commentId]
    );

    res.status(201).json({ comment: commentResult.rows[0] });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment', details: error.message });
  }
});

// Get comments for a task
router.get('/tasks/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
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
      const completedInt = toBoolInt(is_completed);
      if (completedInt === 1) {
        updates.push(`is_completed = $${paramCount}, completed_at = CURRENT_TIMESTAMP`);
      } else {
        updates.push(`is_completed = $${paramCount}, completed_at = NULL`);
      }
      values.push(completedInt);
    }
    
    if (assignee_id !== undefined) {
      paramCount++;
      updates.push(`assignee_id = $${paramCount}`);
      values.push(assignee_id || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    paramCount++;
    values.push(id);
    
    await pool.query(
      `UPDATE workspace_subtasks SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    const result = await pool.query(`SELECT * FROM workspace_subtasks WHERE id = $1`, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    res.json({ subtask: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask', details: error.message });
  }
});

export default router;
