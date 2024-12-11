import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { FirebaseAdapter } from '../../clients/firebase-adapter.js';
import { ServerConfig } from '../../types/client-config.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('FirebaseAdapter', () => {
  let adapter: FirebaseAdapter;

  beforeEach(() => {
    adapter = new FirebaseAdapter({ type: 'firebase' });
  });

  describe('isInstalled', () => {
    it('should detect Firebase installation on MacOS/Linux', async () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should detect Firebase installation on Windows', async () => {
      (os.platform as jest.Mock).mockReturnValue('win32');
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should return false when config file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

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

    it('should write configuration successfully', async () => {
      await adapter.writeConfig(config);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      expect(JSON.parse(writeCall[1])).toHaveProperty('mcp.servers');
    });
  });
});
