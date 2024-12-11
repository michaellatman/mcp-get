import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { listClients } from '../../commands/clients.js';
import { Preferences, ClientType } from '../../utils/preferences.js';

jest.mock('../../utils/preferences.js');

describe('listClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display installed clients and config paths', async () => {
    const mockClients: ClientType[] = ['claude', 'zed'];
    (Preferences.prototype.detectInstalledClients as jest.Mock<() => Promise<ClientType[]>>).mockImplementation(() => Promise.resolve(mockClients));

    const consoleSpy = jest.spyOn(console, 'log');
    await listClients();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('claude'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('zed'));
  });

  it('should handle no installed clients', async () => {
    const emptyClients: ClientType[] = [];
    (Preferences.prototype.detectInstalledClients as jest.Mock<() => Promise<ClientType[]>>).mockImplementation(() => Promise.resolve(emptyClients));

    const consoleSpy = jest.spyOn(console, 'log');
    await listClients();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No MCP clients detected'));
  });
});
