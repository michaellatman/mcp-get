import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ServerConfig } from '../types/client-config.js';

// Define mock types for fs methods we use
type MockAccess = jest.MockedFunction<typeof fs.access>;
type MockReadFile = jest.MockedFunction<typeof fs.readFile>;
type MockWriteFile = jest.MockedFunction<typeof fs.writeFile>;
type MockMkdir = jest.MockedFunction<typeof fs.mkdir>;

interface MockedFS {
  access: MockAccess;
  readFile: MockReadFile;
  writeFile: MockWriteFile;
  mkdir: MockMkdir;
}

// Mock fs/promises module
jest.mock('fs/promises', () => {
  const mockFs: Partial<MockedFS> = {
    access: jest.fn() as MockAccess,
    readFile: jest.fn() as MockReadFile,
    writeFile: jest.fn() as MockWriteFile,
    mkdir: jest.fn() as MockMkdir
  };
  return mockFs;
});

// Mock os module for consistent path handling
jest.mock('os', () => ({
  homedir: jest.fn().mockReturnValue('/home/testuser'),
  platform: jest.fn().mockReturnValue('linux'),
  EOL: '\n',
  tmpdir: () => '/tmp'
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Setup default mock implementations
  const mocked = fs as unknown as MockedFS;
  mocked.access.mockResolvedValue(undefined);
  mocked.readFile.mockResolvedValue('{}');
  mocked.writeFile.mockResolvedValue(undefined);
  mocked.mkdir.mockResolvedValue(undefined);
});

export const mockHomedir = '/home/testuser';
export const mockConfig: ServerConfig = {
  name: 'test-server',
  command: 'test-command',
  args: ['--test'],
  env: { TEST: 'true' },
  runtime: 'node',
  transport: 'stdio'
};
