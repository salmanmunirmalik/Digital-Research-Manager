// Import commands.js using ES2015 syntax:
import './commands';

// Import component testing utilities
import { mount } from 'cypress/react18';

// Make mount available globally
Cypress.Commands.add('mount', mount);

// Global test configuration for component testing
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  return false;
});

// Mock API responses for component testing
Cypress.Commands.add('mockApi', (method: string, url: string, response: any) => {
  cy.intercept(method, `**/api${url}`, response);
});

// Mock authentication for component testing
Cypress.Commands.add('mockAuth', (user: any) => {
  cy.window().then((win) => {
    win.localStorage.setItem('token', 'mock-token');
    win.localStorage.setItem('user', JSON.stringify(user));
  });
});

// Global test data for components
declare global {
  namespace Cypress {
    interface Chainable {
      mount(component: React.ReactElement): Chainable<void>;
      mockApi(method: string, url: string, response: any): Chainable<void>;
      mockAuth(user: any): Chainable<void>;
    }
  }
}
