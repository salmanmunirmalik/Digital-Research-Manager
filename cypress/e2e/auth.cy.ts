describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset database before each test
    cy.resetDatabase();
  });

  it('should allow user to login and access dashboard', () => {
    // Visit the login page
    cy.visit('/login');

    // Check if login form is visible
    cy.get('[data-cy="email-input"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
    cy.get('[data-cy="login-button"]').should('be.visible');

    // Fill in login form
    cy.get('[data-cy="email-input"]').type('admin@example.com');
    cy.get('[data-cy="password-input"]').type('admin123');

    // Submit login form
    cy.get('[data-cy="login-button"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');

    // Check if dashboard elements are visible
    cy.get('[data-cy="dashboard-title"]').should('contain', 'Dashboard');
    cy.get('[data-cy="user-menu"]').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');

    // Fill in invalid credentials
    cy.get('[data-cy="email-input"]').type('invalid@example.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');

    // Submit login form
    cy.get('[data-cy="login-button"]').click();

    // Should show error message
    cy.get('[data-cy="error-message"]').should('be.visible');
    cy.get('[data-cy="error-message"]').should('contain', 'Invalid credentials');

    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should allow user to logout', () => {
    // Login first
    cy.login('admin@example.com', 'admin123');

    // Should be on dashboard
    cy.url().should('include', '/dashboard');

    // Click user menu
    cy.get('[data-cy="user-menu"]').click();

    // Click logout button
    cy.get('[data-cy="logout-button"]').click();

    // Should redirect to login page
    cy.url().should('include', '/login');
  });

  it('should redirect to login when accessing protected route without auth', () => {
    // Visit dashboard without being logged in
    cy.visit('/dashboard');

    // Should redirect to login page
    cy.url().should('include', '/login');
  });

  it('should allow user to register new account', () => {
    cy.visit('/register');

    // Check if registration form is visible
    cy.get('[data-cy="email-input"]').should('be.visible');
    cy.get('[data-cy="username-input"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
    cy.get('[data-cy="first-name-input"]').should('be.visible');
    cy.get('[data-cy="last-name-input"]').should('be.visible');
    cy.get('[data-cy="register-button"]').should('be.visible');

    // Fill in registration form
    cy.get('[data-cy="email-input"]').type('newuser@example.com');
    cy.get('[data-cy="username-input"]').type('newuser');
    cy.get('[data-cy="password-input"]').type('password123');
    cy.get('[data-cy="first-name-input"]').type('New');
    cy.get('[data-cy="last-name-input"]').type('User');

    // Submit registration form
    cy.get('[data-cy="register-button"]').click();

    // Should show success message
    cy.get('[data-cy="success-message"]').should('be.visible');
    cy.get('[data-cy="success-message"]').should('contain', 'Registration successful');

    // Should redirect to login page
    cy.url().should('include', '/login');
  });

  it('should show validation errors for incomplete registration', () => {
    cy.visit('/register');

    // Submit form without filling required fields
    cy.get('[data-cy="register-button"]').click();

    // Should show validation errors
    cy.get('[data-cy="validation-error"]').should('be.visible');
  });
});
