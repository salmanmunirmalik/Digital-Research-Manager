/**
 * Evidence Pack AI routes
 * POST /api/evidence-ai/analyze
 */

import { Router } from 'express';
import {
  EvidenceAIService,
  EvidenceAIAction,
} from '../services/EvidenceAIService.js';

const router: Router = Router();

const ACTIONS: EvidenceAIAction[] = [
  'summarize',
  'captions',
  'claim_check',
  'draft_results',
];

router.post('/analyze', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      action,
      title,
      summary,
      methodology,
      conclusions,
      packContext,
    } = req.body || {};

    if (!ACTIONS.includes(action)) {
      return res.status(400).json({
        error: `Invalid action. Use one of: ${ACTIONS.join(', ')}`,
      });
    }

    if (!packContext || typeof packContext !== 'string') {
      return res.status(400).json({ error: 'packContext string is required' });
    }

    const result = await EvidenceAIService.run({
      userId,
      action,
      title,
      summary,
      methodology,
      conclusions,
      packContext: packContext.slice(0, 28_000),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Evidence AI error:', error);
    const message = error?.message || 'Evidence AI failed';
    const status = /No AI API configured/i.test(message) ? 400 : 500;
    res.status(status).json({
      success: false,
      error: message,
    });
  }
});

router.get('/actions', (_req, res) => {
  res.json({
    actions: ACTIONS.map((action) => ({
      action,
      label:
        action === 'summarize'
          ? 'Summarize pack'
          : action === 'captions'
            ? 'Suggest captions'
            : action === 'claim_check'
              ? 'Check claims'
              : 'Draft Results section',
    })),
  });
});

export default router;
