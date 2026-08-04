import express, { type Router } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  listForUser,
  markAllRead,
  markRead,
  unreadCount,
} from '../services/notifications/notificationService.js';

const router: Router = express.Router();

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const unreadOnly =
      req.query.unread === '1' ||
      req.query.unread === 'true' ||
      req.query.filter === 'unread';
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const notifications = await listForUser(req.user.id, {
      unreadOnly,
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
    });
    const count = await unreadCount(req.user.id);

    res.json({ notifications, unreadCount: count });
  } catch (error) {
    console.error('Error listing notifications:', error);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

router.get('/unread-count', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const count = await unreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

router.patch('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const ok = await markRead(req.user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const count = await unreadCount(req.user.id);
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

router.post('/mark-all-read', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    await markAllRead(req.user.id);
    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

export default router;
