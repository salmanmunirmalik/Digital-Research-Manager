# Testing Guide - Digital Research Manager

This guide covers the comprehensive testing setup for the Digital Research Manager application.

## 🧪 Testing Infrastructure

### Testing Stack
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + Supertest (API testing)
- **E2E Tests**: Cypress
- **Code Coverage**: Jest with Istanbul
- **Linting**: ESLint + TypeScript ESLint
- **Type Checking**: TypeScript compiler

## 📋 Prerequisites

### Required Software
- Node.js 18+
- PostgreSQL 15+
- npm or pnpm

### Environment Setup
1. Copy environment variables:
   ```bash
   cp env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup database:
   ```bash
   npm run setup-db
   ```

## 🚀 Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test
```

### Unit Tests with Coverage
```bash
npm run test:coverage
```

### Unit Tests in Watch Mode
```bash
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

### E2E Tests (Interactive)
```bash
npm run test:e2e:open
```

### CI Tests
```bash
npm run test:ci
```

## 🔧 Test Configuration

### Jest Configuration
- **Config File**: `jest.config.js`
- **Setup File**: `src/setupTests.ts`
- **Coverage Threshold**: 70% (configurable)

### Cypress Configuration
- **Config File**: `cypress.config.ts`
- **Base URL**: `http://localhost:5173`
- **Support Files**: `cypress/support/`

### ESLint Configuration
- **Config File**: `.eslintrc.js`
- **Rules**: React, TypeScript, Testing Library

## 📁 Test Structure

```
├── src/
│   └── setupTests.ts              # Global test setup
├── contexts/
│   └── __tests__/
│       └── AuthContext.test.tsx   # Context tests
├── pages/
│   └── __tests__/
│       └── DashboardPage.test.tsx # Page tests
├── server/
│   └── __tests__/
│       └── auth.test.ts           # API tests
├── cypress/
│   ├── e2e/
│   │   ├── auth.cy.ts             # E2E auth tests
│   │   └── dashboard.cy.ts        # E2E dashboard tests
│   └── support/
│       ├── commands.ts            # Custom commands
│       ├── e2e.ts                 # E2E support
│       └── component.ts            # Component support
└── scripts/
    ├── fix-ports.sh               # Port conflict resolution
    └── setup-database.sh          # Database setup
```

## 🎯 Test Categories

### 1. Unit Tests
- **Components**: React component behavior
- **Hooks**: Custom hook functionality
- **Utils**: Utility functions
- **Services**: API service functions

### 2. Integration Tests
- **API Endpoints**: Full request/response cycle
- **Database Operations**: CRUD operations
- **Authentication Flow**: Login/logout process

### 3. E2E Tests
- **User Journeys**: Complete user workflows
- **Cross-browser**: Browser compatibility
- **Performance**: Load time and responsiveness

## 📊 Coverage Reports

### Coverage Thresholds
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **Text**: Console output

## 🛠️ Writing Tests

### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TestComponent } from '../TestComponent';

describe('TestComponent', () => {
  it('should render correctly', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### API Tests
```typescript
import request from 'supertest';
import { app } from '../server';

describe('API /auth/login', () => {
  it('should login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests
```typescript
describe('Authentication Flow', () => {
  it('should allow user to login', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@example.com');
    cy.get('[data-cy="password-input"]').type('password');
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## 🔍 Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- AuthContext.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Debugging
```bash
# Open Cypress GUI
npm run test:e2e:open

# Run specific test
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Debug mode
npx cypress run --headed --no-exit
```

## 🚨 Common Issues

### Port Conflicts
```bash
npm run fix-ports
```

### Database Issues
```bash
npm run setup-db
```

### Test Failures
1. Check test data setup
2. Verify mock implementations
3. Check environment variables
4. Review test isolation

### Coverage Issues
1. Check coverage thresholds
2. Review uncovered code
3. Add missing tests
4. Update thresholds if needed

## 📈 Continuous Integration

### GitHub Actions
- **Workflow**: `.github/workflows/ci-cd.yml`
- **Triggers**: Push to main/develop, PRs
- **Jobs**: Test, Build, Security, Deploy

### Quality Gates
```bash
npm run quality
```

This runs:
- Linting checks
- Type checking
- Unit tests with coverage
- Security audit

## 🎉 Best Practices

### Test Organization
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names**
3. **Single responsibility** per test
4. **Proper cleanup** after tests

### Mocking Strategy
1. **Mock external dependencies**
2. **Use real data when possible**
3. **Avoid over-mocking**
4. **Test error scenarios**

### Performance
1. **Parallel test execution**
2. **Efficient test data**
3. **Minimal setup/teardown**
4. **Fast feedback loops**

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)

### Tools
- [Jest Coverage](https://jestjs.io/docs/cli#--coverage)
- [Cypress Dashboard](https://dashboard.cypress.io/)
- [ESLint Playground](https://eslint.org/demo/)

---

**Happy Testing! 🧪✨**
