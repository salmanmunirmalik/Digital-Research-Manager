import { config } from './test-config';

// Global test setup
beforeAll(async () => {
  console.log(`🧪 Starting tests for environment: ${config.environment}`);
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  console.log(`📊 Backend URL: ${config.backendUrl}`);
  console.log(`🐍 Stats Service URL: ${config.statsServiceUrl}`);
});

afterAll(async () => {
  console.log('✅ All tests completed');
});

// Global test utilities
global.testUtils = {
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  generateRandomId: () => Math.random().toString(36).substr(2, 9),
  generateTestEmail: () => `test-${Date.now()}@example.com`,
  generateTestUsername: () => `testuser_${Date.now()}`,
};

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
