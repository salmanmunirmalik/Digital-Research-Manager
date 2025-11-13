import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

const experimentsResponse = {
  data: [
    {
      id: 'exp-001',
      title: 'CRISPR Optimization Study',
      description: 'Optimize gene editing efficiency using CRISPR-Cas9.',
      hypothesis: 'Enhanced guide RNA improves editing efficiency.',
      objectives: ['Compare guide RNA variants'],
      methodology: 'Step-by-step bench workflow.',
      expectedOutcomes: ['Improved editing efficiency'],
      status: 'running',
      priority: 'high',
      category: 'molecular_biology',
      estimatedDuration: 72,
      actualDuration: 24,
      startDate: '2025-01-02T08:00:00Z',
      dueDate: '2025-01-09T08:00:00Z',
      labId: 'lab-123',
      labName: 'Genomics Lab',
      researcherId: 'user-123',
      researcherName: 'Dr. Demo Researcher',
      collaborators: ['Dr. Smith'],
      equipment: ['Bioreactor'],
      materials: ['Guide RNA kit'],
      reagents: ['Cas9 enzyme'],
      safetyRequirements: ['Level 2 PPE'],
      budget: 5000,
      actualCost: 1250,
      tags: ['crispr', 'gene-editing'],
      notes: '',
      attachments: [],
      milestones: [],
      risks: [],
      progressPercentage: 45,
      totalMilestones: 5,
      completedMilestones: 2,
      overdueMilestones: 0,
      createdAt: '2025-01-01T08:00:00Z',
      updatedAt: '2025-01-04T08:00:00Z'
    }
  ]
};

const templatesResponse = {
  data: [
    {
      id: 'template-001',
      name: 'Western Blot Template',
      category: 'protein_analysis',
      description: 'Standard operating procedure for Western blot experiments.',
      methodology: 'Run SDS-PAGE, transfer to membrane, probe with antibodies.',
      estimatedDuration: 12,
      equipment: ['Gel electrophoresis system'],
      materials: ['PVDF membrane'],
      reagents: ['Primary antibody'],
      safetyRequirements: ['Wear lab coat and gloves'],
      milestones: [
        {
          title: 'Sample Preparation',
          description: 'Prepare protein lysates and quantify concentration.',
          dueDate: '2025-02-01'
        }
      ]
    }
  ]
};

const analyticsResponse = {
  data: {
    totalExperiments: 5,
    completedExperiments: 2,
    runningExperiments: 1,
    failedExperiments: 0,
    avgDuration: 48,
    avgCost: 3200,
    overdueExperiments: 1
  }
};

test.describe('Experiment Tracker Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/experiments/templates**', route =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(templatesResponse)
      })
    );

    await page.route('**/api/experiments/analytics**', route =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(analyticsResponse)
      })
    );

    await page.route('**/api/experiments**', route =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(experimentsResponse)
      })
    );

    await loginAsDemo(page);
    await page.goto('/experiment-tracker');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/experiment-tracker$/);
  });

  test('displays dashboard overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Experiment Planner & Tracker' })).toBeVisible();
    await expect(page.getByText('Plan, track, and manage your research experiments')).toBeVisible();
    await expect(page.getByText('Total Experiments')).toBeVisible();
    await expect(page.getByText('Running')).toBeVisible();
  });

  test('shows experiment filters in Experiments tab', async ({ page }) => {
    const experimentsTab = page.locator('main').locator('nav').getByRole('button', { name: 'Experiments' });
    await experimentsTab.click();
    await expect(page.getByPlaceholder('Search experiments...')).toBeVisible();
    await expect(experimentsTab).toHaveClass(/border-blue-500/);
  });

  test('activates templates tab', async ({ page }) => {
    const templatesTab = page.locator('main').locator('nav').getByRole('button', { name: 'Templates' });
    await templatesTab.click();
    await expect(templatesTab).toHaveClass(/border-blue-500/);
  });

  test('shows analytics view', async ({ page }) => {
    const analyticsTab = page.locator('main').locator('nav').getByRole('button', { name: 'Analytics' });
    await analyticsTab.click();
    await expect(analyticsTab).toHaveClass(/border-blue-500/);
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
  });
});

