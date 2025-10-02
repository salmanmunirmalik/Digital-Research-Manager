#!/usr/bin/env node

// Enhanced Frontend Testing with Real-Time Error Detection
// This script provides immediate feedback on compilation and runtime errors

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class EnhancedFrontendTester {
  constructor() {
    this.browser = null;
    this.errors = [];
    this.warnings = [];
    this.results = [];
    this.startTime = Date.now();
  }

  async init() {
    console.log('🚀 Launching Enhanced Frontend Testing...');
    this.browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security', // For CORS issues
        '--disable-features=VizDisplayCompositor'
      ],
    });
  }

  async testCompilationErrors() {
    console.log('🔍 Testing for compilation errors...');
    
    const page = await this.browser.newPage();
    const compilationErrors = [];

    // Monitor console for compilation errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('compilation') || 
            text.includes('SyntaxError') || 
            text.includes('ReferenceError') ||
            text.includes('TypeError') ||
            text.includes('already been declared') ||
            text.includes('does not provide an export')) {
          compilationErrors.push(text);
        }
      }
    });

    try {
      // Navigate to homepage to trigger compilation
      await page.goto('http://localhost:5173', { 
        waitUntil: 'networkidle0', 
        timeout: 10000 
      });

      // Wait for any compilation errors to surface
      await page.waitForTimeout(3000);

      if (compilationErrors.length > 0) {
        console.log('❌ COMPILATION ERRORS DETECTED:');
        compilationErrors.forEach(error => {
          console.log(`   - ${error}`);
        });
        return false;
      } else {
        console.log('✅ No compilation errors detected');
        return true;
      }

    } catch (error) {
      console.log(`❌ Navigation failed: ${error.message}`);
      return false;
    } finally {
      await page.close();
    }
  }

  async testPageLoad(pageName, url) {
    console.log(`🔄 Testing: ${pageName}`);
    
    const page = await this.browser.newPage();
    const pageErrors = [];
    const pageWarnings = [];
    const networkErrors = [];

    // Enhanced error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(`Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        pageWarnings.push(`Console Warning: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      pageErrors.push(`Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      networkErrors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });

    try {
      const response = await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      });

      if (!response.ok()) {
        pageErrors.push(`HTTP Error: ${response.status()} ${response.statusText()}`);
      }

      // Wait for React to load
      await page.waitForTimeout(2000);

      // Check if React app loaded
      const reactLoaded = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root && root.children.length > 0;
      });

      // Check for specific error patterns
      const content = await page.content();
      const contentErrors = this.detectSpecificErrors(content, pageName);

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

      // Immediate feedback
      if (result.hasErrors) {
        console.log(`❌ FAIL: ${pageName}`);
        result.errors.slice(0, 3).forEach(error => console.log(`   - ${error}`));
        if (result.errors.length > 3) {
          console.log(`   ... and ${result.errors.length - 3} more errors`);
        }
        return false;
      } else {
        console.log(`✅ PASS: ${pageName} (React: ${reactLoaded ? 'Loaded' : 'Failed'})`);
        return true;
      }

    } catch (error) {
      console.log(`❌ FAIL: ${pageName} - ${error.message}`);
      return false;
    } finally {
      await page.close();
    }
  }

  detectSpecificErrors(content, pageName) {
    const errors = [];
    
    // Specific error patterns we've encountered
    const errorPatterns = [
      { pattern: /already been declared/gi, message: 'Duplicate import declaration' },
      { pattern: /does not provide an export named/gi, message: 'Missing export (icon import error)' },
      { pattern: /SyntaxError/gi, message: 'JavaScript syntax error' },
      { pattern: /ReferenceError/gi, message: 'Undefined variable reference' },
      { pattern: /TypeError/gi, message: 'Type error in JavaScript' },
      { pattern: /Failed to compile/gi, message: 'Compilation failed' },
      { pattern: /ChunkLoadError/gi, message: 'Chunk loading error' },
      { pattern: /Empty React root/gi, message: 'React app failed to render' },
    ];

    errorPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        errors.push(`Content Error: ${message}`);
      }
    });

    // Check for empty React root
    if (content.includes('<div id="root"></div>') && !content.includes('data-reactroot')) {
      errors.push('Content Error: Empty React root - app may not have loaded');
    }

    return errors;
  }

  async runQuickHealthCheck() {
    console.log('⚡ Running Quick Health Check...');
    
    const tests = [
      { name: 'Compilation Check', url: 'http://localhost:5173' },
      { name: 'Research Tools', url: 'http://localhost:5173/research-tools' },
      { name: 'AI Presentations', url: 'http://localhost:5173/ai-presentations' },
      { name: 'Statistical Tools', url: 'http://localhost:5173/statistical-analysis-tools' },
    ];

    let passed = 0;
    let failed = 0;

    // First check compilation
    const compilationOk = await this.testCompilationErrors();
    if (!compilationOk) {
      console.log('❌ COMPILATION FAILED - Stopping tests');
      return { passed: 0, failed: 1, compilationFailed: true };
    }

    // Then test key pages
    for (const test of tests) {
      const success = await this.testPageLoad(test.name, test.url);
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }

    return { passed, failed, compilationFailed: false };
  }

  generateQuickReport(results) {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n📊 Enhanced Testing Report');
    console.log('============================');
    console.log(`⏱️  Total Time: ${totalTime}s`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    if (results.compilationFailed) {
      console.log('\n🚨 CRITICAL: Compilation errors detected!');
      console.log('   Fix compilation issues before running full tests.');
    } else if (results.failed > 0) {
      console.log('\n⚠️  Some tests failed. Check errors above.');
    } else {
      console.log('\n🎉 All tests passed! Frontend is healthy.');
    }

    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new EnhancedFrontendTester();
  
  try {
    await tester.init();
    const results = await tester.runQuickHealthCheck();
    tester.generateQuickReport(results);

    // Exit with error code if tests failed
    if (results.failed > 0 || results.compilationFailed) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await tester.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnhancedFrontendTester;
