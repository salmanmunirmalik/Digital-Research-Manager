import express, { type Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '../../database/config.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { complianceService } from '../services/complianceService.js';

const router: Router = express.Router();

const gdprRequestSchema = z.object({
  type: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection']),
  email: z.string().email(),
  description: z.string().optional(),
  verificationMethod: z.enum(['email', 'id_document', 'existing_account']).optional().default('email')
});

const consentSchema = z.object({
  type: z.enum(['essential', 'functional', 'analytics', 'marketing', 'third_party']),
  granted: z.boolean(),
  source: z.enum(['cookie_banner', 'account_settings', 'checkout', 'api', 'registration']).optional().default('cookie_banner'),
  policyType: z.enum(['cookies', 'privacy']).optional().default('cookies'),
  policyVersion: z.string().optional(),
  purposes: z.array(z.string()).optional()
});

const retentionPolicySchema = z.object({
  name: z.string(),
  dataType: z.string(),
  retentionPeriod: z.number().int().min(1),
  action: z.enum(['delete', 'anonymize', 'archive']),
  legalBasis: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

const policySchema = z.object({
  type: z.enum(['privacy', 'terms', 'cookies', 'acceptable_use', 'data_processing']),
  title: z.string(),
  content: z.string(),
  version: z.string(),
  effectiveDate: z.string(),
  language: z.string().optional().default('en')
});

const parseBody = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: result.error.issues.map((issue) => issue.message)
      });
    }
    req.body = result.data;
    return next();
  };
};

const optionalAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }
  return authenticateToken(req, res, next);
};

const defaultPurposes: Record<string, string[]> = {
  essential: ['platform_security', 'core_functionality'],
  functional: ['preferences', 'personalization'],
  analytics: ['usage_analytics', 'service_improvement'],
  marketing: ['personalized_outreach'],
  third_party: ['third_party_services']
};

const resolveConsentMetadata = async (payload: {
  policyType: 'cookies' | 'privacy';
  policyVersion?: string;
  purposes?: string[];
  type: 'essential' | 'functional' | 'analytics' | 'marketing' | 'third_party';
}): Promise<
  | { error: string }
  | { policyType: 'cookies' | 'privacy'; policyVersion: string; purposes: string[] }
> => {
  const purposes = payload.purposes && payload.purposes.length > 0
    ? payload.purposes
    : (defaultPurposes[payload.type] || ['unspecified']);

  let policyVersion = payload.policyVersion;
  if (!policyVersion) {
    const activePolicy = await complianceService.getActivePolicy(payload.policyType);
    if (!activePolicy?.version) {
      return { error: `No active ${payload.policyType} policy found` };
    }
    policyVersion = activePolicy.version;
  }

  return {
    policyType: payload.policyType,
    policyVersion: policyVersion as string,
    purposes
  };
};

const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_LOCK_MINUTES = 30;
const VERIFICATION_WINDOW_MINUTES = 60;

const insertConsent = async (values: {
  userId: string | null;
  sessionId: string | null;
  type: string;
  granted: boolean;
  source: string;
  version: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  policyType: string;
  policyVersion: string;
  purposes: string[];
  revokedAt?: Date | null;
}) => {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO consents (
      id, user_id, session_id, type, granted, source, version, ip_address, user_agent,
      policy_type, policy_version, purposes, revoked_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      values.userId,
      values.sessionId,
      values.type,
      values.granted ? 1 : 0,
      values.source,
      values.version,
      values.ipAddress || null,
      values.userAgent || null,
      values.policyType,
      values.policyVersion,
      JSON.stringify(values.purposes),
      values.revokedAt || null
    ]
  );
  const created = await pool.query(
    'SELECT id, type, granted, created_at FROM consents WHERE id = $1',
    [id]
  );
  return created.rows[0];
};

// GDPR Requests
router.post('/gdpr/requests', parseBody(gdprRequestSchema), async (req, res) => {
  try {
    const { type, email, description, verificationMethod } = req.body;

    const existingRequest = await pool.query(
      `SELECT id FROM gdpr_requests
       WHERE email = $1 AND type = $2 AND status IN ('PENDING', 'PROCESSING', 'VERIFIED')
       LIMIT 1`,
      [email, type]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A similar request is already pending',
        requestId: existingRequest.rows[0].id
      });
    }

    const id = crypto.randomUUID();
    const verificationToken = complianceService.generateToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO gdpr_requests
        (id, type, email, description, verification_method, verification_token, verification_expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
      [id, type, email, description || null, verificationMethod, verificationToken, verificationExpiresAt]
    );

    const emailResult = await complianceService.sendVerificationEmail(email, verificationToken, type, id);

    res.status(201).json({
      success: true,
      message: 'GDPR request submitted. Please check your email to verify.',
      requestId: id,
      ...(emailResult.verificationUrl ? { verificationUrl: emailResult.verificationUrl } : {})
    });
  } catch (error) {
    console.error('Error creating GDPR request:', error);
    res.status(500).json({ success: false, error: 'Failed to create GDPR request' });
  }
});

router.get('/gdpr/requests', authenticateToken, requireRole(['admin']), async (req: any, res) => {
  try {
    const { status, type, limit = '20', offset = '0' } = req.query;
    const where: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (type) {
      params.push(type);
      where.push(`type = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limitValue = Number(limit);
    const offsetValue = Number(offset);

    const listParams = [...params, limitValue, offsetValue];
    const [requests, total] = await Promise.all([
      pool.query(
        `SELECT * FROM gdpr_requests ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        listParams
      ),
      pool.query(`SELECT COUNT(*) AS count FROM gdpr_requests ${whereSql}`, params)
    ]);

    res.json({
      success: true,
      requests: requests.rows,
      pagination: { total: Number(total.rows[0]?.count || 0), limit: limitValue, offset: offsetValue }
    });
  } catch (error) {
    console.error('Error fetching GDPR requests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GDPR requests' });
  }
});

router.get('/gdpr/requests/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.email AS processed_by_email, u.first_name AS processed_by_first_name, u.last_name AS processed_by_last_name
       FROM gdpr_requests r
       LEFT JOIN users u ON u.id = r.processed_by_id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const request = result.rows[0];
    if (typeof request.result === 'string') {
      try {
        request.result = JSON.parse(request.result);
      } catch {
        // keep string
      }
    }

    const processedBy = request.processed_by_email
      ? {
          email: request.processed_by_email,
          first_name: request.processed_by_first_name,
          last_name: request.processed_by_last_name
        }
      : null;

    res.json({ success: true, request: { ...request, processedBy } });
  } catch (error) {
    console.error('Error fetching GDPR request:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GDPR request' });
  }
});

router.post('/gdpr/requests/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    const requestResult = await pool.query('SELECT * FROM gdpr_requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const now = new Date();
    if (request.verification_locked_until && new Date(request.verification_locked_until) > now) {
      await complianceService.logComplianceEvent({
        action: 'VERIFY_GDPR_REQUEST_BLOCKED',
        target: 'gdpr_requests',
        targetId: id,
        severity: 'warning',
        status: 'failure',
        details: { reason: 'locked' },
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      });
      return res.status(429).json({ success: false, error: 'Verification is temporarily locked. Please try later.' });
    }

    const lastAttemptAt = request.last_verification_attempt_at
      ? new Date(request.last_verification_attempt_at)
      : null;
    const withinWindow = lastAttemptAt
      ? (now.getTime() - lastAttemptAt.getTime()) / (60 * 1000) <= VERIFICATION_WINDOW_MINUTES
      : false;
    const attempts = withinWindow ? Number(request.verification_attempts || 0) : 0;

    const tokenInvalid = request.verification_token !== token;
    const tokenExpired = new Date(request.verification_expires_at) < now;

    if (tokenInvalid || tokenExpired) {
      const updatedAttempts = attempts + 1;
      const lockedUntil = updatedAttempts >= MAX_VERIFICATION_ATTEMPTS
        ? new Date(now.getTime() + VERIFICATION_LOCK_MINUTES * 60 * 1000)
        : null;

      await pool.query(
        `UPDATE gdpr_requests
         SET verification_attempts = $1,
             last_verification_attempt_at = $2,
             verification_locked_until = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [updatedAttempts, now, lockedUntil, id]
      );

      await complianceService.logComplianceEvent({
        action: 'VERIFY_GDPR_REQUEST_FAILED',
        target: 'gdpr_requests',
        targetId: id,
        severity: 'warning',
        status: 'failure',
        details: { reason: tokenExpired ? 'expired' : 'invalid', attempts: updatedAttempts },
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
      });

      return res.status(400).json({
        success: false,
        error: tokenExpired ? 'Verification token expired' : 'Invalid verification token'
      });
    }

    await pool.query(
      `UPDATE gdpr_requests
       SET status = 'VERIFIED',
           verified_at = NOW(),
           verification_attempts = 0,
           last_verification_attempt_at = $1,
           verification_locked_until = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [now, id]
    );

    await complianceService.logComplianceEvent({
      action: 'VERIFY_GDPR_REQUEST_SUCCESS',
      target: 'gdpr_requests',
      targetId: id,
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    });

    res.json({ success: true, message: 'Request verified successfully' });
  } catch (error) {
    console.error('Error verifying GDPR request:', error);
    res.status(500).json({ success: false, error: 'Failed to verify request' });
  }
});

router.post('/gdpr/requests/:id/process', authenticateToken, requireRole(['admin']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const requestResult = await pool.query('SELECT * FROM gdpr_requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'VERIFIED') {
      return res.status(400).json({ success: false, error: 'Request must be verified first' });
    }

    await pool.query(
      `UPDATE gdpr_requests SET status = 'PROCESSING', processed_by_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [userId, id]
    );

    let result: any;
    switch (request.type) {
      case 'access':
        result = await complianceService.processAccessRequest(request.email);
        break;
      case 'erasure':
        result = await complianceService.processErasureRequest(request.email);
        break;
      case 'portability':
        result = await complianceService.processPortabilityRequest(request.email);
        break;
      case 'rectification':
        result = await complianceService.processRectificationRequest(request.email, request.description);
        break;
      case 'restriction':
        result = await complianceService.processRestrictionRequest(request.email, request.description);
        break;
      case 'objection':
        result = await complianceService.processObjectionRequest(request.email, request.description);
        break;
      default:
        result = { success: true };
    }

    await pool.query(
      `UPDATE gdpr_requests
       SET status = 'COMPLETED', completed_at = NOW(), processing_notes = $1, result = $2, updated_at = NOW()
       WHERE id = $3`,
      [notes || null, JSON.stringify(result), id]
    );

    await complianceService.sendCompletionEmail(request.email, request.type);
    await complianceService.logComplianceEvent({
      action: 'PROCESS_GDPR_REQUEST',
      target: 'gdpr_requests',
      targetId: id,
      userId,
      details: { requestType: request.type },
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    });

    res.json({
      success: true,
      message: 'GDPR request processed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing GDPR request:', error);
    res.status(500).json({ success: false, error: 'Failed to process GDPR request' });
  }
});

router.post('/gdpr/requests/:id/reject', authenticateToken, requireRole(['admin']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    await pool.query(
      `UPDATE gdpr_requests
       SET status = 'REJECTED', processed_by_id = $1, rejection_reason = $2, completed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [userId, reason || 'Rejected', id]
    );

    await complianceService.logComplianceEvent({
      action: 'REJECT_GDPR_REQUEST',
      target: 'gdpr_requests',
      targetId: id,
      userId,
      severity: 'warning',
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    });

    res.json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error('Error rejecting GDPR request:', error);
    res.status(500).json({ success: false, error: 'Failed to reject request' });
  }
});

// Consent management
router.post('/consent', optionalAuth, parseBody(consentSchema), async (req: any, res) => {
  try {
    const { type, granted, source, policyType, policyVersion, purposes } = req.body;
    const userId = req.user?.id || null;
    const sessionHeader = req.headers['x-session-id'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader || null;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const metadata = await resolveConsentMetadata({
      policyType,
      policyVersion,
      purposes,
      type
    });
    if ('error' in metadata) {
      return res.status(400).json({ success: false, error: metadata.error });
    }

    const consent = await insertConsent({
      userId,
      sessionId,
      type,
      granted,
      source,
      version: metadata.policyVersion,
      ipAddress,
      userAgent,
      policyType: metadata.policyType,
      policyVersion: metadata.policyVersion,
      purposes: metadata.purposes
    });

    await complianceService.logComplianceEvent({
      action: 'RECORD_CONSENT',
      target: 'consents',
      targetId: consent?.id,
      userId,
      details: {
        type,
        granted,
        policyVersion: metadata.policyVersion,
        policyType: metadata.policyType,
        purposes: metadata.purposes
      },
      metadata: { ipAddress, userAgent, sessionId }
    });

    res.status(201).json({
      success: true,
      consent: {
        id: consent.id,
        type: consent.type,
        granted: Boolean(consent.granted),
        timestamp: consent.created_at
      }
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({ success: false, error: 'Failed to record consent' });
  }
});

router.post('/consent/batch', optionalAuth, async (req: any, res) => {
  try {
    const batchSchema = z.object({
      source: z.enum(['cookie_banner', 'account_settings', 'checkout', 'api', 'registration']).optional().default('cookie_banner'),
      consents: z.array(consentSchema.omit({ source: true })).min(1)
    });
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.issues.map((issue) => issue.message)
      });
    }

    const { consents, source } = parsed.data;
    const userId = req.user?.id || null;
    const sessionHeader = req.headers['x-session-id'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader || null;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    for (const consent of consents) {
      const metadata = await resolveConsentMetadata({
        policyType: consent.policyType,
        policyVersion: consent.policyVersion,
        purposes: consent.purposes,
        type: consent.type
      });
      if ('error' in metadata) {
        throw new Error(metadata.error);
      }

      await insertConsent({
        userId,
        sessionId,
        type: consent.type,
        granted: consent.granted,
        source,
        version: metadata.policyVersion,
        ipAddress,
        userAgent,
        policyType: metadata.policyType,
        policyVersion: metadata.policyVersion,
        purposes: metadata.purposes,
        revokedAt: consent.granted ? null : new Date()
      });
    }

    await complianceService.logComplianceEvent({
      action: 'RECORD_CONSENT_BATCH',
      target: 'consents',
      userId,
      details: { count: consents.length, source },
      metadata: { ipAddress, userAgent, sessionId }
    });

    res.status(201).json({
      success: true,
      recorded: consents.length
    });
  } catch (error) {
    console.error('Error recording consents:', error);
    res.status(500).json({ success: false, error: 'Failed to record consents' });
  }
});

router.post('/consent/withdraw', optionalAuth, async (req: any, res) => {
  try {
    const withdrawSchema = z.object({
      types: z.array(z.enum(['essential', 'functional', 'analytics', 'marketing', 'third_party'])).min(1),
      source: z.enum(['cookie_banner', 'account_settings', 'checkout', 'api', 'registration']).optional().default('account_settings'),
      policyType: z.enum(['cookies', 'privacy']).optional().default('cookies'),
      policyVersion: z.string().optional()
    });
    const parsed = withdrawSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.issues.map((issue) => issue.message)
      });
    }

    const { types, source, policyType, policyVersion } = parsed.data;
    const userId = req.user?.id || null;
    const sessionHeader = req.headers['x-session-id'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader || null;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    if (!userId && !sessionId) {
      return res.status(400).json({ success: false, error: 'Session or user context required' });
    }

    const revokedAt = new Date();
    for (const type of types) {
      if (type === 'essential') continue;
      const metadata = await resolveConsentMetadata({
        policyType,
        policyVersion,
        purposes: undefined,
        type
      });
      if ('error' in metadata) {
        throw new Error(metadata.error);
      }

      await insertConsent({
        userId,
        sessionId,
        type,
        granted: false,
        source,
        version: metadata.policyVersion,
        ipAddress,
        userAgent,
        policyType: metadata.policyType,
        policyVersion: metadata.policyVersion,
        purposes: metadata.purposes,
        revokedAt
      });
    }

    await complianceService.logComplianceEvent({
      action: 'WITHDRAW_CONSENT',
      target: 'consents',
      userId,
      details: { types, source, policyType, policyVersion: policyVersion || null },
      metadata: { ipAddress, userAgent, sessionId }
    });

    res.status(200).json({ success: true, revoked: types.filter(t => t !== 'essential').length });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({ success: false, error: 'Failed to withdraw consent' });
  }
});

router.post('/consent/link-session', authenticateToken, async (req: any, res) => {
  try {
    const sessionHeader = req.headers['x-session-id'];
    const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader || req.body?.sessionId;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId required' });
    }
    const result = await complianceService.linkAnonymousConsentsToUser(req.user.id, sessionId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error linking consent session:', error);
    res.status(500).json({ success: false, error: 'Failed to link consent session' });
  }
});

router.get('/consent/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user.id;
    const policyType = (req.query.policyType as string) || 'cookies';

    if (userId !== requestingUser && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const latest = await pool.query(
      `SELECT c.type, c.granted, c.created_at
       FROM consents c
       INNER JOIN (
         SELECT type, MAX(created_at) AS max_created
         FROM consents
         WHERE user_id = $1 AND (policy_type IS NULL OR policy_type = $2)
         GROUP BY type
       ) latest ON latest.type = c.type AND latest.max_created = c.created_at
       WHERE c.user_id = $1`,
      [userId, policyType]
    );

    const consentTypes = ['essential', 'functional', 'analytics', 'marketing', 'third_party'] as const;
    const consents: Record<string, any> = {};
    consentTypes.forEach(type => {
      consents[type] = null;
    });

    latest.rows.forEach(row => {
      consents[row.type] = { granted: Boolean(row.granted), timestamp: row.created_at };
    });

    res.json({ success: true, consents });
  } catch (error) {
    console.error('Error fetching consent:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consent' });
  }
});

router.get('/consent/:userId/history', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = '50', policyType = 'cookies' } = req.query;

    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const params: any[] = [userId, policyType];
    let where = `user_id = $1 AND (policy_type IS NULL OR policy_type = $2)`;
    if (type) {
      params.push(type);
      where += ` AND type = $${params.length}`;
    }

    params.push(Number(limit));

    const history = await pool.query(
      `SELECT * FROM consents WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );

    res.json({ success: true, history: history.rows });
  } catch (error) {
    console.error('Error fetching consent history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consent history' });
  }
});

// Audit logs
router.get('/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      userId,
      action,
      target,
      startDate,
      endDate,
      severity,
      limit = '50',
      offset = '0'
    } = req.query as Record<string, string>;

    const where: string[] = [];
    const params: any[] = [];

    if (userId) {
      params.push(userId);
      where.push(`user_id = $${params.length}`);
    }
    if (action) {
      params.push(action);
      where.push(`action = $${params.length}`);
    }
    if (target) {
      params.push(target);
      where.push(`(target = $${params.length} OR entity_type = $${params.length})`);
    }
    if (severity) {
      params.push(severity);
      where.push(`severity = $${params.length}`);
    }
    if (startDate) {
      params.push(new Date(startDate));
      where.push(`created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(new Date(endDate));
      where.push(`created_at <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limitValue = Number(limit);
    const offsetValue = Number(offset);

    const [logs, total] = await Promise.all([
      pool.query(
        `SELECT a.*, u.email AS user_email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limitValue, offsetValue]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM audit_logs ${whereSql}`,
        params
      )
    ]);

    res.json({
      success: true,
      logs: logs.rows,
      pagination: { total: Number(total.rows[0]?.count || 0), limit: limitValue, offset: offsetValue }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

router.get('/audit-logs/export', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query as Record<string, string>;
    const where: string[] = [];
    const params: any[] = [];

    if (startDate) {
      params.push(new Date(startDate));
      where.push(`created_at >= $${params.length}`);
    }
    if (endDate) {
      params.push(new Date(endDate));
      where.push(`created_at <= $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const logs = await pool.query(
      `SELECT a.*, u.email AS user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereSql}
       ORDER BY created_at DESC`,
      params
    );

    if (format === 'csv') {
      const csv = complianceService.convertToCSV(logs.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      return res.send(csv);
    }

    res.json({ success: true, logs: logs.rows });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, error: 'Failed to export audit logs' });
  }
});

// Retention policies
router.get('/retention-policies', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const policies = await pool.query(
      'SELECT * FROM retention_policies ORDER BY name ASC'
    );
    res.json({ success: true, policies: policies.rows });
  } catch (error) {
    console.error('Error fetching retention policies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policies' });
  }
});

router.post('/retention-policies', authenticateToken, requireRole(['admin']), parseBody(retentionPolicySchema), async (req, res) => {
  try {
    const { name, dataType, retentionPeriod, action, legalBasis, description, isActive } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO retention_policies (id, name, data_type, retention_period, action, legal_basis, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name, dataType, retentionPeriod, action, legalBasis || null, description || null, isActive ? 1 : 0]
    );
    const policy = await pool.query('SELECT * FROM retention_policies WHERE id = $1', [id]);

    await complianceService.logComplianceEvent({
      action: 'CREATE_RETENTION_POLICY',
      target: 'retention_policies',
      targetId: id
    });

    res.status(201).json({ success: true, policy: policy.rows[0] });
  } catch (error) {
    console.error('Error creating retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to create policy' });
  }
});

router.put('/retention-policies/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...(req.body || {}) };

    if (updates.dataType && updates.data_type === undefined) {
      updates.data_type = updates.dataType;
      delete updates.dataType;
    }

    const fields: string[] = [];
    const values: any[] = [];

    const allowed = ['name', 'data_type', 'retention_period', 'action', 'legal_basis', 'description', 'is_active'];
    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        values.push(updates[field]);
        fields.push(`${field} = $${values.length}`);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No updates provided' });
    }

    values.push(id);
    await pool.query(
      `UPDATE retention_policies SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}`,
      values
    );
    const policy = await pool.query('SELECT * FROM retention_policies WHERE id = $1', [id]);

    res.json({ success: true, policy: policy.rows[0] });
  } catch (error) {
    console.error('Error updating retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to update policy' });
  }
});

router.delete('/retention-policies/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM retention_policies WHERE id = $1', [id]);
    res.json({ success: true, message: 'Policy deleted' });
  } catch (error) {
    console.error('Error deleting retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to delete policy' });
  }
});

router.post('/retention-policies/:id/execute', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { dryRun = true } = req.body || {};

    const policyResult = await pool.query('SELECT * FROM retention_policies WHERE id = $1', [id]);
    const policy = policyResult.rows[0];

    if (!policy) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    const result = await complianceService.executeRetentionPolicy(policy, { dryRun });
    if (!dryRun) {
      await pool.query('UPDATE retention_policies SET last_executed_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
    }

    res.json({ success: true, dryRun, result });
  } catch (error) {
    console.error('Error executing retention policy:', error);
    res.status(500).json({ success: false, error: 'Failed to execute policy' });
  }
});

// Legal policies
router.get('/policies', async (req, res) => {
  try {
    const { type, language = 'en', current = 'true' } = req.query as Record<string, string>;
    const params: any[] = [language];
    let where = 'language = $1';

    if (type) {
      params.push(type);
      where += ` AND type = $${params.length}`;
    }

    if (current === 'true') {
      const policies = await pool.query(
        `SELECT lp.*
         FROM legal_policies lp
         INNER JOIN (
           SELECT type, MAX(effective_date) AS max_date
           FROM legal_policies
           WHERE ${where} AND is_active = 1
           GROUP BY type
         ) latest ON latest.type = lp.type AND latest.max_date = lp.effective_date
         WHERE lp.is_active = 1 AND lp.language = $1
         ${type ? 'AND lp.type = $2' : ''}`,
        params
      );
      return res.json({ success: true, policies: policies.rows });
    }

    const policies = await pool.query(
      `SELECT * FROM legal_policies WHERE ${where} ORDER BY effective_date DESC`,
      params
    );
    res.json({ success: true, policies: policies.rows });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policies' });
  }
});

router.get('/policies/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { language = 'en', version } = req.query as Record<string, string>;

    const params: any[] = [type, language];
    let where = 'type = $1 AND language = $2';

    if (version) {
      params.push(version);
      where += ` AND version = $${params.length}`;
    } else {
      where += ' AND is_active = 1';
    }

    const policy = await pool.query(
      `SELECT * FROM legal_policies WHERE ${where} ORDER BY effective_date DESC LIMIT 1`,
      params
    );

    if (policy.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Policy not found' });
    }

    res.json({ success: true, policy: policy.rows[0] });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policy' });
  }
});

router.post('/policies', authenticateToken, requireRole(['admin']), parseBody(policySchema), async (req, res) => {
  try {
    const { type, title, content, version, effectiveDate, language } = req.body;
    const id = crypto.randomUUID();

    await pool.query(
      'UPDATE legal_policies SET is_active = 0 WHERE type = $1 AND language = $2',
      [type, language]
    );

    await pool.query(
      `INSERT INTO legal_policies (id, type, title, content, version, effective_date, language, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
      [id, type, title, content, version, effectiveDate, language]
    );
    const policy = await pool.query('SELECT * FROM legal_policies WHERE id = $1', [id]);

    res.status(201).json({ success: true, policy: policy.rows[0] });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ success: false, error: 'Failed to create policy' });
  }
});

// Compliance dashboard
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const [
      pendingRequests,
      totalRequests,
      recentConsents,
      auditLogCount,
      retentionPolicies
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM gdpr_requests WHERE status IN ('PENDING', 'VERIFIED', 'PROCESSING')`),
      pool.query(`SELECT COUNT(*) AS count FROM gdpr_requests`),
      pool.query(`SELECT COUNT(*) AS count FROM consents WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`),
      pool.query(`SELECT COUNT(*) AS count FROM audit_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
      pool.query(`SELECT * FROM retention_policies WHERE is_active = 1`)
    ]);

    const gdprBreakdown = await pool.query(
      `SELECT type, status, COUNT(*) AS count
       FROM gdpr_requests
       GROUP BY type, status`
    );

    const consentRates = await pool.query(
      `SELECT type, COUNT(*) AS count
       FROM consents
       WHERE granted = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY type`
    );

    res.json({
      success: true,
      dashboard: {
        gdpr: {
          pending: Number(pendingRequests.rows[0]?.count || 0),
          total: Number(totalRequests.rows[0]?.count || 0),
          breakdown: gdprBreakdown.rows.map(row => ({
            type: row.type,
            status: row.status,
            _count: Number(row.count)
          }))
        },
        consent: {
          recentCount: Number(recentConsents.rows[0]?.count || 0),
          rates: consentRates.rows.map(row => ({
            type: row.type,
            _count: Number(row.count)
          }))
        },
        audit: {
          weeklyCount: Number(auditLogCount.rows[0]?.count || 0)
        },
        retention: {
          activePolicies: retentionPolicies.rows.length,
          policies: retentionPolicies.rows
        }
      }
    });
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
  }
});

export default router;
