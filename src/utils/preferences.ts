import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';

export type ClientType = 'claude' | 'zed' | 'continue' | 'firebase';

export class Preferences {
  private configDir: string;
  private preferencesFile: string;

  constructor() {
    this.configDir = join(homedir(), '.config', 'mcp-get');
    this.preferencesFile = join(this.configDir, 'preferences.json');
  }

  private async ensureConfigDir(): Promise<void> {
    if (!existsSync(this.configDir)) {
      await mkdir(this.configDir, { recursive: true });
    }
  }

  private getClaudeConfigPath(): string {
    if (process.platform === 'win32') {
      return join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    }
    return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }

  private getZedConfigPath(): string {
    if (process.platform === 'win32') {
      return join(process.env.APPDATA || '', 'Zed', 'settings.json');
    }
    return join(homedir(), '.config', 'zed', 'settings.json');
  }

  private getContinueConfigPath(): string {
    if (process.platform === 'win32') {
      return join(process.env.APPDATA || '', 'Continue', 'config.json');
    }
    return join(homedir(), '.config', 'continue', 'config.json');
  }

  private getFirebaseConfigPath(): string {
    if (process.platform === 'win32') {
      return join(process.env.APPDATA || '', 'Firebase', 'genkit', 'config.json');
    }
    return join(homedir(), '.config', 'firebase', 'genkit', 'config.json');
  }

  async detectInstalledClients(): Promise<ClientType[]> {
    const installedClients: ClientType[] = [];

    if (existsSync(this.getClaudeConfigPath())) {
      installedClients.push('claude');
    }
    if (existsSync(this.getZedConfigPath())) {
      installedClients.push('zed');
    }
    if (existsSync(this.getContinueConfigPath())) {
      installedClients.push('continue');
    }
    if (existsSync(this.getFirebaseConfigPath())) {
      installedClients.push('firebase');
    }

    return installedClients;
  }

  async getDefaultClients(): Promise<ClientType[]> {
    try {
      await this.ensureConfigDir();

      if (!existsSync(this.preferencesFile)) {
        const installedClients = await this.detectInstalledClients();
        if (installedClients.length > 0) {
          await this.setDefaultClients(installedClients);
          return installedClients;
        }
        return [];
      }

      const data = await readFile(this.preferencesFile, 'utf-8');
      const prefs = JSON.parse(data);
      return prefs.defaultClients || [];
    } catch (error) {
      console.error('Error reading preferences:', error);
      return [];
    }
  }

  async setDefaultClients(clients: ClientType[]): Promise<void> {
    try {
      await this.ensureConfigDir();

      const data = JSON.stringify({
        defaultClients: clients
      }, null, 2);

      await writeFile(this.preferencesFile, data, 'utf-8');
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  async shouldPromptForClientSelection(): Promise<boolean> {
    const installedClients = await this.detectInstalledClients();
    return installedClients.length > 1;
  }

  async getOrSelectDefaultClients(): Promise<ClientType[]> {
    const installedClients = await this.detectInstalledClients();

    if (installedClients.length === 0) {
      throw new Error('No supported MCP clients detected. Please install at least one supported client.');
    }

    if (installedClients.length === 1) {
      await this.setDefaultClients(installedClients);
      return installedClients;
    }

    const defaultClients = await this.getDefaultClients();
    if (defaultClients.length > 0) {
      return defaultClients;
    }

    // If no defaults are set but multiple clients are installed,
    // the caller should handle prompting the user for selection
    return [];
  }

  async readConfig(): Promise<any> {
    try {
      await this.ensureConfigDir();

      if (!existsSync(this.preferencesFile)) {
        return { mcpServers: {} };
      }

      const data = await readFile(this.preferencesFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config:', error);
      return { mcpServers: {} };
    }
  }
}
