import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ZedAdapter } from '../../clients/zed-adapter.js';
import { ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as TOML from '@iarna/toml';

// Type definitions for TOML config
interface TOMLConfig {
  'context-servers': {
    [key: string]: {
      command: string;
      args: string[];
    };
  };
}

// Type definitions for JSON config
interface JSONConfig {
  context_servers: {
    [key: string]: {
      command: {
        path: string;
        args?: string[];
        env?: Record<string, string>;
      };
    };
  };
}

describe('ZedAdapter', () => {
  let adapter: ZedAdapter;
  let writeFileMock: jest.MockedFunction<typeof fs.writeFile>;
  beforeEach(() => {
    adapter = new ZedAdapter({ type: 'zed' });
    writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
    writeFileMock.mockClear();
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...process.env }; // Create a fresh copy of process.env

    // Mock fs functions with proper types
    (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);
    (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined);
    (fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue(undefined);
    (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);

    // Mock os.homedir with proper type
    (os.homedir as jest.MockedFunction<typeof os.homedir>).mockImplementation(() => {
      if (process.platform === 'win32') return 'C:\\Users\\user';
      if (process.platform === 'darwin') return '/Users/user';
      return '/home/user';
    });
  });

  describe('isInstalled', () => {
    it('should detect Zed installation on MacOS/Linux', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should detect Zed installation on Windows', async () => {
      (os.platform as jest.Mock).mockReturnValue('win32');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should return false when executable does not exist', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(new Error('ENOENT') as any);
      expect(await adapter.isInstalled()).toBe(false);
    });
  });

  describe('validateConfig', () => {
    const validConfig: ServerConfig = {
      name: 'test-server',
      runtime: 'node',
      command: 'node',
      args: ['server.js'],
      env: {},
      transport: 'stdio'
    };

    it('should validate correct configuration', async () => {
      expect(await adapter.validateConfig(validConfig)).toBe(true);
    });

    it('should reject unsupported transport', async () => {
      const invalidConfig = {
        ...validConfig,
        transport: 'invalid' as 'stdio' | 'sse' | 'websocket'
      };
      expect(await adapter.validateConfig(invalidConfig)).toBe(false);
    });
  });

  describe('writeConfig', () => {
    const config: ServerConfig = {
      name: 'test-server',
      runtime: 'node',
      command: 'node',
      args: ['server.js'],
      env: {},
      transport: 'stdio'
    };

    it('should write TOML extension configuration', async () => {
      const mockToml = `[context-servers]
[context-servers.test-server]
command = "node"
args = ["server.js"]`;

      (fs.readFile as jest.MockedFunction<typeof fs.readFile>)
        .mockResolvedValueOnce(mockToml);

      await adapter.writeConfig(config);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenConfig = TOML.parse(writeCall[1] as string) as unknown as TOMLConfig;
      expect(writtenConfig['context-servers']).toBeDefined();
      expect(writtenConfig['context-servers'][config.name]).toBeDefined();
      expect(writtenConfig['context-servers'][config.name].command).toBe('node');
      expect(writtenConfig['context-servers'][config.name].args).toEqual(['server.js']);
    });

    it('should write JSON settings with comments', async () => {
      const mockJson = `{
        // MCP Server Configuration
        "mcp": {
          "servers": {}
        }
      }`;

      (fs.readFile as jest.MockedFunction<typeof fs.readFile>)
        .mockResolvedValueOnce(mockJson);

      await adapter.writeConfig(config);

      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      const settingsCall = writeFileMock.mock.calls.find(call => (call[0] as string).endsWith('settings.json'));
      expect(settingsCall).toBeDefined();
      if (!settingsCall) throw new Error('Settings file write not found');
      const writtenConfig = JSON.parse(settingsCall[1] as string) as JSONConfig;
      expect(writtenConfig.context_servers).toBeDefined();
      expect(writtenConfig.context_servers[config.name]).toBeDefined();
      expect(writtenConfig.context_servers[config.name].command.path).toBe(config.command);
    });

    it('should merge with existing configurations', async () => {
      const existingConfig: JSONConfig = {
        context_servers: {
          'existing-server': {
            command: {
              path: 'python',
              args: ['server.py'],
              env: {}
            }
          }
        }
      };

      (fs.readFile as jest.MockedFunction<typeof fs.readFile>)
        .mockResolvedValueOnce(JSON.stringify(existingConfig));

      await adapter.writeConfig(config);

      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      const settingsCall = writeFileMock.mock.calls.find(call => (call[0] as string).endsWith('settings.json'));
      expect(settingsCall).toBeDefined();
      if (!settingsCall) throw new Error('Settings file write not found');
      const writtenConfig = JSON.parse(settingsCall[1] as string) as JSONConfig;
      expect(writtenConfig.context_servers['existing-server']).toBeDefined();
      expect(writtenConfig.context_servers[config.name]).toBeDefined();
      expect(writtenConfig.context_servers[config.name].command.path).toBe(config.command);
    });

    it('should handle non-existent config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT') as any);
      await adapter.writeConfig(config);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      const settingsCall = writeFileMock.mock.calls.find(call => (call[0] as string).endsWith('settings.json'));
      expect(settingsCall).toBeDefined();
      if (!settingsCall) throw new Error('Settings file write not found');
      const writtenConfig = JSON.parse(settingsCall[1] as string) as JSONConfig;
      expect(writtenConfig.context_servers).toBeDefined();
      expect(writtenConfig.context_servers[config.name]).toBeDefined();
      expect(writtenConfig.context_servers[config.name].command.path).toBe(config.command);
    });

    it('should write to correct paths on Linux', async () => {
      (os.platform as jest.Mock).mockReturnValue('linux');
      (os.homedir as jest.Mock).mockReturnValue('/home/user');
      process.env.XDG_CONFIG_HOME = '/home/user/.config';

      await adapter.writeConfig(config);

      const calls = writeFileMock.mock.calls;
      const paths = calls.map(call => call[0]);

      expect(paths).toContain(path.join('/home/user/.config/zed/settings.json'));
      expect(paths).toContain(path.join('/home/user/.config/zed/extensions/mcp/extension.toml'));
    });

    it('should write to correct paths on MacOS', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const adapter = new ZedAdapter({ type: 'zed' });
      await adapter.writeConfig(config);

      const paths = writeFileMock.mock.calls.map(call => call[0] as string);
      const expectedSettingsPath = path.posix.join('/Users/user/Library/Application Support', 'Zed', 'settings.json');
      const expectedExtensionPath = path.posix.join('/Users/user/Library/Application Support', 'Zed', 'extensions', 'mcp', 'extension.toml');

      expect(paths).toContain(expectedSettingsPath);
      expect(paths).toContain(expectedExtensionPath);
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should write to correct paths on Windows', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env.APPDATA = 'C:\\Users\\user\\AppData\\Roaming';

      const adapter = new ZedAdapter({ type: 'zed' });
      await adapter.writeConfig(config);

      const paths = writeFileMock.mock.calls.map(call => call[0] as string);
      const expectedSettingsPath = path.win32.join('C:\\Users\\user\\AppData\\Roaming', 'Zed', 'settings.json');
      const expectedExtensionPath = path.win32.join('C:\\Users\\user\\AppData\\Roaming', 'Zed', 'extensions', 'mcp', 'extension.toml');

      expect(paths).toContain(expectedSettingsPath);
      expect(paths).toContain(expectedExtensionPath);

      Object.defineProperty(process, 'platform', { value: originalPlatform });
      delete process.env.APPDATA;
    });
  });
});
