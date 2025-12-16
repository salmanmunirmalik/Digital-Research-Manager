/**
 * Protocol Comparison API Routes
 * Handles protocol comparison and analysis
 */

import { Router } from 'express';
import { ProtocolComparator } from '../services/ProtocolComparator.js';
import { authenticateToken } from '../middleware/auth.js';

const router: Router = Router();

/**
 * Find similar protocols for comparison
 * GET /api/protocol-comparison/:id/similar
 */
router.get('/:id/similar', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const similarProtocols = await ProtocolComparator.findSimilarProtocols(
      id,
      parseInt(limit as string)
    );

    res.json({
      protocolId: id,
      similarProtocols,
      total: similarProtocols.length
    });
  } catch (error: any) {
    console.error('Error finding similar protocols:', error);
    res.status(500).json({ 
      error: 'Failed to find similar protocols', 
      details: error.message 
    });
  }
});

/**
 * Compare two protocols
 * POST /api/protocol-comparison/compare
 */
router.post('/compare', authenticateToken, async (req: any, res) => {
  try {
    const { protocol1Id, protocol2Id } = req.body;

    if (!protocol1Id || !protocol2Id) {
      return res.status(400).json({ 
        error: 'Both protocol1Id and protocol2Id are required' 
      });
    }

    const comparison = await ProtocolComparator.compareProtocols(
      protocol1Id,
      protocol2Id,
      req.user.id
    );

    res.json(comparison);
  } catch (error: any) {
    console.error('Error comparing protocols:', error);
    res.status(500).json({ 
      error: 'Failed to compare protocols', 
      details: error.message 
    });
  }
});

/**
 * Get comparison summary
 * GET /api/protocol-comparison/:id/summary
 */
router.get('/:id/summary', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { compareWith } = req.query;

    if (!compareWith) {
      return res.status(400).json({ 
        error: 'compareWith parameter is required' 
      });
    }

    const comparison = await ProtocolComparator.compareProtocols(
      id,
      compareWith,
      req.user.id
    );

    // Return summary
    res.json({
      overallScore: comparison.overallScore,
      similarityPercentage: (comparison.overallScore * 100).toFixed(1),
      totalDifferences: comparison.differences.length,
      criticalDifferences: comparison.differences.filter(d => 
        d.severity === 'critical' || d.severity === 'high'
      ).length,
      missingSteps: comparison.missingSteps.length,
      missingMaterials: comparison.missingMaterials.length,
      recommendations: comparison.recommendations,
      troubleshooting: comparison.troubleshooting
    });
  } catch (error: any) {
    console.error('Error getting comparison summary:', error);
    res.status(500).json({ 
      error: 'Failed to get comparison summary', 
      details: error.message 
    });
  }
});

export default router;

