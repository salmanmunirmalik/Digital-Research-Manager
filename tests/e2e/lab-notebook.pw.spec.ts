import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

test.describe('Lab Notebook Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('shows lab notebook overview', async ({ page }) => {
    await expect(page.getByTestId('lab-notebook-heading')).toBeVisible();
    await expect(page.getByText('Start Entries')).toBeVisible();
    await expect(page.getByText('Lab Notebook Entries')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sample Experiment' })).toBeVisible();
  });

  test('supports entry search interaction', async ({ page }) => {
    await page.getByPlaceholder('Search entries...').fill('Sample');
    await expect(page.getByRole('heading', { name: 'Sample Experiment' })).toBeVisible();
  });

  test('shows entry type selections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Experiment', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Idea', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sample Management', exact: true })).toBeVisible();
  });
});

