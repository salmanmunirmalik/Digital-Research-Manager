import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get user's scratchpad items
router.get('/scratchpad', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = getDatabase();
    const items = await db.all(`
      SELECT * FROM scratchpad_items 
      WHERE user_id = ? 
      ORDER BY timestamp DESC
    `, [req.user.id]);

    // Parse JSON fields
    const itemsWithParsedData = items.map(item => ({
      ...item,
      inputs: JSON.parse(item.inputs),
      result: JSON.parse(item.result)
    }));

    res.json({ items: itemsWithParsedData });
  } catch (error) {
    console.error('Fetch scratchpad error:', error);
    res.status(500).json({ error: 'Failed to fetch scratchpad items' });
  }
});

// Save scratchpad item
router.post('/scratchpad', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { calculatorName, inputs, result } = req.body;
    
    if (!calculatorName || !inputs || !result) {
      return res.status(400).json({ error: 'Calculator name, inputs and result are required' });
    }

    const db = getDatabase();
    const itemId = uuidv4();
    
    await db.run(`
      INSERT INTO scratchpad_items (id, user_id, calculator_name, inputs, result)
      VALUES (?, ?, ?, ?, ?)
    `, [itemId, req.user.id, calculatorName, JSON.stringify(inputs), JSON.stringify(result)]);

    res.status(201).json({
      message: 'Scratchpad item saved successfully',
      itemId
    });
  } catch (error) {
    console.error('Save scratchpad error:', error);
    res.status(500).json({ error: 'Failed to save scratchpad item' });
  }
});

// Delete scratchpad item
router.delete('/scratchpad/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const db = getDatabase();
    
    // Verify ownership
    const item = await db.get('SELECT user_id FROM scratchpad_items WHERE id = ?', [id]);
    
    if (!item) {
      return res.status(404).json({ error: 'Scratchpad item not found' });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await db.run('DELETE FROM scratchpad_items WHERE id = ?', [id]);

    res.json({ message: 'Scratchpad item deleted successfully' });
  } catch (error) {
    console.error('Delete scratchpad error:', error);
    res.status(500).json({ error: 'Failed to delete scratchpad item' });
  }
});

export default router;
