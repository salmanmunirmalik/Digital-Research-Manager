module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/api'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/api.setup.ts'],
  testTimeout: 30000,
  verbose: true,
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-results/api',
      filename: 'api-test-report.html',
      expand: true,
    }],
  ],
};
