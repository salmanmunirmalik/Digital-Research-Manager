# 🧪 Research Lab Platform - E2E Testing Framework

A comprehensive end-to-end testing framework for the Research Lab Platform, covering all aspects from API endpoints to user interface interactions.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Test Categories](#test-categories)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Reporting](#reporting)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This testing framework provides comprehensive coverage for:

- **API Testing**: All backend endpoints and services
- **CRUD Operations**: Database operations and data integrity
- **UI Testing**: User interface interactions and navigation
- **Integration Testing**: Cross-service communication and data flows
- **Performance Testing**: Response times and load testing
- **Security Testing**: Authentication, authorization, and security headers

## ✨ Features

### 🚀 Comprehensive Coverage
- **API Endpoints**: Health checks, authentication, CRUD operations
- **Database Operations**: Create, Read, Update, Delete operations
- **User Interface**: Navigation, forms, modals, responsive design
- **Integration Flows**: End-to-end user workflows
- **Performance Metrics**: Response times, load testing
- **Security Checks**: Authentication, CORS, HTTPS validation

### 🔧 Advanced Testing Tools
- **Puppeteer**: Browser automation for UI testing
- **Jest**: Test runner and assertion library
- **PostgreSQL**: Database testing with real connections
- **Axios**: HTTP client for API testing
- **Custom Helpers**: Reusable test utilities

### 📊 Rich Reporting
- **HTML Reports**: Interactive test results with screenshots
- **JSON Reports**: Machine-readable test data
- **Markdown Summaries**: Human-readable test summaries
- **Performance Metrics**: Response times and resource usage
- **Coverage Reports**: Code coverage analysis

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Chrome/Chromium browser (for Puppeteer)

### Installation

```bash
# Navigate to the e2e-testing directory
cd e2e-testing

# Install dependencies
npm install

# Install Puppeteer browser
npm run puppeteer:install
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### Basic Usage

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:api
npm run test:crud
npm run test:ui
npm run test:integration

# Run tests with reporting
npm run test:report
```

## 🧪 Test Categories

### 1. API Tests (`tests/api/`)

Tests all backend API endpoints and services:

- **Health Checks**: Service availability and status
- **Authentication**: Login, logout, token management
- **CRUD Endpoints**: All resource operations
- **Error Handling**: Invalid requests and error responses

```bash
npm run test:api
```

### 2. CRUD Tests (`tests/crud/`)

Tests database operations and data integrity:

- **Lab Notebook**: Entry creation, updates, deletion
- **Protocols**: Protocol management and versioning
- **Data Results**: Result storage and retrieval
- **Data Integrity**: Foreign keys and constraints

```bash
npm run test:crud
```

### 3. UI Tests (`tests/ui/`)

Tests user interface interactions using Puppeteer:

- **Navigation**: Sidebar, breadcrumbs, routing
- **Forms**: Input validation, submission
- **Modals**: Calculator modals, presentation modals
- **Responsive Design**: Mobile and tablet layouts

```bash
npm run test:ui
```

### 4. Integration Tests (`tests/integration/`)

Tests end-to-end workflows and cross-service communication:

- **Data Flows**: Frontend → Backend → Database
- **Service Communication**: Cross-service API calls
- **User Workflows**: Complete user journeys
- **Error Scenarios**: Graceful error handling

```bash
npm run test:integration
```

## ⚙️ Configuration

### Environment Variables

```bash
# Environment
ENVIRONMENT=local|production

# Service URLs
BASE_URL=http://localhost:5173
BACKEND_URL=http://localhost:5002
STATS_SERVICE_URL=http://localhost:5003

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=researchlab
DB_USER=postgres
DB_PASSWORD=password

# Test User
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Test Settings
HEADLESS=true
SLOW_MO=0
```

### Jest Configuration

Each test category has its own Jest configuration:

- `jest.config.js` - Main configuration
- `jest.config.api.js` - API tests
- `jest.config.crud.js` - CRUD tests
- `jest.config.ui.js` - UI tests
- `jest.config.integration.js` - Integration tests

## 🏃‍♂️ Running Tests

### Local Development

```bash
# Run all tests
npm run test:all

# Run with specific environment
ENVIRONMENT=local npm run test:all

# Run with reporting
npm run test:report
```

### Production Testing

```bash
# Run production tests
./scripts/run-production-tests.sh

# Set production URLs
PRODUCTION_BASE_URL=https://your-domain.com ./scripts/run-production-tests.sh
```

### Individual Test Suites

```bash
# API tests only
npm run test:api

# CRUD tests only
npm run test:crud

# UI tests only
npm run test:ui

# Integration tests only
npm run test:integration
```

### Advanced Options

```bash
# Run with verbose output
npm run test:api -- --verbose

# Run specific test file
npm run test:api -- tests/api/authentication.test.ts

# Run with coverage
npm run test:api -- --coverage

# Run in watch mode
npm run test:api -- --watch
```

## 🔄 CI/CD Integration

### GitHub Actions

The framework includes a complete GitHub Actions workflow:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
```

### Local CI Simulation

```bash
# Run CI pipeline locally
./scripts/run-all-tests.sh local

# Run with specific environment
./scripts/run-all-tests.sh production
```

## 📊 Reporting

### Test Reports

After running tests, reports are generated in `test-results/`:

```
test-results/
├── comprehensive-test-report.html  # Main HTML report
├── test-results.json              # JSON data
├── test-summary.md                # Markdown summary
├── api/                           # API test results
├── crud/                          # CRUD test results
├── ui/                            # UI test results
├── integration/                   # Integration test results
└── screenshots/                   # UI test screenshots
```

### Report Features

- **Interactive HTML Reports**: Click-through test results
- **Screenshots**: Visual evidence of UI tests
- **Performance Metrics**: Response times and resource usage
- **Coverage Analysis**: Code coverage reports
- **Trend Analysis**: Historical test performance

### Custom Reports

```bash
# Generate custom report
node scripts/generate-test-report.js ./custom-results $(date +%Y%m%d_%H%M%S)

# Generate production report
./scripts/run-production-tests.sh
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check if services are running
curl http://localhost:5173
curl http://localhost:5002/health
curl http://localhost:5003/health

# Start services manually
cd ..
pnpm run dev
```

#### 2. Puppeteer Issues

```bash
# Reinstall Puppeteer
npm uninstall puppeteer
npm install puppeteer

# Install Chrome browser
npm run puppeteer:install

# Run with visible browser
HEADLESS=false npm run test:ui
```

#### 3. Database Connection Issues

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Test database connection
psql -h localhost -p 5432 -U postgres -d researchlab

# Reset test data
npm run test:crud -- --setupFilesAfterEnv=./tests/setup/crud.setup.ts
```

#### 4. Permission Issues

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Run with sudo if needed
sudo ./scripts/run-all-tests.sh
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true npm run test:all

# Run single test with debug
DEBUG=true npm run test:api -- tests/api/authentication.test.ts

# Slow down UI tests
SLOW_MO=1000 npm run test:ui
```

### Log Files

Check log files for detailed error information:

```bash
# Test run logs
cat test-results/test-run-*.log

# Service logs
cat test-results/services.log

# Puppeteer logs
cat test-results/puppeteer.log
```

## 📚 Additional Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Puppeteer Documentation](https://pptr.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Clean up test data after each test
3. **Error Handling**: Test both success and failure scenarios
4. **Performance**: Monitor test execution time
5. **Maintenance**: Keep tests updated with code changes

### Contributing

When adding new tests:

1. Follow the existing test structure
2. Add appropriate test data cleanup
3. Include both positive and negative test cases
4. Update documentation and reports
5. Ensure tests are environment-agnostic

## 📞 Support

For issues or questions:

1. Check the troubleshooting section
2. Review log files for error details
3. Ensure all services are running
4. Verify environment configuration
5. Check GitHub Actions workflow for CI/CD issues

---

*Generated by Research Lab E2E Testing Framework*
