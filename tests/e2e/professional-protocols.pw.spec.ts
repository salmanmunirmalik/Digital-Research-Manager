import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

test.describe('Professional Protocols Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByTestId('side-nav').getByRole('link', { name: 'Protocols' }).click();
    await expect(page).toHaveURL(/\/protocols$/);
  });

  test('renders protocol library overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Protocol Library' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Protocol' })).toBeVisible();
    await expect(page.getByRole('heading', {
      name: 'Western Blotting: Protein Detection & Quantification'
    })).toBeVisible();
  });

  test('filters protocols using search', async ({ page }) => {
    await page.getByPlaceholder('Search protocols...').fill('Western');
    await expect(page.getByRole('heading', {
      name: 'Western Blotting: Protein Detection & Quantification'
    })).toBeVisible();
  });

  test('opens protocol detail modal', async ({ page }) => {
    await page.getByRole('button', { name: 'View Protocol' }).first().click();
    await expect(page.getByRole('heading', { name: 'Objective' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Materials & Equipment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Protocol Info' })).toBeVisible();
  });
});

