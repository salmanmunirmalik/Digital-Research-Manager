import { test, expect } from '@playwright/test';
import { loginAsDemo, DEMO_EMAIL, DEMO_PASSWORD } from './utils/auth';

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5002';

test.describe('Authentication', () => {
  test('displays login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'invalid@email.com');
    await page.fill('#password', 'nottherightpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByTestId('login-error')).toContainText(/error/i);
  });

  test('logs in with demo credentials', async ({ page }) => {
    await loginAsDemo(page);
  });

  test('logs out successfully', async ({ page }) => {
    await loginAsDemo(page);
    await page.getByTestId('user-menu-toggle').click();
    await page.getByTestId('sign-out-button').click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#email')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page);
  });

  test('opens lab notebook from sidebar', async ({ page }) => {
    await page.getByTestId('side-nav').getByRole('link', { name: 'Lab Notebook' }).click();
    await expect(page.getByTestId('lab-notebook-heading')).toBeVisible();
  });

  test('opens protocol library from sidebar', async ({ page }) => {
    await page.getByTestId('side-nav').getByRole('link', { name: 'Protocols' }).click();
    await expect(page).toHaveURL(/\/protocols$/);
    await expect(page.getByRole('heading', { name: 'Protocol Library' })).toBeVisible();
  });
});

test.describe('API Smoke', () => {
  test('health endpoint responds', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
  });

  test('demo login returns token', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.user).toBeDefined();
  });
});
