import crypto from 'crypto';
import pool from '../../../database/config.js';

export type NotificationType =
  | 'grant_match'
  | 'lab_update'
  | 'team_message'
  | 'experiment'
  | 'research_update'
  | 'conference'
  | 'system';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: number | boolean;
  created_at: string | Date;
}

const PREF_TYPE_MAP: Record<string, string> = {
  grant_match: 'notifications_research_updates',
  research_update: 'notifications_research_updates',
  lab_update: 'notifications_lab_updates',
  team_message: 'notifications_lab_updates',
  experiment: 'notifications_lab_updates',
  conference: 'notifications_conference_updates',
};

async function userAllowsType(userId: string, type: string): Promise<boolean> {
  const prefKey = PREF_TYPE_MAP[type];
  if (!prefKey) return true;

  try {
    const prefs = await pool.query(
      `SELECT notifications_email, notifications_push, notifications_research_updates,
              notifications_lab_updates, notifications_conference_updates
       FROM user_preferences WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (prefs.rows.length === 0) return true;
    const row = prefs.rows[0] as Record<string, unknown>;
    const value = row[prefKey];
    return value !== false && value !== 0 && value !== '0';
  } catch {
    return true;
  }
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<NotificationRow | null> {
  const allowed = await userAllowsType(input.userId, input.type);
  if (!allowed) return null;

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO notifications (
      id, user_id, type, title, body, link, entity_type, entity_id, is_read
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)`,
    [
      id,
      input.userId,
      input.type,
      input.title,
      input.body ?? null,
      input.link ?? null,
      input.entityType ?? null,
      input.entityId ?? null,
    ]
  );

  const created = await pool.query(`SELECT * FROM notifications WHERE id = $1`, [id]);
  return (created.rows[0] as NotificationRow) || null;
}

export async function listForUser(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
): Promise<NotificationRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const params: unknown[] = [userId];
  let query = `SELECT * FROM notifications WHERE user_id = $1`;

  if (options.unreadOnly) {
    query += ` AND is_read = 0`;
  }

  params.push(limit, offset);
  query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;

  const result = await pool.query(query, params);
  return result.rows as NotificationRow[];
}

export async function unreadCount(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = $1 AND is_read = 0`,
    [userId]
  );
  return Number(result.rows[0]?.cnt || 0);
}

export async function markRead(userId: string, notificationId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE notifications SET is_read = 1
     WHERE id = $1 AND user_id = $2 AND is_read = 0`,
    [notificationId, userId]
  );
  // mysql2 ResultSetHeader is not in rows; re-check
  const check = await pool.query(
    `SELECT id FROM notifications WHERE id = $1 AND user_id = $2 AND is_read = 1`,
    [notificationId, userId]
  );
  return check.rows.length > 0 || (result as { rows: unknown[] }).rows !== undefined;
}

export async function markAllRead(userId: string): Promise<number> {
  await pool.query(
    `UPDATE notifications SET is_read = 1 WHERE user_id = $1 AND is_read = 0`,
    [userId]
  );
  return unreadCount(userId);
}
