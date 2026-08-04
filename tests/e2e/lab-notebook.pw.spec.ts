import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

test.describe('Personal NoteBook Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole('link', { name: 'Personal notebook' }).click();
    await expect(page).toHaveURL(/\/lab-notebook/);
    await expect(page.getByTestId('lab-notebook-heading')).toBeVisible();
  });

  test('shows Personal NoteBook overview', async ({ page }) => {
    await expect(page.getByText('New notebook entry')).toBeVisible();
    await expect(page.getByTestId('lab-notebook-heading')).toHaveText(/Notebook entries/i);
  });

  test('supports entry search interaction', async ({ page }) => {
    const search = page.getByPlaceholder('Search entries...');
    await expect(search).toBeVisible();
    await search.fill('Sample');
    // Re-query after controlled input update (null tags previously crashed the page)
    await expect(page.getByPlaceholder('Search entries...')).toHaveValue('Sample');
  });

  test('shows entry type selections', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Experiment note', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Idea', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Results note', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Problem', exact: true })).toBeVisible();
  });
});
