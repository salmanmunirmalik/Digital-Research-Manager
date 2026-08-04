import request from 'supertest';
import express from 'express';

const mockPool = {
  query: jest.fn()
};

const mockComplianceService = {
  generateToken: jest.fn(() => 'token-123'),
  sendVerificationEmail: jest.fn(),
  sendCompletionEmail: jest.fn(),
  processAccessRequest: jest.fn(),
  processErasureRequest: jest.fn(),
  processPortabilityRequest: jest.fn(),
  executeRetentionPolicy: jest.fn(),
  convertToCSV: jest.fn(),
  logComplianceEvent: jest.fn(),
  getActivePolicy: jest.fn(async () => ({ version: '1.0.0' }))
};

jest.mock('../../database/config.js', () => ({
  default: mockPool
}));

jest.mock('../../server/services/complianceService.js', () => ({
  complianceService: mockComplianceService
}));

jest.mock('../../server/middleware/auth.js', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'admin' };
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next()
}));

import complianceRouter from '../../server/routes/compliance.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/compliance', complianceRouter);
  return app;
};

describe('Compliance API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records consent with policy metadata', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'consent-1', type: 'analytics', granted: true, created_at: '2026-01-01' }]
    });

    const response = await request(createApp())
      .post('/api/compliance/consent')
      .send({
        type: 'analytics',
        granted: true,
        source: 'account_settings',
        policyType: 'privacy',
        purposes: ['policy_ack']
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(mockComplianceService.logComplianceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RECORD_CONSENT' })
    );
  });

  it('withdraws consent and logs audit event', async () => {
    mockPool.query.mockResolvedValue({ rows: [] });

    const response = await request(createApp())
      .post('/api/compliance/consent/withdraw')
      .send({
        types: ['marketing', 'analytics'],
        source: 'account_settings',
        policyType: 'cookies'
      });

    expect(response.status).toBe(200);
    expect(response.body.revoked).toBe(2);
    expect(mockComplianceService.logComplianceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'WITHDRAW_CONSENT' })
    );
  });

  it('rejects invalid verification token and increments attempts', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'req-1',
          verification_token: 'token-123',
          verification_expires_at: new Date(Date.now() + 60_000),
          verification_attempts: 0
        }]
      })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(createApp())
      .post('/api/compliance/gdpr/requests/req-1/verify')
      .send({ token: 'bad-token' });

    expect(response.status).toBe(400);
    expect(mockComplianceService.logComplianceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VERIFY_GDPR_REQUEST_FAILED' })
    );
  });
});
