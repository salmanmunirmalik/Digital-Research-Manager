module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.setup.ts'],
  testTimeout: 90000,
  verbose: true,
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-results/integration',
      filename: 'integration-test-report.html',
      expand: true,
    }],
  ],
};
