import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn(),
  })),
});

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
});

// Global test utilities
export const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'researcher',
  first_name: 'Test',
  last_name: 'User'
};

export const mockLab = {
  id: 'test-lab-id',
  name: 'Test Lab',
  description: 'Test laboratory',
  institution: 'Test University',
  department: 'Test Department'
};

export const mockProtocol = {
  id: 'test-protocol-id',
  title: 'Test Protocol',
  description: 'Test protocol description',
  category: 'Molecular Biology',
  version: '1.0',
  author_id: mockUser.id,
  lab_id: mockLab.id,
  content: 'Test protocol content',
  materials: ['Material 1', 'Material 2'],
  equipment: ['Equipment 1', 'Equipment 2'],
  safety_notes: 'Test safety notes',
  estimated_duration: 60,
  difficulty_level: 'Intermediate',
  tags: ['test', 'protocol'],
  is_approved: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({
    ok: true,
    status: 200,
    json: async () => data,
  }),
  error: (message: string, status = 400) => ({
    ok: false,
    status,
    json: async () => ({ error: message }),
  }),
  unauthorized: () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  }),
  forbidden: () => ({
    ok: false,
    status: 403,
    json: async () => ({ error: 'Forbidden' }),
  }),
  notFound: () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' }),
  }),
  serverError: () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: 'Internal server error' }),
  }),
};
