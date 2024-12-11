import { jest, beforeEach } from '@jest/globals';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Mock os.platform() to control testing environment
jest.mock('os', () => {
  const actual = jest.requireActual('os') as typeof os;
  return {
    ...actual,
    platform: jest.fn(),
    homedir: jest.fn(),
  };
});

// Mock fs operations
jest.mock('fs', () => {
  const actual = jest.requireActual('fs') as typeof fs;
  return {
    ...actual,
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (os.platform as jest.Mock).mockReturnValue('darwin'); // Default to macOS
  (os.homedir as jest.Mock).mockReturnValue('/Users/testuser');
});
