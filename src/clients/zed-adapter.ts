import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class ZedAdapter extends ClientAdapter {
  constructor(config: ClientConfig) {
    super(config);
  }

  getConfigPath(): string {
    const platform = os.platform();
    if (platform === 'win32') {
      return path.join(os.homedir(), 'AppData/Roaming/Zed/settings.json');
    }
    return path.join(os.homedir(), '.config/zed/settings.json');
  }

  async isInstalled(): Promise<boolean> {
    try {
      const configPath = this.getConfigPath();
      return fs.existsSync(configPath);
    } catch (error) {
      return false;
    }
  }

  async writeConfig(config: ServerConfig): Promise<void> {
    try {
      const configPath = this.getConfigPath();
      const configDir = path.dirname(configPath);

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let existingConfig = {};
      try {
        if (fs.existsSync(configPath)) {
          const content = fs.readFileSync(configPath, 'utf-8');
          existingConfig = JSON.parse(content);
        }
      } catch (error) {
        // File doesn't exist or is invalid, use empty config
      }

      const updatedConfig = {
        ...existingConfig,
        mcp: {
          ...(existingConfig as any).mcp,
          servers: {
            ...((existingConfig as any).mcp?.servers || {}),
            [config.name]: {
              runtime: config.runtime,
              command: config.command,
              args: config.args || [],
              env: config.env || {},
              transport: config.transport
            }
          }
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    } catch (error) {
      throw error;
    }
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    const validTransports = ['stdio'] as const;
    return config.transport !== undefined && validTransports.includes(config.transport as typeof validTransports[number]);
  }
}
