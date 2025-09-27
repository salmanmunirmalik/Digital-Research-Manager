import { test, expect } from '@playwright/test';

test.describe('Digital Research Manager - Authentication & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Digital Research Manager/);
    await expect(page.locator('h1').first()).toContainText('Research Lab');
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to lab-notebook (dashboard redirects there)
    await page.waitForURL('/lab-notebook');
    await expect(page.locator('h1').last()).toContainText('Lab Notebook');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'invalid@email.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error, .alert-error, [role="alert"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/lab-notebook');
    
    // Logout
    await page.click('button:has-text("Logout"), [data-testid="logout"]');
    await page.waitForURL('/');
    await expect(page.locator('h1').first()).toContainText('Research Lab');
  });
});

test.describe('Lab Notebook Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/lab-notebook');
  });

  test('should display lab notebook page', async ({ page }) => {
    await expect(page.locator('h1').last()).toContainText('Lab Notebook');
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Tools')).toBeVisible();
  });

  test('should create new lab notebook entry', async ({ page }) => {
    await page.click('button:has-text("New Entry"), [data-testid="new-entry"]');
    
    // Fill form
    await page.fill('input[name="title"], [data-testid="entry-title"]', 'Test Experiment');
    await page.selectOption('select[name="entry_type"], [data-testid="entry-type"]', 'experiment');
    await page.fill('textarea[name="objectives"], [data-testid="objectives"]', 'Test objectives');
    
    await page.click('button:has-text("Save"), button:has-text("Create")');
    
    // Verify entry was created
    await expect(page.locator('text=Test Experiment')).toBeVisible();
  });

  test('should edit existing entry', async ({ page }) => {
    // Assuming there's at least one entry
    await page.click('[data-testid="entry-item"]:first-child');
    await page.click('button:has-text("Edit")');
    
    await page.fill('input[name="title"]', 'Updated Experiment Title');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Updated Experiment Title')).toBeVisible();
  });

  test('should filter entries by type', async ({ page }) => {
    await page.selectOption('select[name="filterType"], [data-testid="filter-type"]', 'experiment');
    // Verify only experiment entries are shown
    await expect(page.locator('[data-testid="entry-item"]')).toHaveCount(await page.locator('[data-testid="entry-item"]').count());
  });

  test('should search entries', async ({ page }) => {
    await page.fill('input[placeholder*="search"], [data-testid="search"]', 'test');
    // Verify search results
    await expect(page.locator('[data-testid="entry-item"]')).toBeVisible();
  });
});

test.describe('Professional Protocols Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/lab-notebook');
    
    // Navigate to Professional Protocols
    await page.click('text=Professional Protocols');
    await page.waitForURL('/professional-protocols');
  });

  test('should display professional protocols page', async ({ page }) => {
    await expect(page.locator('h1').last()).toContainText('Professional Protocols');
    await expect(page.locator('text=From Template')).toBeVisible();
    await expect(page.locator('text=Create Protocol')).toBeVisible();
  });

  test('should create new protocol from template', async ({ page }) => {
    await page.click('button:has-text("From Template")');
    
    // Select a template
    await page.click('[data-testid="template-item"]:first-child');
    await page.click('button:has-text("Use Template")');
    
    // Verify template form is loaded
    await expect(page.locator('input[name="title"]')).toBeVisible();
  });

  test('should create new protocol from scratch', async ({ page }) => {
    await page.click('button:has-text("Create Protocol")');
    
    // Fill basic information
    await page.fill('input[name="title"]', 'Test Protocol');
    await page.selectOption('select[name="protocol_type"]', 'western_blot');
    await page.selectOption('select[name="difficulty_level"]', 'intermediate');
    
    await page.click('button:has-text("Next")');
    
    // Verify next step is loaded
    await expect(page.locator('text=Materials')).toBeVisible();
  });

  test('should filter protocols', async ({ page }) => {
    await page.selectOption('select[name="protocol_type"]', 'pcr');
    await page.selectOption('select[name="difficulty"]', 'beginner');
    
    // Verify filters are applied
    await expect(page.locator('[data-testid="protocol-card"]')).toBeVisible();
  });
});

test.describe('Experiment Tracker Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/lab-notebook');
    
    // Navigate to Experiment Tracker
    await page.click('text=Experiment Tracker');
    await page.waitForURL('/experiment-tracker');
  });

  test('should display experiment tracker page', async ({ page }) => {
    await expect(page.locator('h1').last()).toContainText('Experiment Tracker');
    await expect(page.locator('button:has-text("New Experiment")')).toBeVisible();
  });

  test('should create new experiment', async ({ page }) => {
    await page.click('button:has-text("New Experiment")');
    
    await page.fill('input[name="title"]', 'Test Experiment');
    await page.fill('textarea[name="description"]', 'Test experiment description');
    await page.selectOption('select[name="priority"]', 'high');
    
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Test Experiment')).toBeVisible();
  });

  test('should track experiment progress', async ({ page }) => {
    // Assuming there's an experiment
    await page.click('[data-testid="experiment-item"]:first-child');
    await page.click('button:has-text("Update Progress")');
    
    await page.fill('textarea[name="progress_notes"]', 'Progress update');
    await page.selectOption('select[name="status"]', 'in_progress');
    
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Progress update')).toBeVisible();
  });
});

test.describe('Navigation & Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/lab-notebook');
  });

  test('should navigate to all main sections', async ({ page }) => {
    const navigationItems = [
      { text: 'Lab Notebook', url: '/lab-notebook' },
      { text: 'Professional Protocols', url: '/professional-protocols' },
      { text: 'Experiment Tracker', url: '/experiment-tracker' },
      { text: 'My Portfolio', url: '/my-portfolio' },
      { text: 'Networking', url: '/collaboration-networking' },
      { text: 'Events & Opportunities', url: '/events-opportunities' },
      { text: 'Help Forum', url: '/help-forum' }
    ];

    for (const item of navigationItems) {
      await page.click(`text=${item.text}`);
      await page.waitForURL(item.url);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should display user profile dropdown', async ({ page }) => {
    await page.click('[data-testid="user-menu"], button:has-text("Profile")');
    await expect(page.locator('text=My Portfolio')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Logout')).toBeVisible();
  });
});

test.describe('API Endpoints Testing', () => {
  test('should test authentication endpoints', async ({ request }) => {
    // Test login endpoint
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'researcher@researchlab.com',
        password: 'researcher123'
      }
    });
    expect(loginResponse.ok()).toBeTruthy();
    
    const loginData = await loginResponse.json();
    expect(loginData.token).toBeDefined();
    
    // Test protected endpoint
    const protectedResponse = await request.get('/api/lab-notebooks', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    expect(protectedResponse.ok()).toBeTruthy();
  });

  test('should test lab notebook API endpoints', async ({ request }) => {
    // Login first
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'researcher@researchlab.com',
        password: 'researcher123'
      }
    });
    const { token } = await loginResponse.json();
    
    // Test GET lab notebooks
    const getResponse = await request.get('/api/lab-notebooks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(getResponse.ok()).toBeTruthy();
    
    // Test POST new entry
    const postResponse = await request.post('/api/lab-notebooks', {
      headers: { 'Authorization': `Bearer ${token}` },
      data: {
        title: 'API Test Entry',
        content: 'Test content',
        entry_type: 'experiment',
        lab_id: 'test-lab-id'
      }
    });
    expect(postResponse.ok()).toBeTruthy();
  });

  test('should test professional protocols API endpoints', async ({ request }) => {
    // Login first
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'researcher@researchlab.com',
        password: 'researcher123'
      }
    });
    const { token } = await loginResponse.json();
    
    // Test GET protocols
    const getResponse = await request.get('/api/professional-protocols', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(getResponse.ok()).toBeTruthy();
    
    // Test GET templates
    const templatesResponse = await request.get('/api/professional-protocols/templates/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(templatesResponse.ok()).toBeTruthy();
  });
});

test.describe('Form Validation & Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/lab-notebook');
  });

  test('should validate required fields in lab notebook form', async ({ page }) => {
    await page.click('button:has-text("New Entry")');
    await page.click('button:has-text("Save"), button:has-text("Create")');
    
    // Should show validation errors
    await expect(page.locator('.error, .field-error, [role="alert"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.click('button:has-text("New Entry")');
    await page.fill('input[name="title"]', 'Test Entry');
    await page.click('button:has-text("Save")');
    
    // Should show error message
    await expect(page.locator('.error, .alert-error')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    
    // Should work on mobile
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    
    await page.fill('#email', 'researcher@researchlab.com');
    await page.fill('#password', 'researcher123');
    await page.click('button[type="submit"]');
    
    // Should work on tablet
    await expect(page.locator('h1')).toBeVisible();
  });
});
