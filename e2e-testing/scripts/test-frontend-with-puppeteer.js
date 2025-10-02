#!/usr/bin/env node

// Puppeteer-based Frontend Error Detection
// This script actually loads pages in a real browser and detects JavaScript errors

const puppeteer = require('puppeteer');

class FrontendErrorDetector {
  constructor() {
    this.browser = null;
    this.errors = [];
    this.warnings = [];
    this.results = [];
  }

  async init() {
    console.log('🚀 Launching browser for frontend testing...');
    this.browser = await puppeteer.launch({
      headless: true,
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
  }

  async testPage(pageName, url) {
    console.log(`🔄 Testing: ${pageName}`);
    
    const page = await this.browser.newPage();
    const pageErrors = [];
    const pageWarnings = [];
    const networkErrors = [];

    // Capture console errors and warnings
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(`Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        pageWarnings.push(`Console Warning: ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(`Page Error: ${error.message}`);
    });

    // Capture request failures
    page.on('requestfailed', request => {
      networkErrors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });

    try {
      // Navigate to the page
      const response = await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Check response status
      if (!response.ok()) {
        pageErrors.push(`HTTP Error: ${response.status()} ${response.statusText()}`);
      }

      // Wait a bit for any async errors to surface
      await page.waitForTimeout(2000);

      // Check for common error patterns in the page content
      const content = await page.content();
      const contentErrors = this.detectContentErrors(content, pageName);

      // Check if React app actually loaded
      const reactLoaded = await this.checkReactAppLoaded(page);

      const result = {
        page: pageName,
        url: url,
        status: response.status(),
        reactLoaded: reactLoaded,
        errors: [...pageErrors, ...contentErrors],
        warnings: pageWarnings,
        networkErrors: networkErrors,
        hasErrors: pageErrors.length > 0 || contentErrors.length > 0 || networkErrors.length > 0,
        contentLength: content.length
      };

      this.results.push(result);

      // Log result
      if (result.hasErrors) {
        console.log(`❌ FAIL: ${pageName} has ${result.errors.length} errors`);
        result.errors.forEach(error => console.log(`   - ${error}`));
        if (result.warnings.length > 0) {
          console.log(`   Warnings: ${result.warnings.length}`);
        }
      } else {
        console.log(`✅ PASS: ${pageName} loads without errors`);
        if (result.warnings.length > 0) {
          console.log(`   Warnings: ${result.warnings.length} (non-critical)`);
        }
      }

      return result;

    } catch (error) {
      const result = {
        page: pageName,
        url: url,
        status: 0,
        reactLoaded: false,
        errors: [`Navigation Error: ${error.message}`],
        warnings: [],
        networkErrors: [],
        hasErrors: true,
        contentLength: 0
      };

      this.results.push(result);
      console.log(`❌ FAIL: ${pageName} - ${error.message}`);
      return result;

    } finally {
      await page.close();
    }
  }

  detectContentErrors(content, pageName) {
    const errors = [];
    
    // Common error patterns
    const errorPatterns = [
      { pattern: /Error:/gi, message: 'Contains "Error:"' },
      { pattern: /SyntaxError/gi, message: 'Contains "SyntaxError"' },
      { pattern: /ReferenceError/gi, message: 'Contains "ReferenceError"' },
      { pattern: /TypeError/gi, message: 'Contains "TypeError"' },
      { pattern: /Cannot resolve module/gi, message: 'Module resolution error' },
      { pattern: /Module not found/gi, message: 'Module not found error' },
      { pattern: /Failed to compile/gi, message: 'Compilation failed' },
      { pattern: /ChunkLoadError/gi, message: 'Chunk loading error' },
      { pattern: /Loading chunk .* failed/gi, message: 'Chunk loading failed' },
    ];

    errorPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        errors.push(`Content Error: ${message}`);
      }
    });

    // Check for empty React root (common issue)
    if (content.includes('<div id="root"></div>') && !content.includes('React')) {
      errors.push('Content Error: Empty React root - app may not have loaded');
    }

    // Check for missing scripts
    if (!content.includes('script')) {
      errors.push('Content Error: No JavaScript files found');
    }

    return errors;
  }

  async checkReactAppLoaded(page) {
    try {
      // Check if React DevTools is available (indicates React loaded)
      const reactLoaded = await page.evaluate(() => {
        return !!(window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
      });

      // Also check if the root div has content
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.children.length > 0 : false;
      });

      return reactLoaded || rootContent;
    } catch (error) {
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => !r.hasErrors).length;
    const failedTests = this.results.filter(r => r.hasErrors).length;

    console.log('\n📊 Frontend Error Detection Report');
    console.log('=====================================');
    console.log(`Total Pages Tested: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.hasErrors).forEach(result => {
        console.log(`\n${result.page}:`);
        result.errors.forEach(error => console.log(`  - ${error}`));
        if (result.warnings.length > 0) {
          console.log(`  Warnings: ${result.warnings.length}`);
        }
      });
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: this.results
    };
  }
}

// Main execution
async function main() {
  const detector = new FrontendErrorDetector();
  
  try {
    await detector.init();

    const pages = [
      { name: 'Homepage', url: 'http://localhost:5173' },
      { name: 'Research Tools', url: 'http://localhost:5173/research-tools' },
      { name: 'Supplier Marketplace', url: 'http://localhost:5173/supplier-marketplace' },
      { name: 'Journals Directory', url: 'http://localhost:5173/journals-directory' },
      { name: 'AI Presentations', url: 'http://localhost:5173/ai-presentations' },
      { name: 'Statistical Analysis Tools', url: 'http://localhost:5173/statistical-analysis-tools' },
      { name: 'Lab Notebook', url: 'http://localhost:5173/lab-notebook' },
      { name: 'Data Results', url: 'http://localhost:5173/data-results' },
      { name: 'Login Page', url: 'http://localhost:5173/login' },
      { name: 'Register Page', url: 'http://localhost:5173/register' },
    ];

    console.log('🧪 Testing All Frontend Pages for JavaScript Errors\n');

    for (const page of pages) {
      await detector.testPage(page.name, page.url);
    }

    const report = detector.generateReport();

    // Exit with error code if any tests failed
    if (report.failedTests > 0) {
      process.exit(1);
    } else {
      console.log('\n🎉 All pages load without JavaScript errors!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await detector.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FrontendErrorDetector;
