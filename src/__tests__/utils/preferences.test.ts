import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Preferences } from '../../utils/preferences.js';
import * as fs from 'fs/promises';
import * as os from 'os';
import { join } from 'path';

jest.mock('fs/promises');
jest.mock('os');
jest.mock('path');

describe('Preferences', () => {
  let preferences: Preferences;
  const mockHomedir = '/mock/home';
  const mockConfigDir = join(mockHomedir, '.config', 'mcp-get');
  const mockPreferencesFile = join(mockConfigDir, 'preferences.json');

  beforeEach(() => {
    jest.resetAllMocks();
    (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
    preferences = new Preferences();
  });

  describe('detectInstalledClients', () => {
    it('should detect all installed clients', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);

      const clients = await preferences.detectInstalledClients();
      expect(clients).toContain('claude');
      expect(clients).toContain('zed');
      expect(clients).toContain('continue');
      expect(clients).toContain('firebase');
      expect(clients).toHaveLength(4);
    });

    it('should handle no installed clients', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(new Error('ENOENT'));

      const clients = await preferences.detectInstalledClients();
      expect(clients).toHaveLength(0);
    });
  });

  describe('getDefaultClients', () => {
    it('should return existing default clients', async () => {
      const mockConfig = { defaultClients: ['claude', 'zed'] };
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(JSON.stringify(mockConfig));

      const clients = await preferences.getDefaultClients();
      expect(clients).toEqual(['claude', 'zed']);
    });

    it('should handle missing preferences file', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>)
        .mockRejectedValueOnce(new Error('ENOENT'))  // config dir check
        .mockResolvedValueOnce(undefined);  // after mkdir
      (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined);
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      const clients = await preferences.getDefaultClients();
      expect(clients).toEqual([]);
    });
  });

  describe('readConfig', () => {
    it('should read existing config', async () => {
      const mockConfig = { mcpServers: { 'test-server': {} } };
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await preferences.readConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should handle missing config file', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>)
        .mockRejectedValueOnce(new Error('ENOENT'))  // config dir check
        .mockResolvedValueOnce(undefined);  // after mkdir
      (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined);
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockRejectedValue(new Error('ENOENT'));

      const config = await preferences.readConfig();
      expect(config).toEqual({ mcpServers: {} });
    });

    it('should handle invalid JSON', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);
      (fs.readFile as jest.MockedFunction<typeof fs.readFile>).mockResolvedValue('invalid json');

      const config = await preferences.readConfig();
      expect(config).toEqual({ mcpServers: {} });
    });
  });
});
