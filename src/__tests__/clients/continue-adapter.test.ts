import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ContinueAdapter } from '../../clients/continue-adapter.js';
import { ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { glob } from 'glob';

jest.mock('fs/promises');
jest.mock('os');
jest.mock('glob');

describe('ContinueAdapter', () => {
  let adapter: ContinueAdapter;

  beforeEach(() => {
    adapter = new ContinueAdapter({ type: 'continue' });
  });

  describe('isInstalled', () => {
    it('should detect Continue installation on MacOS/Linux', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (os.homedir as jest.Mock).mockReturnValue('/Users/user');
      (glob as jest.MockedFunction<typeof glob>).mockResolvedValueOnce(['/Users/user/.vscode/extensions/continue.continue-1.0.0']);
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should detect Continue installation on Windows', async () => {
      (os.platform as jest.Mock).mockReturnValue('win32');
      process.env.APPDATA = 'C:\\Users\\user\\AppData\\Roaming';
      (glob as jest.MockedFunction<typeof glob>).mockResolvedValueOnce(['C:\\Users\\user\\AppData\\Roaming\\JetBrains\\plugins\\continue']);
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should return false when executable does not exist', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (os.homedir as jest.Mock).mockReturnValue('/Users/user');
      (glob as jest.MockedFunction<typeof glob>).mockResolvedValueOnce([]);
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

    it('should validate websocket transport', async () => {
      const wsConfig = { ...validConfig, transport: 'stdio' as const };
      expect(await adapter.validateConfig(wsConfig)).toBe(true);
    });

    it('should validate SSE transport', async () => {
      const sseConfig = { ...validConfig, transport: 'stdio' as const };
      expect(await adapter.validateConfig(sseConfig)).toBe(true);
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

    it('should write configuration successfully', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);
      await adapter.writeConfig(config);

      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenConfig = JSON.parse(writeCall[1] as string);
      expect(writtenConfig).toHaveProperty('experimental');
      expect(writtenConfig.experimental).toHaveProperty('modelContextProtocolServer');
      expect(writtenConfig.experimental.modelContextProtocolServer).toHaveProperty('command', 'node');
      expect(writtenConfig.experimental.modelContextProtocolServer).toHaveProperty('args', ['server.js']);
    });

    it('should handle non-existent config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT') as any);
      await adapter.writeConfig(config);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenConfig = JSON.parse(writeCall[1] as string);
      expect(writtenConfig).toHaveProperty('experimental');
      expect(writtenConfig.experimental).toHaveProperty('modelContextProtocolServer');
      expect(writtenConfig.experimental.modelContextProtocolServer).toHaveProperty('command', 'node');
      expect(writtenConfig.experimental.modelContextProtocolServer).toHaveProperty('args', ['server.js']);
    });
  });
});