module.exports = {
    testEnvironment: 'node',
    testMatch: [
      '**/__tests__/**/*.test.js'
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/db/migrations/**',
      '!src/db/seeders/**',
      '!**/node_modules/**'
    ],
    
    coverageReporters: ['text', 'lcov', 'clover'],
    clearMocks: true,
    testTimeout: 10000,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testSequencer: '<rootDir>/jest.sequencer.js',
    detectOpenHandles: true,
    testPathIgnorePatterns: [
      '/node_modules/',
      '/__tests__/unit/mocks/'
    ]
  };