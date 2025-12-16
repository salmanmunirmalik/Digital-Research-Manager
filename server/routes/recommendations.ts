/**
 * Recommendations API Routes
 * Phase 1: Protocol and Paper Recommendations
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { RecommendationEngine } from '../services/recommendations/RecommendationEngine.js';
import { pool } from '../../database/config.js';
import { ProtocolRecommender } from '../services/recommendations/ProtocolRecommender.js';
import { PaperRecommender } from '../services/recommendations/PaperRecommender.js';
import { ServiceRecommender } from '../services/recommendations/ServiceRecommender.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/recommendations/protocols
 * Get protocol recommendations for the authenticated user
 */
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const currentProtocolId = req.query.currentProtocolId as string | undefined;

    const context = {
      limit,
      currentItemId: currentProtocolId,
      currentItemType: currentProtocolId ? 'protocol' : undefined
    };

    // Get recommendations
    const recommendations = await ProtocolRecommender.getRecommendations(userId, context);

    // Store recommendations for tracking
    const storedRecs = await Promise.all(
      recommendations.map((rec, index) =>
        RecommendationEngine.storeRecommendation(userId, rec, index + 1)
      )
    );

    // Return recommendations with stored IDs
    const response = recommendations.map((rec, index) => ({
      ...rec,
      recommendationId: storedRecs[index]
    }));

    res.json({
      recommendations: response,
      count: response.length,
      itemType: 'protocol'
    });
  } catch (error: any) {
    console.error('Error getting protocol recommendations:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/recommendations/papers
 * Get paper recommendations for the authenticated user
 */
router.get('/papers', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const context = {
      limit
    };

    // Get recommendations
    const recommendations = await PaperRecommender.getRecommendations(userId, context);

    // Store recommendations for tracking
    const storedRecs = await Promise.all(
      recommendations.map((rec, index) =>
        RecommendationEngine.storeRecommendation(userId, rec, index + 1)
      )
    );

    // Return recommendations with stored IDs
    const response = recommendations.map((rec, index) => ({
      ...rec,
      recommendationId: storedRecs[index]
    }));

    res.json({
      recommendations: response,
      count: response.length,
      itemType: 'paper'
    });
  } catch (error: any) {
    console.error('Error getting paper recommendations:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/recommendations/protocols/:protocolId/similar
 * Get protocols similar to a specific protocol
 */
router.get('/protocols/:protocolId/similar', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const protocolId = req.params.protocolId;
    const limit = parseInt(req.query.limit as string) || 5;

    const recommendations = await ProtocolRecommender.getSimilarProtocols(protocolId, limit);

    res.json({
      recommendations,
      count: recommendations.length,
      itemType: 'protocol',
      baseProtocolId: protocolId
    });
  } catch (error: any) {
    console.error('Error getting similar protocols:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/recommendations/feedback
 * Record user feedback on a recommendation
 */
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { recommendationId, feedback, clicked, notes } = req.body;

    if (!recommendationId || !feedback) {
      return res.status(400).json({
        error: 'recommendationId and feedback are required'
      });
    }

    if (!['positive', 'negative', 'neutral', 'dismissed'].includes(feedback)) {
      return res.status(400).json({
        error: 'feedback must be one of: positive, negative, neutral, dismissed'
      });
    }

    await RecommendationEngine.recordFeedback(
      recommendationId,
      feedback,
      clicked || false,
      notes
    );

    res.json({
      message: 'Feedback recorded successfully',
      recommendationId
    });
  } catch (error: any) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/recommendations/track
 * Track user behavior event (for recommendation learning)
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { eventType, itemType, itemId, metadata } = req.body;

    if (!eventType || !itemType || !itemId) {
      return res.status(400).json({
        error: 'eventType, itemType, and itemId are required'
      });
    }

    await RecommendationEngine.trackEvent({
      userId: req.user.id,
      eventType,
      itemType,
      itemId,
      metadata
    });

    res.json({
      message: 'Event tracked successfully'
    });
  } catch (error: any) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/recommendations/explain/:itemType/:itemId
 * Get explanation for why an item was recommended
 */
router.get('/explain/:itemType/:itemId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { itemType, itemId } = req.params;
    const userId = req.user.id;

    // Get the most recent recommendation for this item
    const result = await pool.query(
      `SELECT recommendation_reason, algorithm_used, recommendation_score, context
       FROM user_recommendations
       WHERE user_id = $1
         AND item_type = $2
         AND item_id = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, itemType, itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No recommendation found for this item'
      });
    }

    const rec = result.rows[0];
    res.json({
      reason: rec.recommendation_reason,
      algorithm: rec.algorithm_used,
      score: rec.recommendation_score,
      context: rec.context
    });
  } catch (error: any) {
    console.error('Error getting recommendation explanation:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/recommendations/services
 * Get service recommendations for the authenticated user
 * Query params: type=provider|requester|request (default: provider)
 *              requestId=uuid (required if type=request)
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = (req.query.type as string) || 'provider';
    const requestId = req.query.requestId as string | undefined;

    let recommendations: Recommendation[] = [];

    if (type === 'request' && requestId) {
      // Get provider recommendations for a service request
      recommendations = await ServiceRecommender.getProviderRecommendationsForRequest(
        requestId,
        { limit }
      );
    } else if (type === 'requester') {
      // Get service recommendations for a requester
      recommendations = await ServiceRecommender.getServiceRecommendationsForRequester(
        userId,
        { limit }
      );
    } else {
      // Default: Get service recommendations for a provider
      recommendations = await ServiceRecommender.getProviderRecommendations(
        userId,
        { limit }
      );
    }

    // Store recommendations for tracking
    const storedRecs = await Promise.all(
      recommendations.map((rec, index) =>
        RecommendationEngine.storeRecommendation(userId, rec, index + 1)
      )
    );

    // Return recommendations with stored IDs
    const response = recommendations.map((rec, index) => ({
      ...rec,
      recommendationId: storedRecs[index]
    }));

    res.json({
      recommendations: response,
      count: response.length,
      itemType: 'service',
      recommendationType: type
    });
  } catch (error: any) {
    console.error('Error getting service recommendations:', error);
    res.status(500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Internal server error'
    });
  }
});

export default router;

