/**
 * Networking social actions: follow, connect, public profile, pending requests.
 * Relationships are persisted so both sides see consistent state.
 */
import { Router } from 'express';
import crypto from 'crypto';
import pool from '../../database/config.js';
import { createNotification } from '../services/notifications/notificationService.js';
import { nameFromAuthUser, userDisplayName } from '../utils/postedBy.js';

const router: Router = Router();

const displayName = (row: any) =>
  userDisplayName({
    first_name: row.first_name,
    last_name: row.last_name,
    username: row.username,
  });

async function loadRelationshipMaps(userId: string) {
  const [followsOut, followsIn, connections] = await Promise.all([
    pool.query(`SELECT following_id FROM user_follows WHERE follower_id = $1`, [userId]),
    pool.query(`SELECT follower_id FROM user_follows WHERE following_id = $1`, [userId]),
    pool.query(
      `SELECT id, requester_id, recipient_id, status
       FROM user_connections
       WHERE (requester_id = $1 OR recipient_id = $2)
         AND status IN ('pending', 'accepted')`,
      [userId, userId]
    ),
  ]);

  const followingIds = new Set(followsOut.rows.map((r: any) => r.following_id));
  const followerIds = new Set(followsIn.rows.map((r: any) => r.follower_id));

  const connectionByUser = new Map<
    string,
    { status: 'none' | 'pending' | 'connected'; isConnected: boolean; direction: 'out' | 'in' | null; connectionId?: string }
  >();

  for (const row of connections.rows as any[]) {
    const otherId = row.requester_id === userId ? row.recipient_id : row.requester_id;
    const direction = row.requester_id === userId ? 'out' : 'in';
    if (row.status === 'accepted') {
      connectionByUser.set(otherId, {
        status: 'connected',
        isConnected: true,
        direction,
        connectionId: row.id,
      });
    } else if (row.status === 'pending') {
      connectionByUser.set(otherId, {
        status: 'pending',
        isConnected: false,
        direction,
        connectionId: row.id,
      });
    }
  }

  return { followingIds, followerIds, connectionByUser };
}

router.get('/relationships', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const maps = await loadRelationshipMaps(userId);
    const following = [...maps.followingIds];
    const followers = [...maps.followerIds];
    const connections: Record<string, any> = {};
    for (const [otherId, rel] of maps.connectionByUser.entries()) {
      connections[otherId] = rel;
    }

    res.json({
      following,
      followers,
      connections,
      followingCount: following.length,
      followersCount: followers.length,
      connectionsCount: Object.values(connections).filter((c: any) => c.isConnected).length,
    });
  } catch (error: any) {
    console.error('Error loading relationships:', error);
    res.status(500).json({ error: error.message || 'Failed to load relationships' });
  }
});

router.get('/requests', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const result = await pool.query(
      `SELECT c.id, c.requester_id, c.recipient_id, c.status, c.message, c.created_at,
              u.first_name, u.last_name, u.username, u.avatar_url,
              u.current_position, u.current_institution
       FROM user_connections c
       JOIN users u ON u.id = c.requester_id
       WHERE c.recipient_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({
      requests: result.rows.map((row: any) => ({
        id: row.id,
        requesterId: row.requester_id,
        status: row.status,
        message: row.message,
        createdAt: row.created_at,
        name: displayName(row),
        avatarUrl: row.avatar_url,
        position: row.current_position || '',
        institution: row.current_institution || '',
      })),
    });
  } catch (error: any) {
    console.error('Error loading connection requests:', error);
    res.status(500).json({ error: error.message || 'Failed to load requests' });
  }
});

router.get('/profile/:userId', async (req: any, res) => {
  try {
    const viewerId = req.user?.id;
    const { userId } = req.params;

    const userResult = await pool.query(
      `SELECT id, first_name, last_name, username, email, role, avatar_url, bio,
              department, specialization, current_position, current_institution,
              location, expertise, profile_visibility, show_email
       FROM users WHERE id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const row = userResult.rows[0];
    const isOwn = viewerId === userId;

    if (
      !isOwn &&
      row.profile_visibility &&
      !['public', 'network', 'lab'].includes(row.profile_visibility)
    ) {
      return res.status(403).json({ error: 'This profile is private' });
    }

    const [followers, following, connections] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS cnt FROM user_follows WHERE following_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*) AS cnt FROM user_follows WHERE follower_id = $1`, [userId]),
      pool.query(
        `SELECT COUNT(*) AS cnt FROM user_connections
         WHERE status = 'accepted' AND (requester_id = $1 OR recipient_id = $2)`,
        [userId, userId]
      ),
    ]);

    let relationship = {
      isFollowing: false,
      isFollowedBy: false,
      isConnected: false,
      connectionStatus: 'none' as 'none' | 'pending' | 'connected',
      connectionDirection: null as 'out' | 'in' | null,
      connectionId: null as string | null,
    };

    if (viewerId && !isOwn) {
      const maps = await loadRelationshipMaps(viewerId);
      relationship.isFollowing = maps.followingIds.has(userId);
      relationship.isFollowedBy = maps.followerIds.has(userId);
      const rel = maps.connectionByUser.get(userId);
      if (rel) {
        relationship.isConnected = rel.isConnected;
        relationship.connectionStatus = rel.status;
        relationship.connectionDirection = rel.direction;
        relationship.connectionId = rel.connectionId || null;
      }
    }

    res.json({
      profile: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        email: isOwn || row.show_email ? row.email : undefined,
        role: row.role,
        avatarUrl: row.avatar_url,
        bio: row.bio || '',
        department: row.department || '',
        specialization: row.specialization || '',
        position: row.current_position || '',
        institution: row.current_institution || '',
        location: row.location || '',
        expertise: row.expertise || '',
        followersCount: Number(followers.rows[0]?.cnt || 0),
        followingCount: Number(following.rows[0]?.cnt || 0),
        connectionsCount: Number(connections.rows[0]?.cnt || 0),
      },
      isOwn,
      relationship,
    });
  } catch (error: any) {
    console.error('Error loading public profile:', error);
    res.status(500).json({ error: error.message || 'Failed to load profile' });
  }
});

router.post('/follow/:userId', async (req: any, res) => {
  try {
    const followerId = req.user?.id;
    const followingId = req.params.userId;
    if (!followerId) return res.status(401).json({ error: 'Authentication required' });
    if (!followingId || followingId === followerId) {
      return res.status(400).json({ error: 'Invalid user to follow' });
    }

    const target = await pool.query(`SELECT id FROM users WHERE id = $1 AND status = 'active'`, [
      followingId,
    ]);
    if (target.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const existing = await pool.query(
      `SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_follows (id, follower_id, following_id) VALUES ($1, $2, $3)`,
        [crypto.randomUUID(), followerId, followingId]
      );

      const actor = nameFromAuthUser(req.user);
      await createNotification({
        userId: followingId,
        type: 'research_update',
        title: `${actor} followed you`,
        body: 'You have a new follower on Networking.',
        link: `/profile/${followerId}`,
        entityType: 'user',
        entityId: followerId,
      });
    }

    res.json({ success: true, isFollowing: true });
  } catch (error: any) {
    console.error('Error following user:', error);
    res.status(500).json({ error: error.message || 'Failed to follow user' });
  }
});

router.delete('/follow/:userId', async (req: any, res) => {
  try {
    const followerId = req.user?.id;
    const followingId = req.params.userId;
    if (!followerId) return res.status(401).json({ error: 'Authentication required' });

    await pool.query(`DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`, [
      followerId,
      followingId,
    ]);
    res.json({ success: true, isFollowing: false });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: error.message || 'Failed to unfollow user' });
  }
});

router.post('/connect/:userId', async (req: any, res) => {
  try {
    const requesterId = req.user?.id;
    const recipientId = req.params.userId;
    if (!requesterId) return res.status(401).json({ error: 'Authentication required' });
    if (!recipientId || recipientId === requesterId) {
      return res.status(400).json({ error: 'Invalid user to connect with' });
    }

    const target = await pool.query(`SELECT id FROM users WHERE id = $1 AND status = 'active'`, [
      recipientId,
    ]);
    if (target.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // Reverse pending request → auto-accept (both wanted to connect)
    const reverse = await pool.query(
      `SELECT id, status FROM user_connections
       WHERE requester_id = $1 AND recipient_id = $2 LIMIT 1`,
      [recipientId, requesterId]
    );
    if (reverse.rows.length > 0) {
      const row = reverse.rows[0];
      if (row.status === 'accepted') {
        return res.json({
          success: true,
          connectionStatus: 'connected',
          isConnected: true,
          connectionId: row.id,
        });
      }
      await pool.query(
        `UPDATE user_connections SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [row.id]
      );
      const actor = nameFromAuthUser(req.user);
      await createNotification({
        userId: recipientId,
        type: 'research_update',
        title: `${actor} accepted your connection`,
        body: 'You are now connected on Networking.',
        link: `/profile/${requesterId}`,
        entityType: 'user',
        entityId: requesterId,
      });
      return res.json({
        success: true,
        connectionStatus: 'connected',
        isConnected: true,
        connectionId: row.id,
      });
    }

    const existing = await pool.query(
      `SELECT id, status FROM user_connections
       WHERE requester_id = $1 AND recipient_id = $2 LIMIT 1`,
      [requesterId, recipientId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === 'declined') {
        await pool.query(
          `UPDATE user_connections SET status = 'pending', message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [req.body?.message || null, row.id]
        );
      }
      return res.json({
        success: true,
        connectionStatus: row.status === 'accepted' ? 'connected' : 'pending',
        isConnected: row.status === 'accepted',
        connectionId: row.id,
      });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_connections (id, requester_id, recipient_id, status, message)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [id, requesterId, recipientId, req.body?.message || null]
    );

    const actor = nameFromAuthUser(req.user);
    await createNotification({
      userId: recipientId,
      type: 'research_update',
      title: `${actor} wants to connect`,
      body: 'Respond to the connection request on Networking.',
      link: `/collaboration-networking`,
      entityType: 'connection',
      entityId: id,
    });

    res.status(201).json({
      success: true,
      connectionStatus: 'pending',
      isConnected: false,
      connectionId: id,
    });
  } catch (error: any) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: error.message || 'Failed to send connection request' });
  }
});

router.post('/connect/:connectionId/respond', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted or declined' });
    }

    const existing = await pool.query(
      `SELECT * FROM user_connections WHERE id = $1 AND recipient_id = $2 AND status = 'pending'`,
      [req.params.connectionId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    await pool.query(
      `UPDATE user_connections SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, req.params.connectionId]
    );

    const requesterId = existing.rows[0].requester_id;
    const actor = nameFromAuthUser(req.user);
    await createNotification({
      userId: requesterId,
      type: 'research_update',
      title:
        status === 'accepted'
          ? `${actor} accepted your connection`
          : `${actor} declined your connection`,
      body:
        status === 'accepted'
          ? 'You are now connected on Networking.'
          : 'Your connection request was declined.',
      link: status === 'accepted' ? `/profile/${userId}` : `/collaboration-networking`,
      entityType: 'connection',
      entityId: req.params.connectionId,
    });

    res.json({
      success: true,
      connectionStatus: status === 'accepted' ? 'connected' : 'none',
      isConnected: status === 'accepted',
    });
  } catch (error: any) {
    console.error('Error responding to connection:', error);
    res.status(500).json({ error: error.message || 'Failed to respond' });
  }
});

router.delete('/connect/:userId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const otherId = req.params.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    await pool.query(
      `DELETE FROM user_connections
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)`,
      [userId, otherId]
    );

    res.json({ success: true, connectionStatus: 'none', isConnected: false });
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect' });
  }
});

export { loadRelationshipMaps };
export default router;
