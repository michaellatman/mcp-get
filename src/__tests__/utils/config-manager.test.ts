import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../../utils/config-manager.js';
import { ClientType, ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs';
import * as os from 'os';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('getInstalledClients', () => {
    it('should detect installed clients', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const installed = await configManager.getInstalledClients();
      expect(installed.length).toBeGreaterThan(0);
    });

    it('should return empty array when no clients installed', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const installed = await configManager.getInstalledClients();
      expect(installed).toHaveLength(0);
    });
  });

  describe('selectClients', () => {
    it('should return single client when only one installed', async () => {
      (fs.existsSync as jest.Mock)
        .mockImplementation((p: unknown) => typeof p === 'string' && p.includes('claude'));

      const selected = await configManager.selectClients();
      expect(selected).toHaveLength(1);
      expect(selected[0]).toBe('claude');
    });

    it('should throw error when no clients installed', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

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

      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should skip invalid clients', async () => {
      const clients: ClientType[] = ['invalid' as ClientType];
      await configManager.configureClients(config, clients);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
