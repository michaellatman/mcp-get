import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
import type { ExecOptions, ChildProcess, ExecException } from 'child_process';

// Type definitions
type ExecResult = { stdout: string; stderr: string };

// Setup mocks
const mockExecPromise = jest.fn().mockName('execPromise') as jest.MockedFunction<
  (command: string) => Promise<ExecResult>
>;

// Create a properly typed mock for exec
const mockExec = jest.fn((
  command: string,
  options: ExecOptions | undefined | null,
  callback?: (error: ExecException | null, stdout: string, stderr: string) => void
): ChildProcess => {
  return {
    on: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() }
  } as unknown as ChildProcess;
});

// Mock chalk module
await jest.unstable_mockModule('chalk', () => ({
  default: {
    yellow: jest.fn(str => str),
    cyan: jest.fn(str => str),
    green: jest.fn(str => str),
    red: jest.fn(str => str),
  }
}));

// Mock child_process module
await jest.unstable_mockModule('child_process', () => ({
  exec: mockExec
}));

// Mock util module
await jest.unstable_mockModule('util', () => ({
  promisify: jest.fn(() => mockExecPromise)
}));

// Mock fs module
await jest.unstable_mockModule('fs', () => ({
  readFileSync: jest.fn(() => JSON.stringify({ version: '1.0.48' }))
}));

// Import after mocking
const { updatePackage } = await import('../auto-update.js');

// Helper to create exec result
const createExecResult = (stdout: string, stderr: string = ''): ExecResult => ({ stdout, stderr });

describe('updatePackage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should check for updates and install if available', async () => {
    mockExecPromise
      .mockResolvedValueOnce(createExecResult('1.0.50\n'))
      .mockResolvedValueOnce(createExecResult('success'));

    await updatePackage();

    expect(mockExecPromise).toHaveBeenNthCalledWith(1, 'npm show @michaellatman/mcp-get version');
    expect(mockExecPromise).toHaveBeenNthCalledWith(2, 'npm install -g @michaellatman/mcp-get@latest');

    expect(console.log).toHaveBeenNthCalledWith(1,
      '\nA new version of mcp-get is available: 1.0.50 (current: 1.0.48)'
    );
    expect(console.log).toHaveBeenNthCalledWith(2,
      'Installing update...'
    );
    expect(console.log).toHaveBeenNthCalledWith(3,
      'success'
    );
    expect(console.log).toHaveBeenNthCalledWith(4,
      '✓ Update complete\n'
    );
  });

  it('should handle version check errors gracefully', async () => {
    const error = new Error('Failed to check version');
    mockExecPromise.mockRejectedValueOnce(error);

    await updatePackage();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to check for updates:',
      'Failed to check version'
    );
  });

  it('should handle installation errors gracefully', async () => {
    mockExecPromise
      .mockResolvedValueOnce(createExecResult('1.0.50\n'))
      .mockRejectedValueOnce(new Error('Installation failed'));

    await updatePackage();

    expect(console.error).toHaveBeenCalledWith(
      'Failed to install update:',
      'Installation failed'
    );
  });

  describe('silent mode', () => {
    it('should not log messages in silent mode when update is available', async () => {
      mockExecPromise
        .mockResolvedValueOnce(createExecResult('1.0.50\n'))
        .mockResolvedValueOnce(createExecResult('success'));

      await updatePackage(true);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should not log errors in silent mode on failure', async () => {
      mockExecPromise.mockRejectedValueOnce(new Error('Failed to check version'));

      await updatePackage(true);
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
