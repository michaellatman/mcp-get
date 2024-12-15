import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../config-manager';
import { Package } from '../../types/package';
import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path');

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });
});
