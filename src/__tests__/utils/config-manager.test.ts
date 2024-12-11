import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../../utils/config-manager.js';
import { ClientType, ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('getInstalledClients', () => {
    it('should detect installed clients', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);

      const installed = await configManager.getInstalledClients();
      expect(installed.length).toBeGreaterThan(0);
    });

    it('should return empty array when no clients installed', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(new Error('ENOENT'));
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      const installed = await configManager.getInstalledClients();
      expect(installed).toHaveLength(0);
    });
  });

  describe('selectClients', () => {
    it('should return single client when only one installed', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);

      const selected = await configManager.selectClients();
      expect(selected).toHaveLength(1);
      expect(selected[0]).toBe('claude');
    });

    it('should throw error when no clients installed', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(new Error('ENOENT'));
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      await expect(configManager.selectClients()).rejects.toThrow(
        'No supported MCP clients found'
      );
    });
  });

  describe('configureClients', () => {
    const config: ServerConfig = {
      name: 'test-server',
      runtime: 'node',
      command: 'node',
      args: ['server.js'],
      env: {},
      transport: 'stdio'
    };

    it('should configure specified clients', async () => {
      const clients: ClientType[] = ['claude', 'zed'];
      await configManager.configureClients(config, clients);

      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should skip invalid clients', async () => {
      const clients: ClientType[] = ['invalid' as ClientType];
      await configManager.configureClients(config, clients);

      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('readConfig', () => {
    it('should read configuration successfully', async () => {
      const mockConfig = { mcpServers: { 'test-server': {} } };
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await ConfigManager.readConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should handle missing config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      const config = await ConfigManager.readConfig();
      expect(config).toEqual({});
    });
  });

  describe('isPackageInstalled', () => {
    it('should return true for installed package', async () => {
      const mockConfig = { mcpServers: { 'test-package': {} } };
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(JSON.stringify(mockConfig));

      const isInstalled = await ConfigManager.isPackageInstalled('test-package');
      expect(isInstalled).toBe(true);
    });

    it('should return false for non-installed package', async () => {
      const mockConfig = { mcpServers: {} };
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(JSON.stringify(mockConfig));

      const isInstalled = await ConfigManager.isPackageInstalled('non-existent');
      expect(isInstalled).toBe(false);
    });

    it('should handle missing config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      const isInstalled = await ConfigManager.isPackageInstalled('test-package');
      expect(isInstalled).toBe(false);
    });
  });
});
