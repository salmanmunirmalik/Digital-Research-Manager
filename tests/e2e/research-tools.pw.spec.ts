import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

test.describe('Research Tools Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/research-tools');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/research-tools$/);
  });

  test('displays research tools overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Research Tools Library' })).toBeVisible();
    await expect(page.getByPlaceholder('Search tools...')).toBeVisible();
    await expect(page.getByText('Molecular Biology')).toBeVisible();
    await expect(page.getByText('Biochemistry')).toBeVisible();
  });

  test('filters tools by type', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter Tools' }).click();
    const filterDialog = page.getByRole('dialog');
    await expect(filterDialog.getByRole('heading', { name: 'Tool Filters' })).toBeVisible();
    await filterDialog.getByLabel('Calculator', { exact: true }).check();
    await filterDialog.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page.getByTestId('active-filters').getByText('Type: Calculator')).toBeVisible();
  });

  test('switches between grid and list view', async ({ page }) => {
    await page.getByRole('button', { name: 'List View' }).click();
    await expect(page.getByRole('button', { name: 'List View' })).toHaveClass(/bg-slate-900/);
    await page.getByRole('button', { name: 'Grid View' }).click();
    await expect(page.getByRole('button', { name: 'Grid View' })).toHaveClass(/bg-slate-900/);
  });

  test('opens calculator details drawer', async ({ page }) => {
    await page.getByText('Molar Solution Calculator').click();
    const modal = page.getByRole('dialog');
    await expect(modal.getByRole('heading', { name: 'Molar Solution Calculator' })).toBeVisible();
    await expect(
      modal.getByText('Calculate molar concentration, mass, volume, or molecular weight')
    ).toBeVisible();
  });
});

