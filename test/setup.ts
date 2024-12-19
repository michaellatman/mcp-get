import { jest } from '@jest/globals';

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Mock console.error to keep test output clean
console.error = jest.fn();
