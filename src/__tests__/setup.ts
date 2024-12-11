import { jest, beforeEach } from '@jest/globals';
import type * as osType from 'os';
import type * as fsType from 'fs';
import type * as fsPromisesType from 'fs/promises';
import type * as globType from 'glob';
import type { PathLike } from 'fs';

// Type the glob function
type GlobFunction = (pattern: string, options?: any) => Promise<string[]>;

// Mock glob module
jest.mock('glob', () => ({
  glob: jest.fn().mockImplementation(async () => []) as jest.MockedFunction<GlobFunction>,
}));

// Mock os.platform() to control testing environment
jest.mock('os', () => {
  const actual = jest.requireActual<typeof osType>('os');
  return {
    platform: jest.fn().mockImplementation(() => 'darwin') as jest.MockedFunction<typeof actual.platform>,
    homedir: jest.fn().mockImplementation(() => '/Users/testuser') as jest.MockedFunction<typeof actual.homedir>,
    arch: actual.arch,
    cpus: actual.cpus,
    type: actual.type,
  };
});

// Mock fs operations
jest.mock('fs', () => {
  const actual = jest.requireActual<typeof fsType>('fs');
  return {
    existsSync: jest.fn().mockImplementation(() => false) as jest.MockedFunction<typeof actual.existsSync>,
    readFileSync: jest.fn().mockImplementation(() => '{}') as jest.MockedFunction<typeof actual.readFileSync>,
    writeFileSync: jest.fn().mockImplementation(() => undefined) as jest.MockedFunction<typeof actual.writeFileSync>,
    mkdirSync: jest.fn().mockImplementation(() => undefined) as jest.MockedFunction<typeof actual.mkdirSync>,
    constants: actual.constants,
    Stats: actual.Stats,
  };
});

// Mock fs/promises operations
jest.mock('fs/promises', () => {
  const actual = jest.requireActual<typeof fsPromisesType>('fs/promises');
  return {
    mkdir: jest.fn().mockImplementation(async () => undefined) as jest.MockedFunction<typeof actual.mkdir>,
    writeFile: jest.fn().mockImplementation(async () => undefined) as jest.MockedFunction<typeof actual.writeFile>,
    readFile: jest.fn().mockImplementation(async () => '{}') as jest.MockedFunction<typeof actual.readFile>,
    access: jest.fn().mockImplementation(async () => undefined) as jest.MockedFunction<typeof actual.access>,
  };
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
