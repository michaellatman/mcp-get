import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import path from 'path';
import type { PathLike, WriteFileOptions } from 'fs';

// Create properly typed mock functions
const mockExistsSync = jest.fn<(path: PathLike) => boolean>();
const mockReadFileSync = jest.fn<(path: PathLike) => string>();
const mockWriteFileSync = jest.fn<(path: PathLike, data: string, options?: WriteFileOptions) => void>();
const mockMkdirSync = jest.fn<(path: PathLike) => void>();

// Mock fs module before importing ConfigManager
jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
    constants: {
      O_CREAT: 0,
      O_RDWR: 0,
    }
  },
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  constants: {
    O_CREAT: 0,
    O_RDWR: 0,
  }
}));

// Set NODE_ENV to test before importing ConfigManager
process.env.NODE_ENV = 'test';

// Import ConfigManager after mocking fs
const { ConfigManager } = await import('../config-manager');
import { Package } from '../../types/package';

describe('ConfigManager', () => {
  let defaultConfig: { mcpServers: Record<string, any> };

  beforeEach(() => {
    jest.clearAllMocks();
    defaultConfig = { mcpServers: {} };

    // Set up default mock implementations
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(defaultConfig));
    mockWriteFileSync.mockImplementation((_, data) => {
      if (typeof data === 'string') {
        try {
          defaultConfig = JSON.parse(data);
        } catch (error) {
          throw new Error('Error writing config');
        }
      }
    });
    mockMkdirSync.mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    defaultConfig = { mcpServers: {} };
  });

  describe('installPackage', () => {
    it('should create config with "env" key for environment variables', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package for config manager',
        runtime: 'node',
        vendor: 'test-vendor',
        sourceUrl: 'https://github.com/test/test-package',
        homepage: 'https://test-package.com',
        license: 'MIT'
      };

      const mockEnvVars = {
        TEST_KEY: 'test-value'
      };

      await ConfigManager.installPackage(mockPackage, mockEnvVars);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].env).toBeDefined();
      expect(writtenConfig.mcpServers['test-package'].envVars).toBeUndefined();
      expect(writtenConfig.mcpServers['test-package'].env).toEqual(mockEnvVars);
    });

    it('should configure node runtime package correctly', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'node',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };

      await ConfigManager.installPackage(mockPackage);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('npx');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['-y', 'test-package']);
    });

    it('should configure python runtime package correctly', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'python',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };

      await ConfigManager.installPackage(mockPackage);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('uvx');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['test-package']);
    });

    it('should configure custom runtime package correctly', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        command: 'custom-cmd',
        args: ['--arg1', '--arg2']
      };

      await ConfigManager.installPackage(mockPackage);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('custom-cmd');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['--arg1', '--arg2']);
    });

    it('should throw error for custom runtime without command', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        args: ['--arg1', '--arg2']
      };

      await expect(ConfigManager.installPackage(mockPackage))
        .rejects.toThrow('Custom runtime requires both command and args fields');
    });

    it('should throw error for custom runtime without args', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        command: 'custom-cmd'
      };

      await expect(ConfigManager.installPackage(mockPackage))
        .rejects.toThrow('Custom runtime requires both command and args fields');
    });

    it('should use customCommand for node runtime when provided', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'node',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };

      const customCommand = {
        command: 'custom-node-cmd',
        args: ['--custom-arg']
      };

      await ConfigManager.installPackage(mockPackage, undefined, customCommand);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('custom-node-cmd');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['--custom-arg']);
    });

    it('should use customCommand for python runtime when provided', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'python',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };

      const customCommand = {
        command: 'custom-python-cmd',
        args: ['--custom-py-arg']
      };

      await ConfigManager.installPackage(mockPackage, undefined, customCommand);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('custom-python-cmd');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['--custom-py-arg']);
    });

    it('should prioritize package command over customCommand for custom runtime type', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        command: 'specific-cmd',
        args: ['--specific-arg']
      };

      const customCommand = {
        command: 'custom-cmd',
        args: ['--custom-arg']
      };

      await ConfigManager.installPackage(mockPackage, undefined, customCommand);

      expect(mockWriteFileSync).toHaveBeenCalled();
      const writtenConfig = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('specific-cmd');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['--specific-arg']);
    });
  });

  describe('readConfig error handling', () => {
    it('should handle non-existent config file', () => {
      mockExistsSync.mockReturnValue(false);
      const config = ConfigManager.readConfig();
      expect(config).toEqual({ mcpServers: {} });
    });

    it('should handle invalid JSON', () => {
      mockReadFileSync.mockReturnValue('invalid json');
      const config = ConfigManager.readConfig();
      expect(config).toEqual({ mcpServers: {} });
    });

    it('should handle file system errors', () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const config = ConfigManager.readConfig();
      expect(config).toEqual({ mcpServers: {} });
    });
  });

  describe('writeConfig error handling', () => {
    it('should handle directory creation failure', () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      expect(() => ConfigManager.writeConfig({ mcpServers: {} }))
        .toThrow('Error writing config');
    });

    it('should handle write file failure', () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      expect(() => ConfigManager.writeConfig({ mcpServers: {} }))
        .toThrow('Error writing config');
    });
  });
});
