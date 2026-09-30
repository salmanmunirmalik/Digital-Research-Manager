/**
 * Networking social actions: follow, connect, lab join/follow, pending requests.
 * Relationships are persisted so both sides see consistent state.
 *
 * Researcher:
 *   Follow  = one-way interest (no approval)
 *   Connect = mutual; pending until accepted (or auto-accept if reverse pending)
 *
 * Lab:
 *   Follow  = one-way interest in a showcased lab
 *   Join    = request membership; pending until a lab admin accepts
 *   Leave   = self-remove (not allowed for principal researcher)
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

const ADMIN_ROLES = new Set(['principal_researcher', 'admin']);

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

async function loadLabRelationshipMaps(userId: string) {
  const [follows, memberships, joinRequests] = await Promise.all([
    pool.query(`SELECT lab_id FROM lab_follows WHERE user_id = $1`, [userId]),
    pool.query(
      `SELECT lab_id, role FROM lab_members
       WHERE user_id = $1 AND COALESCE(is_active, 1) = 1`,
      [userId]
    ),
    pool.query(
      `SELECT id, lab_id, status FROM lab_join_requests
       WHERE requester_id = $1 AND status = 'pending'`,
      [userId]
    ),
  ]);

  const followingLabIds = new Set(follows.rows.map((r: any) => r.lab_id));
  const membershipByLab = new Map<string, { role: string }>();
  for (const row of memberships.rows as any[]) {
    membershipByLab.set(row.lab_id, { role: row.role || 'researcher' });
  }
  const pendingJoinByLab = new Map<string, string>();
  for (const row of joinRequests.rows as any[]) {
    pendingJoinByLab.set(row.lab_id, row.id);
  }

  return { followingLabIds, membershipByLab, pendingJoinByLab };
}

async function getShowcasedLab(labId: string) {
  const result = await pool.query(
    `SELECT id, name, principal_researcher_id, COALESCE(is_showcased, 0) AS is_showcased
     FROM labs WHERE id = $1 LIMIT 1`,
    [labId]
  );
  return result.rows[0] || null;
}

async function getLabAdminIds(labId: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT user_id FROM lab_members
     WHERE lab_id = $1 AND COALESCE(is_active, 1) = 1
       AND role IN ('principal_researcher', 'admin')`,
    [labId]
  );
  return result.rows.map((r: any) => r.user_id).filter(Boolean);
}

async function notifyLabAdmins(
  labId: string,
  payload: {
    actorId: string;
    title: string;
    body: string;
    link: string;
    entityType: string;
    entityId: string;
  }
) {
  const admins = await getLabAdminIds(labId);
  await Promise.all(
    admins
      .filter((id) => id !== payload.actorId)
      .map((userId) =>
        createNotification({
          userId,
          type: 'research_update',
          title: payload.title,
          body: payload.body,
          link: payload.link,
          entityType: payload.entityType,
          entityId: payload.entityId,
        })
      )
  );
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
      if (row.status === 'accepted') {
        return res.json({
          success: true,
          connectionStatus: 'connected',
          isConnected: true,
          connectionId: row.id,
        });
      }
      if (row.status === 'pending') {
        return res.json({
          success: true,
          connectionStatus: 'pending',
          isConnected: false,
          connectionId: row.id,
        });
      }
      // declined / withdrawn → re-open as a fresh pending request
      await pool.query(
        `UPDATE user_connections SET status = 'pending', message = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [req.body?.message || null, row.id]
      );
      const actor = nameFromAuthUser(req.user);
      await createNotification({
        userId: recipientId,
        type: 'research_update',
        title: `${actor} wants to connect`,
        body: 'Respond to the connection request on Networking.',
        link: `/collaboration-networking`,
        entityType: 'connection',
        entityId: row.id,
      });
      return res.json({
        success: true,
        connectionStatus: 'pending',
        isConnected: false,
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

/** ---------- Lab follow / join / leave ---------- */

router.post('/labs/:labId/follow', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { labId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const lab = await getShowcasedLab(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    if (!Number(lab.is_showcased)) {
      return res.status(400).json({ error: 'Only showcased labs can be followed from Networking' });
    }

    const existing = await pool.query(
      `SELECT id FROM lab_follows WHERE user_id = $1 AND lab_id = $2`,
      [userId, labId]
    );
    if (existing.rows.length === 0) {
      await pool.query(`INSERT INTO lab_follows (id, user_id, lab_id) VALUES ($1, $2, $3)`, [
        crypto.randomUUID(),
        userId,
        labId,
      ]);
    }

    res.json({ success: true, isFollowing: true });
  } catch (error: any) {
    console.error('Error following lab:', error);
    res.status(500).json({ error: error.message || 'Failed to follow lab' });
  }
});

router.delete('/labs/:labId/follow', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { labId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    await pool.query(`DELETE FROM lab_follows WHERE user_id = $1 AND lab_id = $2`, [userId, labId]);
    res.json({ success: true, isFollowing: false });
  } catch (error: any) {
    console.error('Error unfollowing lab:', error);
    res.status(500).json({ error: error.message || 'Failed to unfollow lab' });
  }
});

router.post('/labs/:labId/join-requests', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { labId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const lab = await getShowcasedLab(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    if (!Number(lab.is_showcased)) {
      return res.status(400).json({ error: 'Only showcased labs accept join requests from Networking' });
    }

    const membership = await pool.query(
      `SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2 AND COALESCE(is_active, 1) = 1`,
      [labId, userId]
    );
    if (membership.rows.length > 0) {
      return res.json({
        success: true,
        membershipStatus: 'member',
        isMember: true,
        membershipRole: membership.rows[0].role,
        joinRequestId: null,
      });
    }

    const existing = await pool.query(
      `SELECT id, status FROM lab_join_requests WHERE lab_id = $1 AND requester_id = $2 LIMIT 1`,
      [labId, userId]
    );

    let requestId: string;
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === 'pending') {
        return res.json({
          success: true,
          membershipStatus: 'pending',
          isMember: false,
          joinRequestId: row.id,
        });
      }
      await pool.query(
        `UPDATE lab_join_requests
         SET status = 'pending', message = $1, reviewed_by = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [req.body?.message || null, row.id]
      );
      requestId = row.id;
    } else {
      requestId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO lab_join_requests (id, lab_id, requester_id, status, message)
         VALUES ($1, $2, $3, 'pending', $4)`,
        [requestId, labId, userId, req.body?.message || null]
      );
    }

    const actor = nameFromAuthUser(req.user);
    await notifyLabAdmins(labId, {
      actorId: userId,
      title: `${actor} requested to join ${lab.name}`,
      body: 'Review the join request on Networking.',
      link: `/collaboration-networking`,
      entityType: 'lab_join_request',
      entityId: requestId,
    });

    res.status(201).json({
      success: true,
      membershipStatus: 'pending',
      isMember: false,
      joinRequestId: requestId,
    });
  } catch (error: any) {
    console.error('Error creating lab join request:', error);
    res.status(500).json({ error: error.message || 'Failed to request lab membership' });
  }
});

router.delete('/labs/:labId/join-requests', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { labId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    await pool.query(
      `DELETE FROM lab_join_requests
       WHERE lab_id = $1 AND requester_id = $2 AND status = 'pending'`,
      [labId, userId]
    );

    res.json({ success: true, membershipStatus: 'none', isMember: false, joinRequestId: null });
  } catch (error: any) {
    console.error('Error cancelling lab join request:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel join request' });
  }
});

router.get('/labs/join-requests', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const result = await pool.query(
      `SELECT r.id, r.lab_id, r.requester_id, r.status, r.message, r.created_at,
              l.name AS lab_name,
              u.first_name, u.last_name, u.username, u.avatar_url,
              u.current_position, u.current_institution
       FROM lab_join_requests r
       JOIN labs l ON l.id = r.lab_id
       JOIN users u ON u.id = r.requester_id
       JOIN lab_members lm ON lm.lab_id = r.lab_id AND lm.user_id = $1
         AND COALESCE(lm.is_active, 1) = 1
         AND lm.role IN ('principal_researcher', 'admin')
       WHERE r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      requests: result.rows.map((row: any) => ({
        id: row.id,
        labId: row.lab_id,
        labName: row.lab_name,
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
    console.error('Error loading lab join requests:', error);
    res.status(500).json({ error: error.message || 'Failed to load join requests' });
  }
});

router.post('/labs/join-requests/:requestId/respond', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted or declined' });
    }

    const existing = await pool.query(
      `SELECT r.*, l.name AS lab_name
       FROM lab_join_requests r
       JOIN labs l ON l.id = r.lab_id
       WHERE r.id = $1 AND r.status = 'pending'
       LIMIT 1`,
      [req.params.requestId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    const request = existing.rows[0];
    const adminCheck = await pool.query(
      `SELECT role FROM lab_members
       WHERE lab_id = $1 AND user_id = $2 AND COALESCE(is_active, 1) = 1
         AND role IN ('principal_researcher', 'admin')
       LIMIT 1`,
      [request.lab_id, userId]
    );
    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only lab admins can review join requests' });
    }

    if (status === 'accepted') {
      const alreadyMember = await pool.query(
        `SELECT id, is_active FROM lab_members WHERE lab_id = $1 AND user_id = $2 LIMIT 1`,
        [request.lab_id, request.requester_id]
      );
      if (alreadyMember.rows.length === 0) {
        await pool.query(
          `INSERT INTO lab_members (id, lab_id, user_id, role, permissions, is_active)
           VALUES ($1, $2, $3, 'researcher', $4, 1)`,
          [crypto.randomUUID(), request.lab_id, request.requester_id, JSON.stringify({})]
        );
      } else if (!Number(alreadyMember.rows[0].is_active)) {
        await pool.query(
          `UPDATE lab_members SET is_active = 1, role = 'researcher'
           WHERE lab_id = $1 AND user_id = $2`,
          [request.lab_id, request.requester_id]
        );
      }
    }

    await pool.query(
      `UPDATE lab_join_requests
       SET status = $1, reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, userId, request.id]
    );

    const actor = nameFromAuthUser(req.user);
    await createNotification({
      userId: request.requester_id,
      type: 'research_update',
      title:
        status === 'accepted'
          ? `${actor} accepted your request to join ${request.lab_name}`
          : `${actor} declined your request to join ${request.lab_name}`,
      body:
        status === 'accepted'
          ? 'You are now a member of this lab.'
          : 'Your join request was declined.',
      link: status === 'accepted' ? `/labs/${request.lab_id}` : `/collaboration-networking`,
      entityType: 'lab',
      entityId: request.lab_id,
    });

    res.json({
      success: true,
      membershipStatus: status === 'accepted' ? 'member' : 'none',
      isMember: status === 'accepted',
    });
  } catch (error: any) {
    console.error('Error responding to lab join request:', error);
    res.status(500).json({ error: error.message || 'Failed to respond to join request' });
  }
});

router.post('/labs/:labId/leave', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { labId } = req.params;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const lab = await getShowcasedLab(labId);
    if (!lab) return res.status(404).json({ error: 'Lab not found' });

    if (lab.principal_researcher_id === userId) {
      return res.status(400).json({
        error: 'Principal investigator cannot leave the lab. Transfer ownership first.',
      });
    }

    const membership = await pool.query(
      `SELECT id, role FROM lab_members
       WHERE lab_id = $1 AND user_id = $2 AND COALESCE(is_active, 1) = 1
       LIMIT 1`,
      [labId, userId]
    );
    if (membership.rows.length === 0) {
      return res.json({ success: true, membershipStatus: 'none', isMember: false });
    }

    if (ADMIN_ROLES.has(membership.rows[0].role) && membership.rows[0].role === 'principal_researcher') {
      return res.status(400).json({
        error: 'Principal investigator cannot leave the lab. Transfer ownership first.',
      });
    }

    await pool.query(`DELETE FROM lab_members WHERE lab_id = $1 AND user_id = $2`, [labId, userId]);
    await pool.query(
      `DELETE FROM lab_join_requests WHERE lab_id = $1 AND requester_id = $2 AND status = 'pending'`,
      [labId, userId]
    );

    res.json({ success: true, membershipStatus: 'none', isMember: false });
  } catch (error: any) {
    console.error('Error leaving lab:', error);
    res.status(500).json({ error: error.message || 'Failed to leave lab' });
  }
});

export { loadRelationshipMaps, loadLabRelationshipMaps };
export default router;
