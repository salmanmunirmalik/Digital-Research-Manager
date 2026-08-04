import crypto from 'crypto';
import pool from '../../database/config.js';

type GdprRequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
type RetentionAction = 'delete' | 'anonymize' | 'archive';

interface RetentionPolicyRow {
  id: string;
  name: string;
  data_type: string;
  retention_period: number;
  action: RetentionAction;
  legal_basis?: string | null;
  description?: string | null;
  is_active: boolean | number;
  last_executed_at?: string | null;
}

const retentionTableAllowlist = new Set<string>([
  'audit_logs',
  'gdpr_requests',
  'consents',
  'legal_policies',
  'retention_policies',
  'lab_notebook_entries',
  'protocols',
  'projects',
  'results',
  'calendar_events',
  'workspace_tasks',
  'api_task_assignments'
]);

const safeQuery = async (text: string, params: any[] = []) => {
  try {
    return await pool.query(text, params);
  } catch (error: any) {
    // Tolerate missing optional tables/columns during export
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_FIELD_ERROR') {
      return { rows: [] as any[] };
    }
    throw error;
  }
};

class ComplianceService {
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async getActivePolicy(type: 'privacy' | 'cookies' | 'terms') {
    const result = await pool.query(
      `SELECT id, type, title, version, effective_date, language
       FROM legal_policies
       WHERE type = $1 AND language = 'en' AND is_active = 1
       ORDER BY effective_date DESC
       LIMIT 1`,
      [type]
    );
    return result.rows[0] || null;
  }

  buildVerificationUrl(requestId: string, token: string) {
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    return `${base}/privacy-rights?requestId=${encodeURIComponent(requestId)}&token=${encodeURIComponent(token)}`;
  }

  async sendVerificationEmail(email: string, token: string, requestType: GdprRequestType, requestId?: string) {
    const url = requestId ? this.buildVerificationUrl(requestId, token) : null;
    // Production: integrate SMTP/provider. Dev: log without full token.
    console.log(`📧 GDPR verification email queued for ${email} (${requestType})`);
    if (url && process.env.NODE_ENV !== 'production') {
      console.log(`   Dev verification URL: ${url}`);
    }
    return { sent: true, verificationUrl: process.env.NODE_ENV !== 'production' ? url : undefined };
  }

  async sendCompletionEmail(email: string, requestType: GdprRequestType) {
    console.log(`📧 GDPR completion email queued for ${email} (${requestType})`);
    return { sent: true };
  }

  async logComplianceEvent(options: {
    action: string;
    target?: string;
    targetId?: string | null;
    userId?: string | null;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    status?: 'success' | 'failure' | 'pending' | 'cancelled';
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    const {
      action,
      target = 'compliance',
      targetId = null,
      userId = null,
      severity = 'info',
      status = 'success',
      details = {},
      metadata = {}
    } = options;

    const logId = crypto.randomUUID();
    const timestamp = new Date();

    try {
      await pool.query(
        `INSERT INTO audit_logs (
          id, timestamp, created_at, event_type, severity, user_id, agent_type,
          action, target, target_id, entity_type, entity_id, status, details, metadata, performance, security
        ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $8, $9, $10, $11, $12, $13, $14)`,
        [
          logId,
          timestamp,
          'compliance',
          severity,
          userId,
          null,
          action,
          target,
          targetId,
          status,
          JSON.stringify(details),
          JSON.stringify(metadata),
          JSON.stringify({}),
          JSON.stringify({})
        ]
      );
    } catch (error) {
      console.error('Failed to write compliance audit log:', error);
    }
  }

  async processAccessRequest(email: string) {
    const userResult = await pool.query(
      `SELECT id, email, username, first_name, last_name, role, status, created_at, updated_at, last_login, email_verified
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: true, data: null, message: 'No data found for this email' };
    }

    const user = userResult.rows[0];
    const userId = user.id;

    const [
      labMemberships,
      managedLabs,
      protocols,
      projects,
      results,
      notebookEntries,
      consents,
      preferences,
      restrictions
    ] = await Promise.all([
      safeQuery(
        `SELECT l.id, l.name, l.institution, lm.role, lm.joined_at
         FROM lab_members lm
         JOIN labs l ON l.id = lm.lab_id
         WHERE lm.user_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT id, name, institution, created_at, updated_at
         FROM labs
         WHERE principal_researcher_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT id, title, description, category, privacy_level, created_at
         FROM protocols WHERE author_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT id, name, description, created_at, updated_at
         FROM projects WHERE owner_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT id, title, summary, data_type, created_at, updated_at
         FROM results WHERE author_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT id, title, entry_type, privacy_level, created_at, updated_at
         FROM lab_notebook_entries WHERE user_id = $1`,
        [userId]
      ),
      safeQuery(
        `SELECT id, type, granted, policy_type, policy_version, source, created_at, revoked_at
         FROM consents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [userId]
      ),
      safeQuery(`SELECT * FROM user_preferences WHERE user_id = $1`, [userId]),
      safeQuery(
        `SELECT restriction_type, reason, active, created_at
         FROM user_processing_restrictions WHERE user_id = $1 AND active = 1`,
        [userId]
      )
    ]);

    const userData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      labs: {
        memberships: labMemberships.rows,
        managed: managedLabs.rows
      },
      protocols: protocols.rows,
      projects: projects.rows,
      results: results.rows,
      notebookEntries: notebookEntries.rows,
      consents: consents.rows,
      preferences: preferences.rows,
      processingRestrictions: restrictions.rows
    };

    return {
      success: true,
      data: userData,
      message: 'Data export prepared'
    };
  }

  async processErasureRequest(email: string) {
    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return { success: true, message: 'No data found for this email' };
    }

    const userId = userResult.rows[0].id;
    const managedLabs = await safeQuery(
      `SELECT id FROM labs WHERE principal_researcher_id = $1`,
      [userId]
    );

    if (managedLabs.rows.length > 0) {
      return {
        success: false,
        error: 'Cannot erase account while assigned as principal researcher of a lab. Transfer leadership first.',
        managedLabs: managedLabs.rows.length
      };
    }

    const anonymizedEmail = `deleted_${userId}_${crypto.randomBytes(4).toString('hex')}@anonymized.local`;
    const anonymizedUsername = `deleted_${userId.slice(0, 8)}_${crypto.randomBytes(2).toString('hex')}`;
    const connection = await pool.connect();

    try {
      await connection.query('START TRANSACTION');

      await connection.query(
        `UPDATE users SET
          email = $1,
          username = $2,
          first_name = 'Deleted',
          last_name = 'User',
          avatar_url = NULL,
          bio = NULL,
          phone = NULL,
          status = 'inactive',
          email_verified = 0,
          last_login = NULL,
          updated_at = NOW()
        WHERE id = $3`,
        [anonymizedEmail, anonymizedUsername, userId]
      );

      await connection.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
      await connection.query('DELETE FROM consents WHERE user_id = $1', [userId]);
      await connection.query('DELETE FROM lab_members WHERE user_id = $1', [userId]);
      await connection.query(
        `UPDATE user_processing_restrictions SET active = 0, updated_at = NOW() WHERE user_id = $1`,
        [userId]
      );

      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }

    return {
      success: true,
      message: 'User data has been anonymized and access removed',
      retainedData: ['Research records retained for scientific integrity with authorship anonymized where applicable']
    };
  }

  async processPortabilityRequest(email: string) {
    const accessResult = await this.processAccessRequest(email);

    if (!accessResult.data) {
      return accessResult;
    }

    const exportData = JSON.stringify(accessResult.data, null, 2);

    return {
      success: true,
      format: 'JSON',
      size: Buffer.byteLength(exportData),
      data: accessResult.data,
      download: {
        mimeType: 'application/json',
        filename: `researchlab-export-${Date.now()}.json`,
        content: exportData
      },
      message: 'Machine-readable export prepared (Art. 20)'
    };
  }

  async processRestrictionRequest(email: string, reason?: string) {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return { success: true, message: 'No data found for this email' };
    }
    const userId = userResult.rows[0].id;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_processing_restrictions (id, user_id, restriction_type, reason, active)
       VALUES ($1, $2, 'restriction', $3, 1)
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), active = 1, updated_at = NOW()`,
      [id, userId, reason || 'User requested restriction of processing']
    );
    return {
      success: true,
      message: 'Processing restriction recorded. Non-essential processing should be limited pending review.'
    };
  }

  async processObjectionRequest(email: string, reason?: string) {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return { success: true, message: 'No data found for this email' };
    }
    const userId = userResult.rows[0].id;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO user_processing_restrictions (id, user_id, restriction_type, reason, active)
       VALUES ($1, $2, 'objection', $3, 1)
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), active = 1, updated_at = NOW()`,
      [id, userId, reason || 'User objected to processing based on legitimate interests']
    );
    // Withdraw non-essential consents
    await pool.query(
      `INSERT INTO consents (id, user_id, type, granted, source, policy_type, purposes, revoked_at)
       VALUES
         ($1, $2, 'analytics', 0, 'gdpr_objection', 'cookies', '[]', NOW()),
         ($3, $2, 'marketing', 0, 'gdpr_objection', 'cookies', '[]', NOW()),
         ($4, $2, 'functional', 0, 'gdpr_objection', 'cookies', '[]', NOW())`,
      [crypto.randomUUID(), userId, crypto.randomUUID(), crypto.randomUUID()]
    );
    return {
      success: true,
      message: 'Objection recorded and non-essential consents withdrawn.'
    };
  }

  async processRectificationRequest(email: string, description?: string) {
    return {
      success: true,
      message: 'Rectification request accepted for review. User may also update profile fields in Settings.',
      guidance: description || null,
      selfServicePath: '/settings'
    };
  }

  async linkAnonymousConsentsToUser(userId: string, sessionId: string) {
    if (!userId || !sessionId) return { linked: 0 };
    const result = await pool.query(
      `UPDATE consents SET user_id = $1
       WHERE session_id = $2 AND (user_id IS NULL OR user_id = '')`,
      [userId, sessionId]
    );
    // mysql2 ResultSetHeader for UPDATE is not rows; ignore count if unavailable
    return { linked: (result as any)?.affectedRows || 0 };
  }

  async executeRetentionPolicy(policy: RetentionPolicyRow, options: { dryRun?: boolean } = {}) {
    const { dryRun = true } = options;
    const cutoffDate = new Date(Date.now() - Number(policy.retention_period) * 24 * 60 * 60 * 1000);
    const tableName = this.mapDataTypeToTable(policy.data_type);

    if (!tableName) {
      return { success: false, error: 'Unknown data type' };
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS count FROM ${tableName} WHERE created_at < $1`,
      [cutoffDate]
    );
    const affectedCount = Number(countResult.rows[0]?.count || 0);

    if (!dryRun && affectedCount > 0) {
      if (policy.action === 'delete') {
        await pool.query(`DELETE FROM ${tableName} WHERE created_at < $1`, [cutoffDate]);
      } else if (policy.action === 'anonymize') {
        await this.anonymizeRecords(tableName, cutoffDate);
      } else if (policy.action === 'archive') {
        await this.archiveRecords(tableName, cutoffDate);
      }
    }

    return {
      success: true,
      policy: policy.name,
      affectedRecords: affectedCount,
      action: policy.action,
      executed: !dryRun
    };
  }

  mapDataTypeToTable(dataType: string) {
    if (retentionTableAllowlist.has(dataType)) {
      return dataType;
    }
    return null;
  }

  async anonymizeRecords(tableName: string, cutoffDate: Date) {
    switch (tableName) {
      case 'gdpr_requests':
        await pool.query(
          `UPDATE gdpr_requests
           SET email = CONCAT('deleted_', id, '@anonymized.local'),
               description = NULL,
               processing_notes = NULL,
               rejection_reason = NULL,
               result = NULL
           WHERE created_at < $1`,
          [cutoffDate]
        );
        return { anonymized: true };
      case 'consents':
        await pool.query(
          `UPDATE consents
           SET user_id = NULL,
               session_id = NULL,
               ip_address = NULL,
               user_agent = NULL
           WHERE created_at < $1`,
          [cutoffDate]
        );
        return { anonymized: true };
      case 'audit_logs':
        await pool.query(
          `UPDATE audit_logs
           SET user_id = NULL,
               details = '{}',
               metadata = '{}'
           WHERE created_at < $1`,
          [cutoffDate]
        );
        return { anonymized: true };
      default:
        return { anonymized: false, error: 'Anonymization not supported for this table' };
    }
  }

  async archiveRecords(_tableName: string, _cutoffDate: Date) {
    return { archived: false, error: 'Archiving not configured for this table' };
  }

  convertToCSV(logs: Array<Record<string, any>>) {
    if (logs.length === 0) return '';

    const headers = ['timestamp', 'user', 'action', 'target', 'targetId', 'severity'];
    const rows = logs.map(log => [
      (log.timestamp || log.created_at || new Date()).toISOString?.()
        || String(log.timestamp || log.created_at || ''),
      log.user_email || log.user_id || 'system',
      log.action || '',
      log.target || log.entity_type || '',
      log.target_id || log.entity_id || '',
      log.severity || 'info'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }
}

export const complianceService = new ComplianceService();
export default complianceService;
