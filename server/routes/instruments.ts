import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/setup.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all instruments
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getDatabase();
    const instruments = await db.all('SELECT * FROM instruments ORDER BY name');
    res.json({ instruments });
  } catch (error) {
    console.error('Fetch instruments error:', error);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

// Get instrument with bookings
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const instrument = await db.get('SELECT * FROM instruments WHERE id = ?', [id]);
    if (!instrument) {
      return res.status(404).json({ error: 'Instrument not found' });
    }

    const bookings = await db.all(`
      SELECT b.*, u.username as user_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.instrument_id = ?
      ORDER BY b.start_time
    `, [id]);

    res.json({ instrument, bookings });
  } catch (error) {
    console.error('Fetch instrument error:', error);
    res.status(500).json({ error: 'Failed to fetch instrument' });
  }
});

// Create booking
router.post('/:id/book', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { title, startTime, endTime } = req.body;
    
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time and end time are required' });
    }

    const db = getDatabase();
    const bookingId = uuidv4();
    
    await db.run(`
      INSERT INTO bookings (id, instrument_id, user_id, title, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [bookingId, id, req.user.id, title, startTime, endTime]);

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
