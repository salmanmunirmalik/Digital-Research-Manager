import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all inventory items
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { search, type, location } = req.query;
    const db = getDatabase();
    
    let query = 'SELECT * FROM inventory_items WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR supplier LIKE ? OR catalog_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (location) {
      query += ` AND location LIKE ?`;
      params.push(`%${location}%`);
    }

    query += ' ORDER BY last_updated DESC';

    const items = await db.all(query, params);
    res.json({ items });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Create new inventory item
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      type,
      supplier,
      catalogNumber,
      location,
      quantityValue,
      quantityUnit,
      lotNumber,
      expirationDate,
      lowStockThreshold,
      sdsUrl
    } = req.body;

    if (!name || !type || !quantityValue || !quantityUnit) {
      return res.status(400).json({ error: 'Name, type, quantity value and unit are required' });
    }

    const db = getDatabase();
    const itemId = uuidv4();
    
    await db.run(`
      INSERT INTO inventory_items (
        id, name, type, supplier, catalog_number, location, quantity_value, quantity_unit,
        lot_number, expiration_date, low_stock_threshold, sds_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      itemId, name, type, supplier, catalogNumber, location, quantityValue, quantityUnit,
      lotNumber, expirationDate, lowStockThreshold, sdsUrl
    ]);

    res.status(201).json({
      message: 'Inventory item created successfully',
      itemId
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const db = getDatabase();
    
    const fields = Object.keys(updateData)
      .filter(key => key !== 'id')
      .map(key => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = ?`);
    
    const values = Object.keys(updateData)
      .filter(key => key !== 'id')
      .map(key => updateData[key]);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `UPDATE inventory_items SET ${fields.join(', ')}, last_updated = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);

    await db.run(query, values);

    res.json({ message: 'Inventory item updated successfully' });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    await db.run('DELETE FROM inventory_items WHERE id = ?', [id]);

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router;
