import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../config-manager.js';
import { Package } from '../../types/package.js';
import { ClientType, ServerConfig } from '../../types/client-config.js';
import { ClaudeAdapter } from '../../clients/claude-adapter.js';
import { ZedAdapter } from '../../clients/zed-adapter.js';
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

  describe('getInstalledClients', () => {
    it('should return installed clients', async () => {
      const configManager = new ConfigManager();
      const mockAdapter = {
        isInstalled: jest.fn().mockReturnValue(Promise.resolve(true)),
        validateConfig: jest.fn().mockReturnValue(Promise.resolve(true)),
        writeConfig: jest.fn().mockReturnValue(Promise.resolve()),
        readConfig: jest.fn().mockReturnValue(Promise.resolve({})),
        getConfigPath: jest.fn().mockReturnValue('/test/path'),
        type: 'claude',
        name: 'Claude Desktop'
      } as unknown as ClaudeAdapter;
      jest.spyOn(configManager, 'getClientAdapter').mockResolvedValue(mockAdapter);

      const installedClients = await configManager.getInstalledClients();
      expect(installedClients).toHaveLength(4);
      expect(mockAdapter.isInstalled).toHaveBeenCalledTimes(4);
    });
  });

  describe('configureClients', () => {
    it('should configure selected clients', async () => {
      const configManager = new ConfigManager();
      const mockAdapter = {
        validateConfig: jest.fn().mockReturnValue(Promise.resolve(true)),
        writeConfig: jest.fn().mockReturnValue(Promise.resolve()),
        readConfig: jest.fn().mockReturnValue(Promise.resolve({})),
        getConfigPath: jest.fn().mockReturnValue('/test/path'),
        isInstalled: jest.fn().mockReturnValue(Promise.resolve(true)),
        type: 'claude',
        name: 'Claude Desktop'
      } as unknown as ClaudeAdapter;
      jest.spyOn(configManager, 'getClientAdapter').mockResolvedValue(mockAdapter);

      const config: ServerConfig = {
        name: 'test',
        runtime: 'node',
        command: 'test',
        transport: 'stdio'
      };
      const clients = ['claude', 'zed'] as ClientType[];

      await configManager.configureClients(config, clients);
      expect(mockAdapter.validateConfig).toHaveBeenCalledTimes(2);
      expect(mockAdapter.writeConfig).toHaveBeenCalledTimes(2);
    });
  });
});
