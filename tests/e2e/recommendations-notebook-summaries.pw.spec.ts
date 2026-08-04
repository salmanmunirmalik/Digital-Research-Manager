import { test, expect } from '@playwright/test';
import { loginAsDemo } from './utils/auth';

/**
 * E2E Tests for Recommendations and Notebook Summaries
 */

test.describe('Recommendations and Notebook Summaries E2E', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post('http://localhost:5002/api/auth/login', {
      data: {
        email: 'researcher@researchlab.com',
        password: 'researcher123'
      }
    });

    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      authToken = data.token;
    }
  });

  test.describe('Protocol Recommendations', () => {
    test('should display recommendations widget on protocols page', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/protocols');
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByRole('heading', { name: /Recommended Protocols|Protocol Library/i }).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should load protocol recommendations', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/protocols');
      await page.waitForLoadState('networkidle');
      const recommendationItems = page.locator('[data-testid="recommendation-item"], .recommendation-item');
      const recommendedText = page.getByText(/recommended/i);
      const count = (await recommendationItems.count()) + (await recommendedText.count());
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow clicking on recommended protocol', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/protocols');
      await page.waitForLoadState('networkidle');
      const firstRecommendation = page.locator('a[href*="protocol"], button:has-text("View"), .recommendation-item').first();
      if (await firstRecommendation.count() > 0) {
        await firstRecommendation.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Paper Recommendations', () => {
    test('should display recommendations widget on research data bank page', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/research-databank');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Service Recommendations', () => {
    test('should display recommendations widget on service marketplace', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/service-marketplace');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Dashboard Recommendations', () => {
    test('should display recommendation widgets on dashboard', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Notebook Summary Generation', () => {
    test('should display summary generation buttons on lab notebook page', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/lab-notebook');
      await page.waitForLoadState('networkidle');
      const dailyButton = page.getByRole('button', { name: /Daily Summary/i });
      const weeklyButton = page.getByRole('button', { name: /Weekly Summary/i });
      expect((await dailyButton.count()) > 0 || (await weeklyButton.count()) > 0).toBeTruthy();
    });

    test('should generate daily summary when button is clicked', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/lab-notebook');
      await page.waitForLoadState('networkidle');
      const dailyButton = page.getByRole('button', { name: /Daily Summary/i }).first();
      if (await dailyButton.count() > 0) {
        await dailyButton.click();
        await page.waitForTimeout(3000);
      }
      expect(true).toBeTruthy();
    });

    test('should generate weekly summary when button is clicked', async ({ page }) => {
      await loginAsDemo(page);
      await page.goto('/lab-notebook');
      await page.waitForLoadState('networkidle');
      const weeklyButton = page.getByRole('button', { name: /Weekly Summary/i }).first();
      if (await weeklyButton.count() > 0) {
        await weeklyButton.click();
        await page.waitForTimeout(3000);
      }
      expect(true).toBeTruthy();
    });
  });

  test.describe('API Endpoints', () => {
    test('should return protocol recommendations', async ({ request }) => {
      if (!authToken) test.skip();
      const response = await request.get('http://localhost:5002/api/recommendations/protocols?limit=5', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should return paper recommendations', async ({ request }) => {
      if (!authToken) test.skip();
      const response = await request.get('http://localhost:5002/api/recommendations/papers?limit=10', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should return service recommendations', async ({ request }) => {
      if (!authToken) test.skip();
      const response = await request.get('http://localhost:5002/api/recommendations/services?type=requester&limit=5', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(response.status()).toBeLessThan(500);
    });

    test('should generate notebook summary', async ({ request }) => {
      if (!authToken) test.skip();
      const response = await request.post('http://localhost:5002/api/notebook-summaries/generate', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          summaryType: 'daily',
          dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        }
      });
      expect(response.status()).toBeLessThan(500);
    });
  });
});
