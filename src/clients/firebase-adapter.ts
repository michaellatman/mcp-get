import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

export class FirebaseAdapter extends ClientAdapter {
  constructor(config: ClientConfig) {
    super(config);
  }

  getConfigPath(): string {
    return this.resolvePath('.firebase/mcp-config.json');
  }

  async writeConfig(config: ServerConfig): Promise<void> {
    const configPath = this.getConfigPath();
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    const serverConfig = {
      name: config.name,
      serverProcess: {
        command: config.command,
        args: config.args || [],
        env: config.env || {}
      },
      transport: config.transport || 'stdio'
    };

    await fs.writeFile(configPath, JSON.stringify(serverConfig, null, 2));
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    return !config.transport || ['stdio', 'sse'].includes(config.transport);
  }

  async isInstalled(): Promise<boolean> {
    try {
      execSync('firebase --version', { stdio: 'ignore' });

      const rcPath = this.resolvePath('.firebaserc');
      await fs.access(rcPath);

      return true;
    } catch (error) {
      return false;
    }
  }
}
