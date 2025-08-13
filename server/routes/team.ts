import express from 'express';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all team members
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const members = await db.all(`
      SELECT id, username, email, role, avatar_url, status, expertise, created_at
      FROM users
      ORDER BY role, username
    `);

    // Parse expertise from JSON string
    const membersWithParsedExpertise = members.map(member => ({
      ...member,
      expertise: member.expertise ? JSON.parse(member.expertise) : []
    }));

    res.json({ members: membersWithParsedExpertise });
  } catch (error) {
    console.error('Fetch team error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get team member profile
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const member = await db.get(`
      SELECT id, username, email, role, avatar_url, status, expertise, created_at
      FROM users WHERE id = ?
    `, [id]);

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Get current projects for this member
    const projects = await db.all(`
      SELECT p.* FROM projects p
      WHERE p.owner_id = ?
      ORDER BY p.updated_at DESC
    `, [id]);

    const memberWithProjects = {
      ...member,
      expertise: member.expertise ? JSON.parse(member.expertise) : [],
      currentProjects: projects
    };

    res.json({ member: memberWithProjects });
  } catch (error) {
    console.error('Fetch team member error:', error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

// Update team member status
router.put('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Users can only update their own status
    if (id !== req.user.id) {
      return res.status(403).json({ error: 'Can only update own status' });
    }

    const db = getDatabase();
    
    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
