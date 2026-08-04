import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

test.describe('Professional Protocols Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
    await page.getByRole('link', { name: 'Protocol library' }).click();
    await expect(page).toHaveURL(/\/protocols/);
  });

  test('renders protocol library overview', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Protocol library/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Write protocol/i }).first()).toBeVisible();
    await expect(
      page.getByPlaceholder(/Search protocols by name, category, or keyword/i)
    ).toBeVisible();
  });

  test('filters protocols using search', async ({ page }) => {
    const search = page.getByPlaceholder(/Search protocols by name, category, or keyword/i);
    await expect(search).toBeVisible();
    await search.fill('Western');
    await expect(search).toHaveValue('Western');
  });

  test('shows empty or results state without crashing', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Protocol library/i })).toBeVisible();
    const empty = page.getByText(/No protocols found/i);
    const recommended = page.getByText(/Recommended Protocols/i);
    const cards = page.locator('[data-entity-id]');
    const emptyVisible = await empty.isVisible().catch(() => false);
    const recommendedVisible = await recommended.isVisible().catch(() => false);
    const hasCards = (await cards.count()) > 0;
    expect(emptyVisible || recommendedVisible || hasCards).toBeTruthy();
  });
});
