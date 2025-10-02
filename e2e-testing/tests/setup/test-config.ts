export const config = {
  environment: process.env.ENVIRONMENT || 'local',
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5002',
  statsServiceUrl: process.env.STATS_SERVICE_URL || 'http://localhost:5003',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || 'researchlab',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    username: process.env.TEST_USER_USERNAME || 'testuser',
  },
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    veryLong: 60000,
  },
  retries: {
    maxRetries: 3,
    retryDelay: 1000,
  },
};

export const endpoints = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },
  // Core Features
  labNotebook: '/api/lab-notebook',
  protocols: '/api/protocols',
  dataResults: '/api/data-results',
  labManagement: '/api/lab-management',
  researchTools: '/api/research-tools',
  supplierMarketplace: '/api/supplier-marketplace',
  journalsDirectory: '/api/journals-directory',
  researchAssistant: '/api/research-assistant',
  profile: '/api/profile',
  settings: '/api/settings',
  // Advanced Features
  aiPresentations: '/api/ai-presentations',
  statisticalAnalysis: '/api/advanced-stats',
  // Health Checks
  health: '/health',
  statsHealth: '/health',
};

export const testData = {
  labNotebookEntry: {
    title: 'Test Experiment',
    content: 'This is a test experiment entry',
    category: 'Biology',
    tags: ['test', 'experiment'],
  },
  protocol: {
    name: 'Test Protocol',
    description: 'A test protocol for E2E testing',
    steps: ['Step 1', 'Step 2', 'Step 3'],
    category: 'Laboratory',
  },
  supplier: {
    name: 'Test Supplier',
    contact: 'test@supplier.com',
    products: ['Product A', 'Product B'],
    rating: 5,
  },
};
