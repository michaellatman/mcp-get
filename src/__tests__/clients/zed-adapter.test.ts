import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ZedAdapter } from '../../clients/zed-adapter.js';
import { mockHomedir } from '../setup.js';
import { ClientConfig, ServerConfig } from '../../types/client-config.js';

describe('ZedAdapter', () => {
  let adapter: ZedAdapter;

  const mockClientConfig: ClientConfig = {
    name: 'zed',
    type: 'zed',
    configPath: path.join(mockHomedir, '.config', 'zed', 'settings.json')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ZedAdapter(mockClientConfig);
  });

  describe('getConfigPath', () => {
    it('should return the correct config path', () => {
      const configPath = adapter.getConfigPath();
      expect(configPath).toBe(path.join(mockHomedir, '.config', 'zed', 'settings.json'));
    });
  });

  describe('isInstalled', () => {
    it('should return true if config file exists', async () => {
      const mocked = jest.mocked(fs);
      mocked.access.mockResolvedValue(undefined);
      expect(await adapter.isInstalled()).toBe(true);
    });

    it('should return false if config file does not exist', async () => {
      const mocked = jest.mocked(fs);
      mocked.access.mockRejectedValue(new Error('ENOENT'));
      expect(await adapter.isInstalled()).toBe(false);
    });
  });

  describe('readConfig', () => {
    it('should return null if config file does not exist', async () => {
      const mocked = jest.mocked(fs);
      mocked.readFile.mockRejectedValue(new Error('ENOENT'));
      expect(await adapter.readConfig()).toBeNull();
    });

    it('should return parsed config if file exists', async () => {
      const existingConfig = {
        theme: 'dark',
        servers: {
          'test-server': {
            command: 'test',
            args: ['--test'],
            env: { TEST: 'true' },
            runtime: 'node'
          }
        }
      };

      const mocked = jest.mocked(fs);
      mocked.readFile.mockResolvedValue(JSON.stringify(existingConfig));
      const config = await adapter.readConfig();
      expect(config).toEqual(existingConfig);
    });

    it('should return null if config is invalid JSON', async () => {
      const mocked = jest.mocked(fs);
      mocked.readFile.mockResolvedValue('invalid json');
      expect(await adapter.readConfig()).toBeNull();
    });
  });

  describe('validateConfig', () => {
    const validConfig: ServerConfig = {
      name: 'test-server',
      command: 'test',
      args: ['--test'],
      env: { TEST: 'true' },
      runtime: 'node',
      transport: 'stdio'
    };

    it('should not throw for valid stdio config', () => {
      expect(() => adapter.validateConfig(validConfig)).not.toThrow();
    });

    it('should throw for non-stdio transport', () => {
      const invalidConfig: ServerConfig = {
        ...validConfig,
        transport: 'sse'
      };
      expect(() => adapter.validateConfig(invalidConfig)).toThrow();
    });
  });
});
