import { Page, expect } from '@playwright/test';

export const DEMO_EMAIL = 'researcher@researchlab.com';
export const DEMO_PASSWORD = 'researcher123';

export const loginAsDemo = async (page: Page) => {
  await page.goto('/login');
  await page.fill('#email', DEMO_EMAIL);
  await page.fill('#password', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  // App post-login landing is dashboard (not lab-notebook)
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
};
