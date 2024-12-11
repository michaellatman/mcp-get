import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../../utils/config-manager.js';
import { ClientType, ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import { Preferences } from '../../utils/preferences.js';

jest.mock('../../utils/preferences.js');

// Mock Preferences class methods
const mockGetDefaultClients = jest.fn();
const mockDetectInstalledClients = jest.fn();
const mockSetDefaultClients = jest.fn();
const mockReadConfig = jest.fn();

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Set up mock implementations
    mockGetDefaultClients.mockImplementation(async () => []);
    mockDetectInstalledClients.mockImplementation(async () => []);
    mockSetDefaultClients.mockImplementation(async () => {});
    mockReadConfig.mockImplementation(async () => ({ mcpServers: {} }));

    // Assign mocks to Preferences prototype
    Object.assign(Preferences.prototype, {
      getDefaultClients: mockGetDefaultClients,
      detectInstalledClients: mockDetectInstalledClients,
      setDefaultClients: mockSetDefaultClients,
      readConfig: mockReadConfig
    });

    configManager = new ConfigManager();

    // Mock client installation status
    const mockClaudeAdapter = configManager.getClientAdapter('claude');
    const mockZedAdapter = configManager.getClientAdapter('zed');
    const mockContinueAdapter = configManager.getClientAdapter('continue');
    const mockFirebaseAdapter = configManager.getClientAdapter('firebase');

    // By default, only Claude is installed
    jest.spyOn(mockClaudeAdapter, 'isInstalled').mockResolvedValue(true);
    jest.spyOn(mockZedAdapter, 'isInstalled').mockResolvedValue(false);
    jest.spyOn(mockContinueAdapter, 'isInstalled').mockResolvedValue(false);
    jest.spyOn(mockFirebaseAdapter, 'isInstalled').mockResolvedValue(false);

    // Mock validateConfig and writeConfig for all adapters
    [mockClaudeAdapter, mockZedAdapter, mockContinueAdapter, mockFirebaseAdapter].forEach(adapter => {
      jest.spyOn(adapter, 'validateConfig').mockResolvedValue(true);
      jest.spyOn(adapter, 'writeConfig').mockResolvedValue();
    });
  });

  describe('getInstalledClients', () => {
    it('should detect installed clients', async () => {
      const installed = await configManager.getInstalledClients();
      expect(installed).toEqual(['claude']);
    });

    it('should return empty array when no clients installed', async () => {
      // Mock all clients as not installed
      const mockClaudeAdapter = configManager.getClientAdapter('claude');
      jest.spyOn(mockClaudeAdapter, 'isInstalled').mockResolvedValue(false);

      const installed = await configManager.getInstalledClients();
      expect(installed).toHaveLength(0);
    });
  });

  describe('selectClients', () => {
    it('should return single client when only one installed', async () => {
      const selected = await configManager.selectClients();
      expect(selected).toHaveLength(1);
      expect(selected[0]).toBe('claude');
    });

    it('should throw error when no clients installed', async () => {
      const mockClaudeAdapter = configManager.getClientAdapter('claude');
      jest.spyOn(mockClaudeAdapter, 'isInstalled').mockResolvedValue(false);

      await expect(configManager.selectClients()).rejects.toThrow(
        'No supported MCP clients found'
      );
    });
  });

  describe('configureClients', () => {
    const testServerConfig: ServerConfig = {
      name: 'test-server',
      runtime: 'node',
      command: 'node',
      args: ['server.js'],
      env: {},
      transport: 'stdio'
    };

    const validConfig = {
      mcpServers: {
        'test-server': testServerConfig
      }
    };

    it('should configure specified clients', async () => {
      const clients: ClientType[] = ['claude', 'zed'];

      // Mock Zed as installed for this test
      const mockZedAdapter = configManager.getClientAdapter('zed');
      jest.spyOn(mockZedAdapter, 'isInstalled').mockResolvedValue(true);

      await configManager.configureClients(validConfig, clients);

      const mockClaudeAdapter = configManager.getClientAdapter('claude');
      expect(jest.spyOn(mockClaudeAdapter, 'writeConfig')).toHaveBeenCalledWith(testServerConfig);
      expect(jest.spyOn(mockZedAdapter, 'writeConfig')).toHaveBeenCalledWith(testServerConfig);
    });

    it('should skip invalid clients', async () => {
      const clients: ClientType[] = ['invalid' as ClientType];
      await expect(configManager.configureClients(validConfig, clients))
        .rejects.toThrow('No valid clients found for configuration');
    });
  });

  describe('readConfig', () => {
    it('should read configuration successfully', async () => {
      const mockConfig = {
        mcpServers: {
          'test-server': {
            name: 'test-server',
            runtime: 'node'
          }
        }
      };
      mockReadConfig.mockImplementationOnce(async () => mockConfig);

      const config = await ConfigManager.readConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should handle missing config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      const config = await ConfigManager.readConfig();
      expect(config).toEqual({ mcpServers: {} });
    });
  });

  describe('isPackageInstalled', () => {
    it('should return true for installed package', async () => {
      const mockConfig = {
        mcpServers: {
          'test-package': {
            name: 'test-package',
            runtime: 'node'
          }
        }
      };
      mockReadConfig.mockImplementationOnce(async () => mockConfig);

      const isInstalled = await ConfigManager.isPackageInstalled('test-package');
      expect(isInstalled).toBe(true);
    });

    it('should return false for non-installed package', async () => {
      const mockConfig = { mcpServers: {} };
      mockReadConfig.mockImplementationOnce(async () => mockConfig);

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
