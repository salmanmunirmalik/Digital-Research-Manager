import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

const experimentsResponse = [
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
];

const templatesResponse = [
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
];

const analyticsResponse = {
  total_experiments: 5,
  completed_experiments: 2,
  running_experiments: 1,
  failed_experiments: 0,
  avg_duration: 48,
  avg_cost: 3200,
  overdue_experiments: 1
};

test.describe('Experiment Tracker Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/experiments/templates**', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(templatesResponse)
      })
    );

    await page.route('**/api/experiments/analytics**', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(analyticsResponse)
      })
    );

    await page.route('**/api/experiments**', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(experimentsResponse)
      })
    );

    await loginAsDemo(page);
    await page.goto('/experiment-tracker');
    await expect(page.getByRole('heading', { name: 'Experiments', exact: true })).toBeVisible({
      timeout: 15000
    });
  });

  test('displays dashboard overview', async ({ page }) => {
    await expect(page.getByText(/Plan and track experiment lifecycle/i)).toBeVisible();
    await expect(page.getByText('Total experiments')).toBeVisible();
    await expect(page.getByText('Running', { exact: true })).toBeVisible();
  });

  test('shows experiment filters in Experiments tab', async ({ page }) => {
    const experimentsTab = page.getByRole('navigation', { name: 'Experiments sections' }).getByRole('button', {
      name: 'Experiments'
    });
    await experimentsTab.click();
    await expect(page.getByPlaceholder('Search experiments...')).toBeVisible();
  });

  test('activates templates tab', async ({ page }) => {
    const templatesTab = page.getByRole('navigation', { name: 'Experiments sections' }).getByRole('button', {
      name: 'Templates'
    });
    await templatesTab.click();
    await expect(page.getByText(/Templates are reusable experiment plans/i)).toBeVisible();
  });

  test('shows analytics view', async ({ page }) => {
    const analyticsTab = page.getByRole('navigation', { name: 'Experiments sections' }).getByRole('button', {
      name: 'Analytics'
    });
    await analyticsTab.click();
    // With analytics data present, show metrics (not empty-state "Analytics Dashboard")
    await expect(page.getByText('Success Rate')).toBeVisible();
    await expect(page.getByText('Avg Duration')).toBeVisible();
  });
});
