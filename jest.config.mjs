/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // Use ts-jest for TypeScript files
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
    // Use babel-jest for mock files
    '^.+\\.(m?js|ts)x?$': ['babel-jest', { rootMode: 'upward' }],
  },
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/test/**/*.test.ts'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/loaders/', 'setup.ts'],
};

export default config; 