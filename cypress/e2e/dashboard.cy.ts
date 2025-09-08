describe('Dashboard Functionality', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('admin@example.com', 'admin123');
  });

  it('should display dashboard with all main sections', () => {
    // Should be on dashboard
    cy.url().should('include', '/dashboard');

    // Check for main sections
    cy.get('[data-cy="dashboard-title"]').should('contain', 'Dashboard');
    cy.get('[data-cy="quick-actions"]').should('be.visible');
    cy.get('[data-cy="lab-statistics"]').should('be.visible');
    cy.get('[data-cy="priority-tasks"]').should('be.visible');
    cy.get('[data-cy="upcoming-events"]').should('be.visible');
  });

  it('should open quick add modal', () => {
    // Click quick add button
    cy.get('[data-cy="quick-add-button"]').click();

    // Modal should be visible
    cy.get('[data-cy="quick-add-modal"]').should('be.visible');
    cy.get('[data-cy="quick-add-title"]').should('contain', 'Quick Add Item');

    // Close modal
    cy.get('[data-cy="close-modal"]').click();
    cy.get('[data-cy="quick-add-modal"]').should('not.exist');
  });

  it('should open create entry modal', () => {
    // Click add entry button
    cy.get('[data-cy="add-entry-button"]').click();

    // Modal should be visible
    cy.get('[data-cy="create-entry-modal"]').should('be.visible');
    cy.get('[data-cy="create-entry-title"]').should('contain', 'Create New Entry');

    // Close modal
    cy.get('[data-cy="close-modal"]').click();
    cy.get('[data-cy="create-entry-modal"]').should('not.exist');
  });

  it('should create a new notebook entry', () => {
    // Open create entry modal
    cy.get('[data-cy="add-entry-button"]').click();

    // Fill in entry form
    cy.get('[data-cy="entry-title-input"]').type('Test Experiment');
    cy.get('[data-cy="entry-content-textarea"]').type('This is a test experiment entry');
    cy.get('[data-cy="entry-type-select"]').select('experiment');
    cy.get('[data-cy="entry-priority-select"]').select('high');

    // Submit form
    cy.get('[data-cy="submit-entry-button"]').click();

    // Should show success message
    cy.get('[data-cy="success-message"]').should('be.visible');

    // Modal should close
    cy.get('[data-cy="create-entry-modal"]').should('not.exist');

    // Entry should appear in the list
    cy.get('[data-cy="notebook-entries"]').should('contain', 'Test Experiment');
  });

  it('should display lab statistics correctly', () => {
    // Check if statistics are displayed
    cy.get('[data-cy="total-protocols"]').should('be.visible');
    cy.get('[data-cy="total-experiments"]').should('be.visible');
    cy.get('[data-cy="pending-tasks"]').should('be.visible');
    cy.get('[data-cy="upcoming-events"]').should('be.visible');
  });

  it('should navigate to different pages from dashboard', () => {
    // Test navigation to protocols page
    cy.get('[data-cy="nav-protocols"]').click();
    cy.url().should('include', '/protocols');

    // Go back to dashboard
    cy.get('[data-cy="nav-dashboard"]').click();
    cy.url().should('include', '/dashboard');

    // Test navigation to inventory page
    cy.get('[data-cy="nav-inventory"]').click();
    cy.url().should('include', '/inventory');
  });

  it('should handle responsive design', () => {
    // Test mobile viewport
    cy.viewport(375, 667);

    // Dashboard should still be functional
    cy.get('[data-cy="dashboard-title"]').should('be.visible');
    cy.get('[data-cy="quick-actions"]').should('be.visible');

    // Test tablet viewport
    cy.viewport(768, 1024);

    // Dashboard should still be functional
    cy.get('[data-cy="dashboard-title"]').should('be.visible');
    cy.get('[data-cy="lab-statistics"]').should('be.visible');
  });

  it('should display smart recommendations', () => {
    // Check if smart recommendations section is visible
    cy.get('[data-cy="smart-recommendations"]').should('be.visible');
    
    // Should contain recommendation content
    cy.get('[data-cy="recommendation-content"]').should('be.visible');
  });

  it('should handle task management', () => {
    // Check if tasks are displayed
    cy.get('[data-cy="priority-tasks"]').should('be.visible');

    // If there are tasks, test task interaction
    cy.get('[data-cy="task-item"]').first().then(($task) => {
      if ($task.length > 0) {
        // Test task completion
        cy.get('[data-cy="task-complete-button"]').first().click();
        
        // Task should be marked as completed
        cy.get('[data-cy="task-item"]').first().should('have.class', 'completed');
      }
    });
  });

  it('should handle calendar events', () => {
    // Check if calendar events are displayed
    cy.get('[data-cy="upcoming-events"]').should('be.visible');

    // If there are events, test event interaction
    cy.get('[data-cy="event-item"]').first().then(($event) => {
      if ($event.length > 0) {
        // Test event details
        cy.get('[data-cy="event-title"]').first().should('be.visible');
        cy.get('[data-cy="event-time"]').first().should('be.visible');
      }
    });
  });
});
