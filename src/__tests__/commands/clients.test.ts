import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { listClients } from '../../commands/clients.js';
import { Preferences } from '../../utils/preferences.js';

jest.mock('../../utils/preferences.js');

describe('listClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display installed clients and config paths', async () => {
    const mockClients = ['claude', 'zed'];
    (Preferences.prototype.detectInstalledClients as jest.Mock).mockResolvedValue(mockClients);

    const consoleSpy = jest.spyOn(console, 'log');
    await listClients();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('claude'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('zed'));
  });

  it('should handle no installed clients', async () => {
    (Preferences.prototype.detectInstalledClients as jest.Mock).mockResolvedValue([]);

    const consoleSpy = jest.spyOn(console, 'log');
    await listClients();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No MCP clients detected'));
  });
});
