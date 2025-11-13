import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

const trainingStatusMock = {
  trained: true,
  last_trained: '2025-01-01T12:00:00Z',
  documents: {
    projects: 5,
    notebooks: 12,
    papers: 8,
    protocols: 3,
    research_data: 4,
    negative_results: 1
  },
  insights: {
    strengths: ['Molecular biology expertise'],
    gaps: ['Needs more protocol data'],
    recommended_actions: ['Upload recent experiment results']
  },
  usage_metrics: {
    total_queries: 42,
    average_response_time_ms: 540,
    satisfaction_score: 4.6
  }
};

const chatAnswer =
  'Design a controlled experiment by identifying your independent and dependent variables, establishing controls, and documenting reproducible procedures.';

const libraryPapersMock = [
  {
    id: 'paper-001',
    title: 'AI-Driven Experiment Design',
    authors: [{ firstName: 'Ada', lastName: 'Lovelace' }],
    journal: 'Science Advances',
    year: 2024,
    ai_summary: 'Explains how AI assists with experiment planning.',
    tags: ['AI', 'Experiment Design'],
    save_type: 'full',
    read_status: 'in_progress',
    is_favorite: true,
    url: 'https://example.com/paper-001'
  }
];

const fetchedPaperMock = {
  title: 'The Future of Laboratory Automation',
  authors: [
    { firstName: 'Grace', lastName: 'Hopper' },
    { firstName: 'Alan', lastName: 'Turing' }
  ],
  journal: 'Nature Labs',
  year: 2025,
  abstract: 'Discusses automation strategies for modern research labs.'
};

test.describe('Research Assistant Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);

    await page.route('**/api/ai-training/training-status**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(trainingStatusMock)
      });
    });

    await page.route('**/api/papers/my-papers**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(libraryPapersMock)
      });
    });

    await page.route('**/api/ai-training/chat**', async (route) => {
      const { postDataJSON } = route.request();
      const answer = `${chatAnswer}\n\nYou asked: ${postDataJSON?.question ?? ''}`;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer })
      });
    });

    await page.route('**/api/papers/fetch**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fetchedPaperMock)
      });
    });

    await page.route('**/api/papers/save-paper**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/papers/fetch-by-orcid**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 7 })
      });
    });

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.goto('/research-assistant');
    await page.waitForLoadState('networkidle');
  });

  test('shows AI assistant overview and handles chat submission', async ({ page }) => {
    await expect(page.getByTestId('assistant-tab-panel')).toBeVisible();
    const assistantHeading = page
      .getByTestId('assistant-tab-panel')
      .locator('h3')
      .filter({ hasText: 'AI Research Assistant' })
      .first();
    await expect(assistantHeading).toBeVisible();
    const chatInput = page.getByPlaceholder('Ask me anything about your research...');
    await expect(chatInput).toBeVisible();

    await chatInput.fill('How do I design a controlled experiment?');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(
      page.getByTestId('assistant-chat-history').getByText('AI Assistant')
    ).toBeVisible();
    await expect(
      page.getByTestId('assistant-chat-history')
    ).toContainText('Design a controlled experiment');
  });

  test('displays literature tab and renders library content', async ({ page }) => {
    await page.getByTestId('research-assistant-tab-literature-papers').click();
    await expect(page.getByTestId('literature-tab-panel')).toBeVisible();
    await expect(
      page.getByTestId('literature-header').getByRole('heading', { name: 'Literature & Papers' })
    ).toBeVisible();

    await page.getByTestId('paper-subtabs').getByRole('button', { name: 'My Library' }).click();
    await expect(page.getByTestId('paper-library-view')).toContainText('AI-Driven Experiment Design');
    await expect(page.getByTestId('paper-library-view')).toContainText('AI Summary');
    await expect(page.getByRole('link', { name: 'View' })).toHaveAttribute('href', /paper-001/);
  });

  test('fetches a paper manually and supports ORCID import', async ({ page }) => {
    await page.getByTestId('research-assistant-tab-literature-papers').click();
    await page.getByTestId('literature-header').getByRole('button', { name: 'Add Paper' }).click();
    await expect(page.getByTestId('paper-add-view')).toBeVisible();

    await page.getByPlaceholder('e.g., 10.1038/nature12373 or PMID:23722158').fill('10.1000/example');
    await page.getByRole('button', { name: 'Fetch' }).click();
    await expect(page.getByText('The Future of Laboratory Automation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save to Library' })).toBeEnabled();
    await page.getByRole('button', { name: 'Save to Library' }).click();

    await page.getByRole('button', { name: 'Import from ORCID' }).click();
    await expect(page.getByTestId('orcid-modal')).toBeVisible();
    await page.fill('input[placeholder*="0000-0002"]', '0000-0002-1825-0097');
    await page.getByTestId('orcid-modal-submit').click();
    await expect(page.getByTestId('orcid-modal')).not.toBeVisible();
  });
});

