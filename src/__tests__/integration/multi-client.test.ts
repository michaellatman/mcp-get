import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClaudeAdapter } from '../../clients/claude-adapter.js';
import { ZedAdapter } from '../../clients/zed-adapter.js';
import { ContinueAdapter } from '../../clients/continue-adapter.js';
import { FirebaseAdapter } from '../../clients/firebase-adapter.js';
import { ClientConfig, ServerConfig } from '../../types/client-config.js';

jest.mock('fs');

describe('Multi-client Integration', () => {
  const mockConfig: ClientConfig = { type: 'claude' };
  const serverConfig: ServerConfig = {
    name: 'test-server',
    runtime: 'node',
    command: 'node server.js',
    args: ['--port', '3000'],
    env: { NODE_ENV: 'production' },
    transport: 'stdio'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
  });

  it('should handle multiple client installations', async () => {
    const claude = new ClaudeAdapter(mockConfig);
    const zed = new ZedAdapter(mockConfig);
    const cont = new ContinueAdapter(mockConfig);
    const firebase = new FirebaseAdapter(mockConfig);

    const installations = await Promise.all([
      claude.isInstalled(),
      zed.isInstalled(),
      cont.isInstalled(),
      firebase.isInstalled()
    ]);

    expect(installations.filter(Boolean).length).toBe(4);
  });

  it('should write configurations to all clients', async () => {
    const claude = new ClaudeAdapter(mockConfig);
    const zed = new ZedAdapter(mockConfig);
    const cont = new ContinueAdapter(mockConfig);
    const firebase = new FirebaseAdapter(mockConfig);

    await Promise.all([
      claude.writeConfig(serverConfig),
      zed.writeConfig(serverConfig),
      cont.writeConfig(serverConfig),
      firebase.writeConfig(serverConfig)
    ]);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(4);
  });

  it('should handle unsupported transport methods gracefully', async () => {
    const claude = new ClaudeAdapter(mockConfig);
    const zed = new ZedAdapter(mockConfig);
    const cont = new ContinueAdapter(mockConfig);
    const firebase = new FirebaseAdapter(mockConfig);

    const unsupportedConfig: ServerConfig = {
      ...serverConfig,
      transport: 'unsupported' as any
    };

    const results = await Promise.all([
      claude.validateConfig(unsupportedConfig),
      zed.validateConfig(unsupportedConfig),
      cont.validateConfig(unsupportedConfig),
      firebase.validateConfig(unsupportedConfig)
    ]);

    expect(results.every(result => result === false)).toBe(true);
  });

  it('should maintain separate configurations for each client', async () => {
    const claude = new ClaudeAdapter(mockConfig);
    const zed = new ZedAdapter(mockConfig);
    const cont = new ContinueAdapter(mockConfig);
    const firebase = new FirebaseAdapter(mockConfig);

    await Promise.all([
      claude.writeConfig(serverConfig),
      zed.writeConfig(serverConfig),
      cont.writeConfig(serverConfig),
      firebase.writeConfig(serverConfig)
    ]);

    const writeFileSync = fs.writeFileSync as jest.Mock;
    const calls = writeFileSync.mock.calls;

    const configs = calls.map(call => JSON.parse(call[1] as string));

    expect(configs[0]).toHaveProperty('servers');
    expect(configs[1]).toHaveProperty('mcp.servers');
    expect(configs[2]).toHaveProperty('servers');
    expect(configs[3]).toHaveProperty('mcp.servers');
  });

  it('should handle file system errors gracefully', async () => {
    const claude = new ClaudeAdapter(mockConfig);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Mock file system error');
    });

    await claude.writeConfig(serverConfig).catch(error => {
      expect(error.message).toBe('Mock file system error');
    });
  });
});
