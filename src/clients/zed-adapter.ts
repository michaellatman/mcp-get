import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as TOML from '@iarna/toml';

export class ZedAdapter extends ClientAdapter {
  constructor(config: ClientConfig) {
    super(config);
  }

  getConfigPath(): string {
    // Zed extensions are typically in the .zed directory
    return this.resolvePath('.zed/extensions/mcp-server/extension.toml');
  }

  async isInstalled(): Promise<boolean> {
    try {
      // Check for Zed installation
      const platform = process.platform;
      const zedPath = platform === 'win32'
        ? this.resolvePath('AppData/Local/Programs/Zed/Zed.exe')
        : platform === 'darwin'
          ? '/Applications/Zed.app'
          : this.resolvePath('.local/share/zed/Zed');

      await fs.access(zedPath);

      // Check for Zed extensions directory
      const extensionsDir = this.resolvePath('.zed/extensions');
      await fs.access(extensionsDir);

      return true;
    } catch (error) {
      return false;
    }
  }

  async writeConfig(config: ServerConfig): Promise<void> {
    const configPath = this.getConfigPath();
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    const tomlConfig = {
      context_server: {
        command: config.command,
        args: config.args || [],
        env: config.env || {}
      }
    };

    await fs.writeFile(configPath, TOML.stringify(tomlConfig));
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    // Zed currently only supports stdio transport
    return !config.transport || config.transport === 'stdio';
  }
}
