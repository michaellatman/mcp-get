import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { FirebaseAdapter } from '../../clients/firebase-adapter.js';
import { ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

jest.mock('fs/promises');
jest.mock('os');
jest.mock('child_process');

describe('FirebaseAdapter', () => {
  let adapter: FirebaseAdapter;

  beforeEach(() => {
    adapter = new FirebaseAdapter({ type: 'firebase' });
  });

  describe('isInstalled', () => {
    it('should detect Firebase installation on MacOS/Linux', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (execSync as jest.Mock).mockReturnValue('11.0.0');
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should detect Firebase installation on Windows', async () => {
      (os.platform as jest.Mock).mockReturnValue('win32');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue();
      (execSync as jest.Mock).mockReturnValue('11.0.0');
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should return false when executable does not exist', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(new Error('ENOENT') as any);
      (execSync as jest.Mock).mockImplementation(() => { throw new Error('Command failed'); });
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

    it('should validate SSE transport', async () => {
      const sseConfig = { ...validConfig, transport: 'sse' as const };
      expect(await adapter.validateConfig(sseConfig)).toBe(true);
    });

    it('should reject websocket transport', async () => {
      const wsConfig = { ...validConfig, transport: 'websocket' as const };
      expect(await adapter.validateConfig(wsConfig)).toBe(false);
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
      expect(writtenConfig).toHaveProperty('name');
      expect(writtenConfig).toHaveProperty('serverProcess');
      expect(writtenConfig.serverProcess).toHaveProperty('command', 'node');
      expect(writtenConfig.serverProcess).toHaveProperty('args', ['server.js']);
    });

    it('should handle non-existent config file', async () => {
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT') as any);
      await adapter.writeConfig(config);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const writtenConfig = JSON.parse(writeCall[1] as string);
      expect(writtenConfig).toHaveProperty('name');
      expect(writtenConfig).toHaveProperty('serverProcess');
      expect(writtenConfig.serverProcess).toHaveProperty('command', 'node');
      expect(writtenConfig.serverProcess).toHaveProperty('args', ['server.js']);
    });
  });
});
