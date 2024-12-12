import { jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FirebaseAdapter } from '../../clients/firebase-adapter.js';
import { mockHomedir } from '../setup.js';
import { ClientConfig, ServerConfig } from '../../types/client-config.js';

describe('FirebaseAdapter', () => {
  let adapter: FirebaseAdapter;

  const mockClientConfig: ClientConfig = {
    name: 'firebase',
    type: 'firebase',
    configPath: path.join(mockHomedir, '.firebase', 'config.json')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new FirebaseAdapter(mockClientConfig);
  });

  // PLACEHOLDER: test suite setup

  describe('getConfigPath', () => {
    it('should return the correct config path', () => {
      const configPath = adapter.getConfigPath();
      expect(configPath).toBe(path.join(mockHomedir, '.firebase', 'config.json'));
    });
  });

  // PLACEHOLDER: isInstalled tests (same as Zed adapter)

  // PLACEHOLDER: readConfig tests (same as Zed adapter)

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

    it('should not throw for valid sse config', () => {
      const sseConfig: ServerConfig = {
        ...validConfig,
        transport: 'sse'
      };
      expect(() => adapter.validateConfig(sseConfig)).not.toThrow();
    });

    it('should throw for websocket transport', () => {
      const wsConfig: ServerConfig = {
        ...validConfig,
        transport: 'websocket'
      };
      expect(() => adapter.validateConfig(wsConfig)).toThrow();
    });
  });
});
