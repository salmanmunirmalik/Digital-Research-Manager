import request from 'supertest';
import express from 'express';

const mockPool = {
  query: jest.fn()
};

jest.mock('../../database/config.js', () => ({
  default: mockPool
}));

const mockIngest = jest.fn(async () => [{ sourceId: 'source-1', count: 2 }]);
const mockMatchAll = jest.fn(async () => [{ userId: 'user-1', matchCount: 1 }]);
const mockMatchUser = jest.fn(async () => [{ grantId: 'grant-1', matchScore: 0.8, isEligible: true, reasons: ['keyword_match'] }]);
const mockNotify = jest.fn(async () => 1);

jest.mock('../../server/services/grants/ingestionService.js', () => ({
  ingestGrantSources: () => mockIngest()
}));

jest.mock('../../server/services/grants/matchingService.js', () => ({
  matchAllUsers: () => mockMatchAll(),
  matchGrantsForUser: () => mockMatchUser()
}));

jest.mock('../../server/services/grants/notificationService.js', () => ({
  notifyMatchesForUser: () => mockNotify()
}));

jest.mock('../../server/middleware/auth.js', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'admin' };
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next()
}));

import grantsRouter from '../../server/routes/grants.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/grants', grantsRouter);
  return app;
};

describe('Grants API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves grant preferences', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: { affectedRows: 1 } })
      .mockResolvedValueOnce({
        rows: [{
          user_id: 'user-1',
          keywords: '["genomics"]',
          disciplines: '["biology"]',
          regions: '["EU"]',
          funding_types: '["grant"]',
          notify_in_app: 1,
          notify_email: 0,
        }]
      });

    const response = await request(createApp())
      .post('/api/grants/preferences')
      .send({
        keywords: ['genomics'],
        disciplines: ['biology'],
        regions: ['EU'],
        fundingTypes: ['grant'],
        notifyInApp: true,
        notifyEmail: false
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockMatchUser).toHaveBeenCalledWith('user-1');
    expect(mockNotify).toHaveBeenCalledWith('user-1');
    expect(response.body.matchCount).toBe(1);
  });

  it('returns grant matches for user', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        id: 'grant-1',
        title: 'Genome Funding',
        sponsor: 'EU',
        match_score: 0.8,
        is_eligible: true,
        reasons: ['keyword_match']
      }]
    });

    const response = await request(createApp()).get('/api/grants/matches/me');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockNotify).toHaveBeenCalled();
  });

});
