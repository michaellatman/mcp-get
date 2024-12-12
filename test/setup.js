// Jest setup file
import { jest } from '@jest/globals';
// Set default timeout for tests
jest.setTimeout(30000);
// Clear all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
