// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global test configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // Return false to prevent the error from failing this test
  return false;
});

// Custom commands for authentication
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(email);
    cy.get('[data-cy="password-input"]').type(password);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Custom commands for API testing
Cypress.Commands.add('apiRequest', (method: string, url: string, body?: any) => {
  return cy.request({
    method,
    url: `http://localhost:5001/api${url}`,
    body,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });
});

// Custom commands for database operations
Cypress.Commands.add('seedDatabase', () => {
  cy.exec('npm run db:seed');
});

Cypress.Commands.add('resetDatabase', () => {
  cy.exec('npm run db:reset');
});

// Custom commands for component testing
Cypress.Commands.add('mount', (component: React.ReactElement) => {
  cy.mount(component);
});

// Global test data
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      apiRequest(method: string, url: string, body?: any): Chainable<any>;
      seedDatabase(): Chainable<void>;
      resetDatabase(): Chainable<void>;
      mount(component: React.ReactElement): Chainable<void>;
    }
  }
}
