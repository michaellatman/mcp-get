import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export class ContinueAdapter extends ClientAdapter {
  constructor(config: ClientConfig) {
    super(config);
  }

  getConfigPath(): string {
    return this.resolvePath('.continue/config.json');
  }

  async isInstalled(): Promise<boolean> {
    try {
      // Check for Continue VS Code extension
      const vscodePath = this.resolvePath('.vscode/extensions/continue.continue-*');
      const vscodeExists = await this.checkGlobPath(vscodePath);

      // Check for Continue JetBrains plugin
      const jetbrainsPath = process.platform === 'win32'
        ? this.resolvePath('AppData/Roaming/JetBrains/*/plugins/continue')
        : this.resolvePath('Library/Application Support/JetBrains/*/plugins/continue');
      const jetbrainsExists = await this.checkGlobPath(jetbrainsPath);

      return vscodeExists || jetbrainsExists;
    } catch (error) {
      return false;
    }
  }

  private async checkGlobPath(globPath: string): Promise<boolean> {
    try {
      const matches = await glob(globPath);
      return matches.length > 0;
    } catch (error) {
      return false;
    }
  }

  async writeConfig(config: ServerConfig): Promise<void> {
    const configPath = this.getConfigPath();
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    let existingConfig = {};
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      existingConfig = JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is invalid, use empty config
    }

    const updatedConfig = {
      ...existingConfig,
      experimental: {
        ...(existingConfig as any).experimental,
        modelContextProtocolServer: {
          transport: config.transport || 'stdio',
          command: config.command,
          args: config.args || []
        }
      }
    };

    await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    // Continue supports stdio, sse, and websocket transports
    return !config.transport || ['stdio', 'sse', 'websocket'].includes(config.transport);
  }
}
