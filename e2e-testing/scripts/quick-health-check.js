#!/usr/bin/env node

// Quick Health Check - Simple and Reliable Frontend Testing
// This script provides immediate feedback without complex browser automation

const http = require('http');
const https = require('https');

class QuickHealthChecker {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            url: url
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async checkPageHealth(pageName, url) {
    console.log(`🔄 Checking: ${pageName}`);
    
    try {
      const response = await this.makeRequest(url);
      
      // Check HTTP status
      if (response.status !== 200) {
        console.log(`❌ FAIL: ${pageName} - HTTP ${response.status}`);
        return { page: pageName, status: 'FAIL', error: `HTTP ${response.status}` };
      }

      // Check for basic HTML structure
      if (!response.data.includes('<!DOCTYPE html>')) {
        console.log(`❌ FAIL: ${pageName} - No HTML structure`);
        return { page: pageName, status: 'FAIL', error: 'No HTML structure' };
      }

      // Check for script tags (React SPA indicator)
      if (!response.data.includes('<script')) {
        console.log(`❌ FAIL: ${pageName} - No JavaScript files`);
        return { page: pageName, status: 'FAIL', error: 'No JavaScript files' };
      }

      // Check for obvious error patterns
      const errorPatterns = [
        'Error:',
        'SyntaxError',
        'ReferenceError',
        'TypeError',
        'already been declared',
        'does not provide an export'
      ];

      const hasErrors = errorPatterns.some(pattern => 
        response.data.toLowerCase().includes(pattern.toLowerCase())
      );

      if (hasErrors) {
        console.log(`❌ FAIL: ${pageName} - Contains error patterns`);
        return { page: pageName, status: 'FAIL', error: 'Contains error patterns' };
      }

      // Check response time
      const responseTime = Date.now() - this.startTime;
      if (responseTime > 3000) {
        console.log(`⚠️  SLOW: ${pageName} - ${responseTime}ms`);
      } else {
        console.log(`✅ PASS: ${pageName} - ${response.status} (${responseTime}ms)`);
      }

      return { 
        page: pageName, 
        status: 'PASS', 
        responseTime: responseTime,
        statusCode: response.status 
      };

    } catch (error) {
      console.log(`❌ FAIL: ${pageName} - ${error.message}`);
      return { page: pageName, status: 'FAIL', error: error.message };
    }
  }

  async checkCompilationHealth() {
    console.log('🔍 Checking compilation health...');
    
    try {
      // Check if Vite dev server is responding
      const response = await this.makeRequest('http://localhost:5173');
      
      if (response.status !== 200) {
        console.log('❌ FAIL: Vite dev server not responding');
        return false;
      }

      // Check for Vite client script
      if (!response.data.includes('@vite/client')) {
        console.log('❌ FAIL: Vite client not found');
        return false;
      }

      // Check for React refresh
      if (!response.data.includes('@react-refresh')) {
        console.log('⚠️  WARN: React refresh not found');
      }

      console.log('✅ PASS: Compilation health check');
      return true;

    } catch (error) {
      console.log(`❌ FAIL: Compilation check - ${error.message}`);
      return false;
    }
  }

  async runHealthCheck() {
    console.log('⚡ Quick Health Check - Research Lab Platform');
    console.log('==============================================\n');

    // Check compilation health first
    const compilationOk = await this.checkCompilationHealth();
    if (!compilationOk) {
      console.log('\n❌ CRITICAL: Compilation health check failed!');
      console.log('   Fix compilation issues before proceeding.');
      return { passed: 0, failed: 1, critical: true };
    }

    console.log(''); // Empty line

    // Test key pages
    const pages = [
      { name: 'Homepage', url: 'http://localhost:5173' },
      { name: 'Research Tools', url: 'http://localhost:5173/research-tools' },
      { name: 'AI Presentations', url: 'http://localhost:5173/ai-presentations' },
      { name: 'Statistical Analysis Tools', url: 'http://localhost:5173/statistical-analysis-tools' },
      { name: 'Supplier Marketplace', url: 'http://localhost:5173/supplier-marketplace' },
      { name: 'Journals Directory', url: 'http://localhost:5173/journals-directory' },
      { name: 'Personal NoteBook', url: 'http://localhost:5173/lab-notebook' },
      { name: 'Data Results', url: 'http://localhost:5173/data-results' },
    ];

    let passed = 0;
    let failed = 0;

    for (const page of pages) {
      const result = await this.checkPageHealth(page.name, page.url);
      this.results.push(result);
      
      if (result.status === 'PASS') {
        passed++;
      } else {
        failed++;
      }
    }

    return { passed, failed, critical: false };
  }

  generateReport(results) {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n📊 Quick Health Check Report');
    console.log('==============================');
    console.log(`⏱️  Total Time: ${totalTime}s`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.passed + results.failed > 0) {
      console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    }

    if (results.critical) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED!');
      console.log('   Fix compilation issues immediately.');
    } else if (results.failed > 0) {
      console.log('\n⚠️  Some pages have issues:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.page}: ${r.error}`));
    } else {
      console.log('\n🎉 All pages are healthy!');
    }

    console.log('\n💡 Next Steps:');
    if (results.failed > 0) {
      console.log('   1. Fix the issues listed above');
      console.log('   2. Re-run this health check');
      console.log('   3. Use browser-based testing for detailed analysis');
    } else {
      console.log('   1. ✅ Frontend is ready for development');
      console.log('   2. ✅ Run full E2E tests for comprehensive validation');
      console.log('   3. ✅ Deploy with confidence');
    }

    return results;
  }
}

// Main execution
async function main() {
  const checker = new QuickHealthChecker();
  
  try {
    const results = await checker.runHealthCheck();
    checker.generateReport(results);

    // Exit with error code if tests failed
    if (results.failed > 0 || results.critical) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = QuickHealthChecker;
