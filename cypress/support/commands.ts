// Custom Cypress commands
import { mount } from 'cypress/react18';

// Declare custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      mount(component: React.ReactElement): Chainable<void>;
    }
  }
}

// Export commands
export {};
