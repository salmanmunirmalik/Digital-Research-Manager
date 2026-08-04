import crypto from 'crypto';
import pool from '../../../database/config.js';
import { createNotification } from '../notifications/notificationService.js';

interface GrantRow {
  id: string;
  title: string;
  sponsor?: string | null;
  deadline_date?: string | null;
}

const buildGrantMessage = (grant: GrantRow) => {
  const deadline = grant.deadline_date ? `Deadline: ${grant.deadline_date}` : 'Rolling deadline';
  return `New grant match: ${grant.title}${grant.sponsor ? ` (${grant.sponsor})` : ''}. ${deadline}.`;
};

const insertGrantNotification = async (userId: string, grantId: string, channel: string) => {
  try {
    await pool.query(
      `INSERT INTO grant_notifications (id, user_id, grant_id, channel, status, sent_at)
       VALUES ($1, $2, $3, $4, 'sent', CURRENT_TIMESTAMP)`,
      [crypto.randomUUID(), userId, grantId, channel]
    );
  } catch (error) {
    console.warn('grant_notifications insert skipped:', (error as Error).message);
  }
};

const insertInAppNotification = async (userId: string, grant: GrantRow) => {
  await insertGrantNotification(userId, grant.id, 'in_app');
  await createNotification({
    userId,
    type: 'grant_match',
    title: 'New grant match',
    body: buildGrantMessage(grant),
    link: `/grants-fundings?grantId=${encodeURIComponent(grant.id)}`,
    entityType: 'grant',
    entityId: grant.id,
  });
};

const sendEmailNotification = async (userId: string, grant: GrantRow) => {
  // Stub: replace with actual email service
  console.log(`Email notification to ${userId} for grant ${grant.id}`);
  await insertGrantNotification(userId, grant.id, 'email');
};

export const notifyMatchesForUser = async (userId: string) => {
  const prefResult = await pool.query(
    `SELECT notify_in_app, notify_email FROM user_grant_preferences WHERE user_id = $1`,
    [userId]
  );
  const prefs = prefResult.rows[0] || { notify_in_app: true, notify_email: true };

  const matchesResult = await pool.query(
    `SELECT gm.grant_id AS id, g.title, g.sponsor, g.deadline_date
     FROM grant_matches gm
     JOIN grants g ON g.id = gm.grant_id
     WHERE gm.user_id = $1 AND gm.is_eligible = true AND gm.notified_at IS NULL`,
    [userId]
  );

  for (const match of matchesResult.rows as GrantRow[]) {
    if (prefs.notify_in_app) {
      await insertInAppNotification(userId, match);
    }
    if (prefs.notify_email) {
      await sendEmailNotification(userId, match);
    }

    await pool.query(
      `UPDATE grant_matches SET notified_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND grant_id = $2`,
      [userId, match.id]
    );
  }

  return matchesResult.rows.length;
};
