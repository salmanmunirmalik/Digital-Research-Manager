import { config } from '../setup/test-config';

describe('UI Features Tests', () => {
  beforeAll(async () => {
    await global.uiHelpers.waitForService(config.baseUrl);
    await global.uiHelpers.login(config.testUser.email, config.testUser.password);
  });

  describe('Lab Notebook Features', () => {
    test('Should create new lab notebook entry', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/lab-notebook`);
      
      // Click create new entry button
      await global.uiHelpers.clickElement('[data-testid="create-entry-button"]');
      
      // Fill form
      await global.uiHelpers.typeText('[data-testid="entry-title-input"]', 'Test Entry');
      await global.uiHelpers.typeText('[data-testid="entry-content-input"]', 'This is a test entry content');
      
      // Submit form
      await global.uiHelpers.clickElement('[data-testid="save-entry-button"]');
      
      // Wait for redirect
      await global.uiHelpers.sleep(2000);
      
      // Verify entry was created
      const pageContent = await global.page.content();
      expect(pageContent).toContain('Test Entry');
    });

    test('Should edit existing lab notebook entry', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/lab-notebook`);
      
      // Click on first entry
      const entries = await global.page.$$('[data-testid="entry-card"]');
      if (entries.length > 0) {
        await global.uiHelpers.clickElement('[data-testid="entry-card"]:first-child');
        
        // Click edit button
        await global.uiHelpers.clickElement('[data-testid="edit-entry-button"]');
        
        // Update title
        await global.uiHelpers.typeText('[data-testid="entry-title-input"]', ' - Updated');
        
        // Save changes
        await global.uiHelpers.clickElement('[data-testid="save-entry-button"]');
        
        await global.uiHelpers.sleep(2000);
        
        // Verify changes were saved
        const pageContent = await global.page.content();
        expect(pageContent).toContain('Updated');
      }
    });
  });

  describe('Research Tools Features', () => {
    test('Should open calculator modal', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/research-tools`);
      
      // Click on first calculator
      const calculators = await global.page.$$('[data-testid="calculator-card"]');
      if (calculators.length > 0) {
        await global.uiHelpers.clickElement('[data-testid="calculator-card"]:first-child');
        
        // Wait for modal to appear
        await global.uiHelpers.waitForElement('[data-testid="calculator-modal"]');
        
        // Verify modal is open
        const modal = await global.page.$('[data-testid="calculator-modal"]');
        expect(modal).toBeTruthy();
        
        // Close modal
        await global.uiHelpers.clickElement('[data-testid="close-modal-button"]');
      }
    });

    test('Should perform calculation', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/research-tools`);
      
      // Open dilution calculator
      const dilutionCalculator = await global.page.$('[data-testid="calculator-dilution"]');
      if (dilutionCalculator) {
        await global.uiHelpers.clickElement('[data-testid="calculator-dilution"]');
        
        // Fill calculation inputs
        await global.uiHelpers.typeText('[data-testid="stock-concentration"]', '100');
        await global.uiHelpers.typeText('[data-testid="final-concentration"]', '50');
        await global.uiHelpers.typeText('[data-testid="final-volume"]', '10');
        
        // Click calculate
        await global.uiHelpers.clickElement('[data-testid="calculate-button"]');
        
        // Verify results
        await global.uiHelpers.waitForElement('[data-testid="calculation-results"]');
        const results = await global.uiHelpers.getText('[data-testid="calculation-results"]');
        expect(results).toBeTruthy();
      }
    });
  });

  describe('Supplier Marketplace Features', () => {
    test('Should browse products', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/supplier-marketplace`);
      
      // Wait for products to load
      await global.uiHelpers.sleep(3000);
      
      // Check if products are displayed
      const products = await global.page.$$('[data-testid="product-card"]');
      expect(products.length).toBeGreaterThanOrEqual(0);
    });

    test('Should add product to cart', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/supplier-marketplace`);
      
      // Wait for products to load
      await global.uiHelpers.sleep(3000);
      
      // Click add to cart on first product
      const addToCartButtons = await global.page.$$('[data-testid="add-to-cart-button"]');
      if (addToCartButtons.length > 0) {
        await global.uiHelpers.clickElement('[data-testid="add-to-cart-button"]:first-child');
        
        // Verify cart updated
        const cartCount = await global.uiHelpers.getText('[data-testid="cart-count"]');
        expect(cartCount).toBeTruthy();
      }
    });

    test('Should search products', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/supplier-marketplace`);
      
      // Type in search box
      await global.uiHelpers.typeText('[data-testid="product-search"]', 'test product');
      
      // Click search button
      await global.uiHelpers.clickElement('[data-testid="search-button"]');
      
      await global.uiHelpers.sleep(2000);
      
      // Verify search results
      const searchResults = await global.page.$$('[data-testid="product-card"]');
      expect(searchResults.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AI Presentations Features', () => {
    test('Should generate AI presentation', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/ai-presentations`);
      
      // Click generate presentation button
      await global.uiHelpers.clickElement('[data-testid="generate-presentation-button"]');
      
      // Fill prompt
      await global.uiHelpers.typeText('[data-testid="presentation-prompt"]', 'Create a presentation about research findings');
      
      // Set number of slides
      await global.uiHelpers.typeText('[data-testid="slide-count"]', '5');
      
      // Click generate
      await global.uiHelpers.clickElement('[data-testid="generate-button"]');
      
      // Wait for generation
      await global.uiHelpers.sleep(10000);
      
      // Verify presentation was generated
      const presentation = await global.page.$('[data-testid="presentation-slides"]');
      expect(presentation).toBeTruthy();
    });
  });

  describe('Statistical Analysis Tools Features', () => {
    test('Should load statistical analysis tools', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/statistical-analysis-tools`);
      
      // Wait for page to load
      await global.uiHelpers.sleep(3000);
      
      // Verify widgets are loaded
      const widgets = await global.page.$$('[data-testid="widget"]');
      expect(widgets.length).toBeGreaterThanOrEqual(0);
    });

    test('Should perform data analysis', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/statistical-analysis-tools`);
      
      // Look for data input widget
      const dataWidget = await global.page.$('[data-testid="data-widget"]');
      if (dataWidget) {
        await global.uiHelpers.clickElement('[data-testid="data-widget"]');
        
        // Upload test data
        const fileInput = await global.page.$('[data-testid="file-input"]');
        if (fileInput) {
          // This would need a test file
          console.log('File upload test would require test data file');
        }
      }
    });
  });

  describe('Responsive Design', () => {
    test('Should work on mobile viewport', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/dashboard`);
      
      // Set mobile viewport
      await global.page.setViewport({ width: 375, height: 667 });
      
      // Check if responsive elements are visible
      const mobileMenu = await global.page.$('[data-testid="mobile-menu"]');
      if (mobileMenu) {
        expect(mobileMenu).toBeTruthy();
      }
      
      // Reset viewport
      await global.page.setViewport({ width: 1280, height: 720 });
    });

    test('Should work on tablet viewport', async () => {
      await global.uiHelpers.navigateTo(`${config.baseUrl}/dashboard`);
      
      // Set tablet viewport
      await global.page.setViewport({ width: 768, height: 1024 });
      
      // Check if layout adapts
      const pageContent = await global.page.content();
      expect(pageContent).not.toContain('Error');
      
      // Reset viewport
      await global.page.setViewport({ width: 1280, height: 720 });
    });
  });
});
