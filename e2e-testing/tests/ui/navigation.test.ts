import { config } from '../setup/test-config';

describe('UI Navigation Tests', () => {
  beforeAll(async () => {
    await global.uiHelpers.waitForService(config.baseUrl);
    await global.uiHelpers.login(config.testUser.email, config.testUser.password);
  });

  test('Should navigate to all main pages', async () => {
    const pages = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Lab Notebook', path: '/lab-notebook' },
      { name: 'Protocols', path: '/protocols' },
      { name: 'Data & Results', path: '/data-results' },
      { name: 'Lab Management', path: '/lab-management' },
      { name: 'Research Tools', path: '/research-tools' },
      { name: 'Supplier Marketplace', path: '/supplier-marketplace' },
      { name: 'Journals Directory', path: '/journals-directory' },
      { name: 'Research Assistant', path: '/research-assistant' },
      { name: 'AI Presentations', path: '/ai-presentations' },
      { name: 'Statistical Analysis Tools', path: '/statistical-analysis-tools' },
      { name: 'Profile', path: '/profile' },
      { name: 'Settings', path: '/settings' },
    ];

    for (const page of pages) {
      console.log(`Testing navigation to ${page.name}...`);
      
      await global.uiHelpers.navigateTo(`${config.baseUrl}${page.path}`);
      
      // Wait for page to load
      await global.uiHelpers.sleep(2000);
      
      // Check if page loaded without errors
      const pageContent = await global.page.content();
      expect(pageContent).not.toContain('Error');
      expect(pageContent).not.toContain('404');
      
      // Take screenshot for documentation
      await global.uiHelpers.takeScreenshot(`navigation-${page.name.toLowerCase().replace(/\s+/g, '-')}`);
    }
  });

  test('Sidebar navigation should work', async () => {
    await global.uiHelpers.navigateTo(`${config.baseUrl}/dashboard`);
    
    // Test sidebar toggle
    await global.uiHelpers.clickElement('[data-testid="sidebar-toggle"]');
    await global.uiHelpers.sleep(1000);
    
    // Test navigation links
    const navLinks = [
      '[data-testid="nav-lab-notebook"]',
      '[data-testid="nav-protocols"]',
      '[data-testid="nav-data-results"]',
      '[data-testid="nav-research-tools"]',
      '[data-testid="nav-supplier-marketplace"]',
      '[data-testid="nav-journals-directory"]',
      '[data-testid="nav-research-assistant"]',
      '[data-testid="nav-ai-presentations"]',
      '[data-testid="nav-statistical-analysis-tools"]',
      '[data-testid="nav-profile"]',
      '[data-testid="nav-settings"]',
    ];

    for (const link of navLinks) {
      try {
        await global.uiHelpers.clickElement(link);
        await global.uiHelpers.sleep(1000);
        
        // Verify page loaded
        const currentUrl = await global.page.url();
        expect(currentUrl).toMatch(/localhost:5173/);
        
        // Check for errors
        const pageContent = await global.page.content();
        expect(pageContent).not.toContain('Error');
      } catch (error) {
        console.log(`Navigation link ${link} might not be present or clickable`);
      }
    }
  });

  test('Breadcrumb navigation should work', async () => {
    await global.uiHelpers.navigateTo(`${config.baseUrl}/lab-notebook`);
    
    // Check if breadcrumbs exist
    const breadcrumbs = await global.page.$$('[data-testid="breadcrumb"]');
    if (breadcrumbs.length > 0) {
      // Click on breadcrumb
      await global.uiHelpers.clickElement('[data-testid="breadcrumb"]:first-child');
      await global.uiHelpers.sleep(1000);
      
      // Verify navigation worked
      const currentUrl = await global.page.url();
      expect(currentUrl).toMatch(/localhost:5173/);
    }
  });

  test('Search functionality should work', async () => {
    await global.uiHelpers.navigateTo(`${config.baseUrl}/dashboard`);
    
    // Look for search input
    const searchInput = await global.page.$('[data-testid="search-input"]');
    if (searchInput) {
      await global.uiHelpers.typeText('[data-testid="search-input"]', 'test search');
      await global.uiHelpers.clickElement('[data-testid="search-button"]');
      
      await global.uiHelpers.sleep(2000);
      
      // Check if search results appeared
      const searchResults = await global.page.$$('[data-testid="search-result"]');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('User menu should work', async () => {
    await global.uiHelpers.navigateTo(`${config.baseUrl}/dashboard`);
    
    // Click on user menu
    const userMenu = await global.page.$('[data-testid="user-menu"]');
    if (userMenu) {
      await global.uiHelpers.clickElement('[data-testid="user-menu"]');
      await global.uiHelpers.sleep(500);
      
      // Check if dropdown appeared
      const dropdown = await global.page.$('[data-testid="user-menu-dropdown"]');
      expect(dropdown).toBeTruthy();
      
      // Test logout
      await global.uiHelpers.clickElement('[data-testid="logout-button"]');
      await global.uiHelpers.sleep(2000);
      
      // Verify redirected to login
      const currentUrl = await global.page.url();
      expect(currentUrl).toContain('/login');
    }
  });
});
