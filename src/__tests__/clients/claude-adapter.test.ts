import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ClaudeAdapter } from '../../clients/claude-adapter.js';
import { ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    adapter = new ClaudeAdapter({ type: 'claude' });
  });

  describe('isInstalled', () => {
    it('should detect Claude installation on MacOS', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('{}' as any);
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should detect Claude installation on Windows', async () => {
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

    it('should validate configuration without transport', async () => {
      const configWithoutTransport = { ...validConfig };
      delete configWithoutTransport.transport;
      expect(await adapter.validateConfig(configWithoutTransport)).toBe(true);
    });

    it('should reject unsupported transport', async () => {
      const invalidConfig = { ...validConfig, transport: 'invalid' as 'stdio' | 'sse' | 'websocket' };
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
      expect(writtenConfig).toHaveProperty('mcpServers');
      expect(writtenConfig.mcpServers).toHaveProperty(config.name);
    });

    it('should handle non-existent config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT') as any);
      await adapter.writeConfig(config);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenConfig = JSON.parse(writeCall[1] as string);
      expect(writtenConfig).toHaveProperty('mcpServers');
      expect(writtenConfig.mcpServers).toHaveProperty(config.name);
    });
  });
});
