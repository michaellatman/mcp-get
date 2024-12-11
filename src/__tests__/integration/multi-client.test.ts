import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../../utils/config-manager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ClientType, ServerConfig } from '../../types/client-config.js';

jest.mock('fs/promises');

describe('Multi-client Integration', () => {
  let configManager: ConfigManager;
  const testServerConfig: ServerConfig = {
    name: 'test-server',
    runtime: 'node',
    command: 'node server.js',
    args: ['--port', '3000'],
    env: { NODE_ENV: 'production' },
    transport: 'stdio'
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock fs.writeFile
    (fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue();

    configManager = new ConfigManager();

    // Mock client installation status
    const mockClaudeAdapter = configManager.getClientAdapter('claude');
    const mockZedAdapter = configManager.getClientAdapter('zed');
    const mockContinueAdapter = configManager.getClientAdapter('continue');
    const mockFirebaseAdapter = configManager.getClientAdapter('firebase');

    // By default, all clients are installed
    [mockClaudeAdapter, mockZedAdapter, mockContinueAdapter, mockFirebaseAdapter].forEach(adapter => {
      jest.spyOn(adapter, 'isInstalled').mockResolvedValue(true);
      jest.spyOn(adapter, 'validateConfig').mockResolvedValue(true);
      jest.spyOn(adapter, 'writeConfig').mockResolvedValue();
    });
  });

  it('should handle multiple client installations', async () => {
    const installations = await Promise.all([
      configManager.getClientAdapter('claude').isInstalled(),
      configManager.getClientAdapter('zed').isInstalled(),
      configManager.getClientAdapter('continue').isInstalled(),
      configManager.getClientAdapter('firebase').isInstalled()
    ]);

    expect(installations.filter(Boolean).length).toBe(4);
  });

  it('should write configurations to all clients', async () => {
    const config = {
      mcpServers: {
        'test-server': testServerConfig
      }
    };

    const clients: ClientType[] = ['claude', 'zed', 'continue', 'firebase'];
    await configManager.configureClients(config, clients);

    // Each client should have writeConfig called once
    const mockClaudeAdapter = configManager.getClientAdapter('claude');
    const mockZedAdapter = configManager.getClientAdapter('zed');
    const mockContinueAdapter = configManager.getClientAdapter('continue');
    const mockFirebaseAdapter = configManager.getClientAdapter('firebase');

    [mockClaudeAdapter, mockZedAdapter, mockContinueAdapter, mockFirebaseAdapter].forEach(adapter => {
      expect(jest.spyOn(adapter, 'writeConfig')).toHaveBeenCalledTimes(1);
    });
  });

  it('should maintain separate configurations for each client', async () => {
    const config = {
      mcpServers: {
        'test-server': testServerConfig
      }
    };

    const clients: ClientType[] = ['claude', 'zed', 'continue', 'firebase'];
    await configManager.configureClients(config, clients);

    // Each client should have its own configuration structure
    const mockClaudeAdapter = configManager.getClientAdapter('claude');
    const mockZedAdapter = configManager.getClientAdapter('zed');
    const mockContinueAdapter = configManager.getClientAdapter('continue');
    const mockFirebaseAdapter = configManager.getClientAdapter('firebase');

    const claudeConfig = await mockClaudeAdapter.validateConfig(testServerConfig);
    const zedConfig = await mockZedAdapter.validateConfig(testServerConfig);
    const continueConfig = await mockContinueAdapter.validateConfig(testServerConfig);
    const firebaseConfig = await mockFirebaseAdapter.validateConfig(testServerConfig);

    expect(claudeConfig).toBe(true);
    expect(zedConfig).toBe(true);
    expect(continueConfig).toBe(true);
    expect(firebaseConfig).toBe(true);
  });

  it('should handle file system errors gracefully', async () => {
    const mockClaudeAdapter = configManager.getClientAdapter('claude');
    jest.spyOn(mockClaudeAdapter, 'writeConfig').mockRejectedValue(new Error('Mock file system error'));

    await expect(mockClaudeAdapter.writeConfig(testServerConfig)).rejects.toThrow('Mock file system error');
  });
});
