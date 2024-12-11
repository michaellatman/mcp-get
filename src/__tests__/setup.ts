import * as os from 'os';
import * as path from 'path';

// Mock os.platform() to control testing environment
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  platform: jest.fn(),
  homedir: jest.fn(),
}));

// Mock fs operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (os.platform as jest.Mock).mockReturnValue('darwin'); // Default to macOS
  (os.homedir as jest.Mock).mockReturnValue('/Users/testuser');
});
