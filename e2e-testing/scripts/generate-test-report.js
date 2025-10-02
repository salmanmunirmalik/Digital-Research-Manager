const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');

class TestReportGenerator {
  constructor(reportDir, timestamp) {
    this.reportDir = reportDir;
    this.timestamp = timestamp;
    this.reportData = {
      timestamp: timestamp,
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
      },
      suites: [],
      coverage: {},
      performance: {},
      recommendations: [],
    };
  }

  async generateReport() {
    console.log('📊 Generating comprehensive test report...'.blue);

    try {
      // Collect test results from different suites
      await this.collectTestResults();
      
      // Generate HTML report
      await this.generateHTMLReport();
      
      // Generate JSON report
      await this.generateJSONReport();
      
      // Generate markdown summary
      await this.generateMarkdownSummary();
      
      // Generate performance report
      await this.generatePerformanceReport();
      
      // Generate recommendations
      await this.generateRecommendations();
      
      console.log('✅ Test report generated successfully!'.green);
      console.log(`📄 Report location: ${this.reportDir}/comprehensive-test-report.html`.cyan);
      
    } catch (error) {
      console.error('❌ Error generating test report:'.red, error.message);
      throw error;
    }
  }

  async collectTestResults() {
    const suites = ['api', 'crud', 'ui', 'integration'];
    
    for (const suite of suites) {
      const suiteDir = path.join(this.reportDir, suite);
      if (await fs.pathExists(suiteDir)) {
        const suiteData = await this.parseSuiteResults(suite, suiteDir);
        this.reportData.suites.push(suiteData);
        
        // Update summary
        this.reportData.summary.totalTests += suiteData.totalTests;
        this.reportData.summary.passedTests += suiteData.passedTests;
        this.reportData.summary.failedTests += suiteData.failedTests;
        this.reportData.summary.skippedTests += suiteData.skippedTests;
        this.reportData.summary.duration += suiteData.duration;
      }
    }
  }

  async parseSuiteResults(suiteName, suiteDir) {
    const suiteData = {
      name: suiteName.toUpperCase(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      tests: [],
      coverage: null,
    };

    // Try to parse JUnit XML if available
    const junitFile = path.join(suiteDir, 'junit.xml');
    if (await fs.pathExists(junitFile)) {
      const junitData = await this.parseJUnitXML(junitFile);
      Object.assign(suiteData, junitData);
    }

    // Try to parse HTML report if available
    const htmlFile = path.join(suiteDir, 'test-report.html');
    if (await fs.pathExists(htmlFile)) {
      const htmlData = await this.parseHTMLReport(htmlFile);
      Object.assign(suiteData, htmlData);
    }

    return suiteData;
  }

  async parseJUnitXML(filePath) {
    try {
      const xmlContent = await fs.readFile(filePath, 'utf8');
      // Simple XML parsing - in production, use a proper XML parser
      const testsMatch = xmlContent.match(/tests="(\d+)"/);
      const failuresMatch = xmlContent.match(/failures="(\d+)"/);
      const timeMatch = xmlContent.match(/time="([\d.]+)"/);
      
      const totalTests = testsMatch ? parseInt(testsMatch[1]) : 0;
      const failedTests = failuresMatch ? parseInt(failuresMatch[1]) : 0;
      const duration = timeMatch ? parseFloat(timeMatch[1]) : 0;
      
      return {
        totalTests,
        failedTests,
        passedTests: totalTests - failedTests,
        skippedTests: 0,
        duration,
      };
    } catch (error) {
      console.warn(`Warning: Could not parse JUnit XML from ${filePath}`.yellow);
      return {};
    }
  }

  async parseHTMLReport(filePath) {
    try {
      const htmlContent = await fs.readFile(filePath, 'utf8');
      // Simple HTML parsing - in production, use a proper HTML parser
      const testsMatch = htmlContent.match(/(\d+) tests/);
      const passedMatch = htmlContent.match(/(\d+) passed/);
      const failedMatch = htmlContent.match(/(\d+) failed/);
      
      const totalTests = testsMatch ? parseInt(testsMatch[1]) : 0;
      const passedTests = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failedTests = failedMatch ? parseInt(failedMatch[1]) : 0;
      
      return {
        totalTests,
        passedTests,
        failedTests,
        skippedTests: totalTests - passedTests - failedTests,
      };
    } catch (error) {
      console.warn(`Warning: Could not parse HTML report from ${filePath}`.yellow);
      return {};
    }
  }

  async generateHTMLReport() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report - ${this.timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { padding: 30px; border-bottom: 1px solid #eee; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .number { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #007bff; }
        .suites { padding: 30px; }
        .suite { margin-bottom: 30px; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .suite h3 { margin: 0 0 15px 0; color: #333; }
        .suite-stats { display: flex; gap: 20px; margin-bottom: 15px; }
        .suite-stat { padding: 10px 15px; background: #f8f9fa; border-radius: 4px; }
        .coverage { padding: 30px; background: #f8f9fa; }
        .performance { padding: 30px; }
        .recommendations { padding: 30px; background: #fff3cd; }
        .footer { padding: 20px; text-align: center; color: #666; border-top: 1px solid #eee; }
        .chart { width: 100%; height: 300px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Test Report</h1>
            <p>Generated on ${new Date(this.timestamp).toLocaleString()}</p>
            <p>Research Lab Platform - End-to-End Testing</p>
        </div>
        
        <div class="summary">
            <h2>📊 Test Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="number total">${this.reportData.summary.totalTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Passed</h3>
                    <div class="number passed">${this.reportData.summary.passedTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Failed</h3>
                    <div class="number failed">${this.reportData.summary.failedTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Skipped</h3>
                    <div class="number skipped">${this.reportData.summary.skippedTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Duration</h3>
                    <div class="number total">${this.reportData.summary.duration.toFixed(2)}s</div>
                </div>
                <div class="summary-card">
                    <h3>Success Rate</h3>
                    <div class="number ${this.reportData.summary.failedTests === 0 ? 'passed' : 'failed'}">
                        ${this.reportData.summary.totalTests > 0 ? 
                          ((this.reportData.summary.passedTests / this.reportData.summary.totalTests) * 100).toFixed(1) + '%' : 
                          '0%'
                        }
                    </div>
                </div>
            </div>
        </div>
        
        <div class="suites">
            <h2>🧪 Test Suites</h2>
            ${this.reportData.suites.map(suite => `
                <div class="suite">
                    <h3>${suite.name}</h3>
                    <div class="suite-stats">
                        <div class="suite-stat">Total: ${suite.totalTests}</div>
                        <div class="suite-stat passed">Passed: ${suite.passedTests}</div>
                        <div class="suite-stat failed">Failed: ${suite.failedTests}</div>
                        <div class="suite-stat">Duration: ${suite.duration.toFixed(2)}s</div>
                    </div>
                    <div class="chart">
                        📈 Chart visualization would go here
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="coverage">
            <h2>📈 Code Coverage</h2>
            <div class="chart">
                📊 Coverage data visualization would go here
            </div>
        </div>
        
        <div class="performance">
            <h2>⚡ Performance Metrics</h2>
            <div class="chart">
                📊 Performance metrics visualization would go here
            </div>
        </div>
        
        <div class="recommendations">
            <h2>💡 Recommendations</h2>
            <ul>
                ${this.reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        
        <div class="footer">
            <p>Generated by Research Lab E2E Testing Framework</p>
            <p>Report ID: ${this.timestamp}</p>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.reportDir, 'comprehensive-test-report.html'),
      htmlContent
    );
  }

  async generateJSONReport() {
    await fs.writeFile(
      path.join(this.reportDir, 'test-results.json'),
      JSON.stringify(this.reportData, null, 2)
    );
  }

  async generateMarkdownSummary() {
    const markdownContent = `# Test Report Summary

**Generated:** ${new Date(this.timestamp).toLocaleString()}
**Environment:** ${process.env.ENVIRONMENT || 'local'}

## 📊 Overall Results

- **Total Tests:** ${this.reportData.summary.totalTests}
- **Passed:** ${this.reportData.summary.passedTests} ✅
- **Failed:** ${this.reportData.summary.failedTests} ❌
- **Skipped:** ${this.reportData.summary.skippedTests} ⏭️
- **Duration:** ${this.reportData.summary.duration.toFixed(2)}s
- **Success Rate:** ${this.reportData.summary.totalTests > 0 ? 
      ((this.reportData.summary.passedTests / this.reportData.summary.totalTests) * 100).toFixed(1) + '%' : 
      '0%'
    }

## 🧪 Test Suites

${this.reportData.suites.map(suite => `
### ${suite.name}
- Total: ${suite.totalTests}
- Passed: ${suite.passedTests}
- Failed: ${suite.failedTests}
- Duration: ${suite.duration.toFixed(2)}s
`).join('')}

## 💡 Recommendations

${this.reportData.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by Research Lab E2E Testing Framework*
`;

    await fs.writeFile(
      path.join(this.reportDir, 'test-summary.md'),
      markdownContent
    );
  }

  async generatePerformanceReport() {
    // This would analyze performance metrics from test runs
    this.reportData.performance = {
      averageResponseTime: 0,
      slowestEndpoint: null,
      memoryUsage: 0,
      cpuUsage: 0,
    };
  }

  async generateRecommendations() {
    const recommendations = [];
    
    if (this.reportData.summary.failedTests > 0) {
      recommendations.push('Address failed tests to improve system reliability');
    }
    
    if (this.reportData.summary.duration > 300) {
      recommendations.push('Consider optimizing test execution time');
    }
    
    const failedSuites = this.reportData.suites.filter(suite => suite.failedTests > 0);
    if (failedSuites.length > 0) {
      recommendations.push(`Focus on fixing issues in: ${failedSuites.map(s => s.name).join(', ')}`);
    }
    
    if (this.reportData.summary.totalTests === 0) {
      recommendations.push('No tests were executed - check test configuration');
    }
    
    this.reportData.recommendations = recommendations;
  }
}

// Main execution
async function main() {
  const reportDir = process.argv[2] || './test-results';
  const timestamp = process.argv[3] || new Date().toISOString();
  
  const generator = new TestReportGenerator(reportDir, timestamp);
  await generator.generateReport();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestReportGenerator;
