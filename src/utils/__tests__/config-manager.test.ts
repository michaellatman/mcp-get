import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../config-manager';
import { Package } from '../../types/package';
import fs from 'fs';
import path from 'path';

// Mock modules
jest.mock('fs');
jest.mock('path');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{"mcpServers":{}}');
    jest.spyOn(path, 'dirname').mockReturnValue('/mock/path');
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

      const writeFileSpy = jest.spyOn(fs, 'writeFileSync');

      await ConfigManager.installPackage(mockPackage, mockEnvVars);

      expect(writeFileSpy).toHaveBeenCalled();
      const writtenConfig = JSON.parse(writeFileSpy.mock.calls[0][1] as string);
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

      const writeFileSpy = jest.spyOn(fs, 'writeFileSync');

      await ConfigManager.installPackage(mockPackage);

      expect(writeFileSpy).toHaveBeenCalled();
      const writtenConfig = JSON.parse(writeFileSpy.mock.calls[0][1] as string);
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

      const writeFileSpy = jest.spyOn(fs, 'writeFileSync');

      await ConfigManager.installPackage(mockPackage);

      expect(writeFileSpy).toHaveBeenCalled();
      const writtenConfig = JSON.parse(writeFileSpy.mock.calls[0][1] as string);
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

      const writeFileSpy = jest.spyOn(fs, 'writeFileSync');

      await ConfigManager.installPackage(mockPackage);

      expect(writeFileSpy).toHaveBeenCalled();
      const writtenConfig = JSON.parse(writeFileSpy.mock.calls[0][1] as string);
      expect(writtenConfig.mcpServers['test-package'].command).toBe('custom-cmd');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['--arg1', '--arg2']);
    });

    it('should throw error for custom runtime without command and args', async () => {
      const mockPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };

      await expect(ConfigManager.installPackage(mockPackage)).rejects.toThrow(
        'Custom runtime requires both command and args fields'
      );
    });
  });
});
