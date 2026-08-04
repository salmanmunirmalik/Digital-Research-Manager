/**
 * Notebook Summaries API Routes
 * Generate AI (or heuristic) daily/weekly digests from lab notebook entries
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { NotebookSummaryGenerator, SummaryRequest } from '../services/NotebookSummaryGenerator.js';

const router = Router();

router.use(authenticateToken);

const sendSummary = (res: Response, summary: any) => {
  res.json({
    summary,
    mode: summary.mode || 'ai',
    generatedAt: new Date().toISOString(),
  });
};

/**
 * POST /api/notebook-summaries/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { summaryType, dateRange, projectId, entryIds } = req.body;

    if (!summaryType || !['daily', 'weekly', 'project', 'publication'].includes(summaryType)) {
      return res.status(400).json({
        error: 'summaryType is required and must be one of: daily, weekly, project, publication',
      });
    }

    if (summaryType === 'project' && !projectId) {
      return res.status(400).json({
        error: 'projectId is required for project summaries',
      });
    }

    const request: SummaryRequest = {
      userId: req.user.id,
      summaryType,
      dateRange: dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
      projectId,
      entryIds,
    };

    const summary = await NotebookSummaryGenerator.generateSummary(request);
    sendSummary(res, summary);
  } catch (error: any) {
    console.error('Error generating notebook summary:', error);
    res.status(500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message || 'Internal server error',
    });
  }
});

router.get('/daily', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const summary = await NotebookSummaryGenerator.generateSummary({
      userId: req.user.id,
      summaryType: 'daily',
    });
    sendSummary(res, summary);
  } catch (error: any) {
    console.error('Error generating daily summary:', error);
    res.status(500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message || 'Internal server error',
    });
  }
});

router.get('/weekly', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const summary = await NotebookSummaryGenerator.generateSummary({
      userId: req.user.id,
      summaryType: 'weekly',
    });
    sendSummary(res, summary);
  } catch (error: any) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message || 'Internal server error',
    });
  }
});

router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { projectId } = req.params;
    const summary = await NotebookSummaryGenerator.generateSummary({
      userId: req.user.id,
      summaryType: 'project',
      projectId,
    });
    sendSummary(res, summary);
  } catch (error: any) {
    console.error('Error generating project summary:', error);
    res.status(500).json({
      error:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message || 'Internal server error',
    });
  }
});

export default router;
