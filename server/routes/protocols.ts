import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all protocols (with optional filtering)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { search, tags, access, author } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT p.*, u.username as author_name, u.role as author_role
      FROM protocols p
      JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tags) {
      query += ` AND p.tags LIKE ?`;
      params.push(`%${tags}%`);
    }

    if (access) {
      query += ` AND p.access = ?`;
      params.push(access);
    }

    if (author) {
      query += ` AND u.username LIKE ?`;
      params.push(`%${author}%`);
    }

    query += ` ORDER BY p.last_updated DESC`;

    const protocols = await db.all(query, params);
    
    // Parse tags from JSON string
    const protocolsWithParsedTags = protocols.map(protocol => ({
      ...protocol,
      tags: protocol.tags ? JSON.parse(protocol.tags) : []
    }));

    res.json({ protocols: protocolsWithParsedTags });
  } catch (error) {
    console.error('Fetch protocols error:', error);
    res.status(500).json({ error: 'Failed to fetch protocols' });
  }
});

// Get single protocol by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const protocol = await db.get(`
      SELECT p.*, u.username as author_name, u.role as author_role
      FROM protocols p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Get protocol steps
    const steps = await db.all(`
      SELECT * FROM protocol_steps 
      WHERE protocol_id = ? 
      ORDER BY step_number
    `, [id]);

    // Get protocol attachments
    const attachments = await db.all(`
      SELECT * FROM protocol_attachments 
      WHERE protocol_id = ?
    `, [id]);

    // Parse JSON fields
    const protocolWithDetails = {
      ...protocol,
      tags: protocol.tags ? JSON.parse(protocol.tags) : [],
      steps: steps.map(step => ({
        ...step,
        materials: step.materials ? JSON.parse(step.materials) : [],
        calculator_data: step.calculator_data ? JSON.parse(step.calculator_data) : null,
        video_timestamp: step.video_timestamp ? JSON.parse(step.video_timestamp) : null,
        conditional_data: step.conditional_data ? JSON.parse(step.conditional_data) : null
      })),
      attachments
    };

    res.json({ protocol: protocolWithDetails });
  } catch (error) {
    console.error('Fetch protocol error:', error);
    res.status(500).json({ error: 'Failed to fetch protocol' });
  }
});

// Create new protocol
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      title,
      description,
      tags,
      access,
      videoUrl,
      forkedFrom,
      steps,
      attachments
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const db = getDatabase();
    const protocolId = uuidv4();
    
    // Insert protocol
    await db.run(`
      INSERT INTO protocols (
        id, title, description, tags, author_id, access, video_url, forked_from
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      protocolId,
      title,
      description,
      JSON.stringify(tags || []),
      req.user.id,
      access || 'Lab Only',
      videoUrl,
      forkedFrom
    ]);

    // Insert protocol steps
    if (steps && Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepId = uuidv4();
        
        await db.run(`
          INSERT INTO protocol_steps (
            id, protocol_id, step_number, description, details, safety_warning,
            materials, duration_minutes, calculator_data, video_timestamp, conditional_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          stepId,
          protocolId,
          i + 1,
          step.description,
          step.details,
          step.safetyWarning,
          JSON.stringify(step.materials || []),
          step.durationMinutes,
          step.calculator ? JSON.stringify(step.calculator) : null,
          step.videoTimestamp ? JSON.stringify(step.videoTimestamp) : null,
          step.conditional ? JSON.stringify(step.conditional) : null
        ]);
      }
    }

    // Insert attachments
    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        const attachmentId = uuidv4();
        
        await db.run(`
          INSERT INTO protocol_attachments (
            id, protocol_id, name, url, type
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          attachmentId,
          protocolId,
          attachment.name,
          attachment.url,
          attachment.type
        ]);
      }
    }

    res.status(201).json({
      message: 'Protocol created successfully',
      protocolId
    });
  } catch (error) {
    console.error('Create protocol error:', error);
    res.status(500).json({ error: 'Failed to create protocol' });
  }
});

// Update protocol
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const {
      title,
      description,
      tags,
      access,
      videoUrl,
      steps,
      attachments
    } = req.body;

    const db = getDatabase();
    
    // Check if protocol exists and user has permission
    const protocol = await db.get('SELECT author_id FROM protocols WHERE id = ?', [id]);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    if (protocol.author_id !== req.user.id && req.user.role !== 'Principal Investigator') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update protocol
    await db.run(`
      UPDATE protocols SET 
        title = ?, description = ?, tags = ?, access = ?, video_url = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, description, JSON.stringify(tags || []), access, videoUrl, id]);

    // Delete existing steps and attachments
    await db.run('DELETE FROM protocol_steps WHERE protocol_id = ?', [id]);
    await db.run('DELETE FROM protocol_attachments WHERE protocol_id = ?', [id]);

    // Insert updated steps
    if (steps && Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepId = uuidv4();
        
        await db.run(`
          INSERT INTO protocol_steps (
            id, protocol_id, step_number, description, details, safety_warning,
            materials, duration_minutes, calculator_data, video_timestamp, conditional_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          stepId,
          id,
          i + 1,
          step.description,
          step.details,
          step.safetyWarning,
          JSON.stringify(step.materials || []),
          step.durationMinutes,
          step.calculator ? JSON.stringify(step.calculator) : null,
          step.videoTimestamp ? JSON.stringify(step.videoTimestamp) : null,
          step.conditional ? JSON.stringify(step.conditional) : null
        ]);
      }
    }

    // Insert updated attachments
    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        const attachmentId = uuidv4();
        
        await db.run(`
          INSERT INTO protocol_attachments (
            id, protocol_id, name, url, type
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          attachmentId,
          id,
          attachment.name,
          attachment.url,
          attachment.type
        ]);
      }
    }

    res.json({ message: 'Protocol updated successfully' });
  } catch (error) {
    console.error('Update protocol error:', error);
    res.status(500).json({ error: 'Failed to update protocol' });
  }
});

// Delete protocol
router.delete('/:id', authenticateToken, requireRole(['Principal Investigator', 'Lab Manager']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if protocol exists
    const protocol = await db.get('SELECT id FROM protocols WHERE id = ?', [id]);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Delete protocol (cascade will delete steps and attachments)
    await db.run('DELETE FROM protocols WHERE id = ?', [id]);

    res.json({ message: 'Protocol deleted successfully' });
  } catch (error) {
    console.error('Delete protocol error:', error);
    res.status(500).json({ error: 'Failed to delete protocol' });
  }
});

// Fork protocol
router.post('/:id/fork', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { title, description } = req.body;
    
    const db = getDatabase();
    
    // Get original protocol
    const originalProtocol = await db.get(`
      SELECT * FROM protocols WHERE id = ?
    `, [id]);

    if (!originalProtocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const newProtocolId = uuidv4();
    
    // Create forked protocol
    await db.run(`
      INSERT INTO protocols (
        id, title, description, tags, author_id, access, video_url, forked_from
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newProtocolId,
      title || `${originalProtocol.title} (Forked)`,
      description || originalProtocol.description,
      originalProtocol.tags,
      req.user.id,
      'Private', // Forked protocols are private by default
      originalProtocol.video_url,
      id
    ]);

    // Copy protocol steps
    const steps = await db.all('SELECT * FROM protocol_steps WHERE protocol_id = ? ORDER BY step_number', [id]);
    
    for (const step of steps) {
      const stepId = uuidv4();
      
      await db.run(`
        INSERT INTO protocol_steps (
          id, protocol_id, step_number, description, details, safety_warning,
          materials, duration_minutes, calculator_data, video_timestamp, conditional_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        stepId,
        newProtocolId,
        step.step_number,
        step.description,
        step.details,
        step.safety_warning,
        step.materials,
        step.duration_minutes,
        step.calculator_data,
        step.video_timestamp,
        step.conditional_data
      ]);
    }

    res.status(201).json({
      message: 'Protocol forked successfully',
      protocolId: newProtocolId
    });
  } catch (error) {
    console.error('Fork protocol error:', error);
    res.status(500).json({ error: 'Failed to fork protocol' });
  }
});

export default router;
