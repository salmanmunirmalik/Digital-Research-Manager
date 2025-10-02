import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from './test-config';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });
  page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser Console Error:', msg.text());
    }
  });
  
  // Handle page errors
  page.on('pageerror', error => {
    console.error('Page Error:', error.message);
  });
  
  // Handle request failures
  page.on('requestfailed', request => {
    console.error('Request Failed:', request.url(), request.failure()?.errorText);
  });
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

// Make page and browser available to tests
global.browser = browser;
global.page = page;

// Helper functions for UI testing
global.uiHelpers = {
  async navigateTo(url: string) {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: config.timeouts.long });
  },
  
  async waitForElement(selector: string, timeout: number = config.timeouts.medium) {
    await page.waitForSelector(selector, { timeout });
  },
  
  async clickElement(selector: string) {
    await page.waitForSelector(selector);
    await page.click(selector);
  },
  
  async typeText(selector: string, text: string) {
    await page.waitForSelector(selector);
    await page.type(selector, text);
  },
  
  async getText(selector: string): Promise<string> {
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    return element ? await page.evaluate(el => el.textContent, element) : '';
  },
  
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({ 
      path: `./test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  },
  
  async login(email: string, password: string) {
    await this.navigateTo(`${config.baseUrl}/login`);
    await this.typeText('input[name="email"]', email);
    await this.typeText('input[name="password"]', password);
    await this.clickElement('button[type="submit"]');
    await this.waitForElement('[data-testid="dashboard"]', config.timeouts.long);
  },
  
  async waitForNavigation() {
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  },
};
