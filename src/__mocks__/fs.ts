import { jest } from '@jest/globals';
import type { PathLike, WriteFileOptions, MakeDirectoryOptions } from 'fs';

// Create mock functions with proper Jest functionality
export const existsSync = jest.fn().mockReturnValue(true);
export const readFileSync = jest.fn().mockReturnValue(JSON.stringify({ mcpServers: {} }));
export const writeFileSync = jest.fn();
export const mkdirSync = jest.fn();

// Add other fs methods that might be needed
export const constants = {
  O_CREAT: 0,
  O_RDWR: 0,
  // Add other constants as needed
};

// Export everything as named exports for ESM compatibility
export default {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  constants,
};
