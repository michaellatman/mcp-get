/**
 * Claude Desktop Adapter
 * Source: Internal implementation and configuration schema
 *
 * Example configuration:
 * ```json
 * {
 *   "mcpServers": {
 *     "my-server": {
 *       "runtime": "node",
 *       "command": "/path/to/server",
 *       "args": ["run"],
 *       "env": {}
 *     }
 *   }
 * }
 * ```
 * Support level: Full (Resources, Prompts, Tools)
 * Required fields: command, runtime
 * Transports: stdio, sse
 * Configuration paths:
 * - Windows: %AppData%\Roaming\Claude\claude_desktop_config.json
 * - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
 */
import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ClaudeAdapter extends ClientAdapter {
  constructor(config: ClientConfig) {
    super(config);
  }

  async readConfig(): Promise<Record<string, any> | null> {
    try {
      const content = await fs.readFile(this.getConfigPath(), 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  getConfigPath(): string {
    const platform = process.platform;
    if (platform === 'win32') {
      return this.resolvePath('AppData/Roaming/Claude/claude_desktop_config.json');
    }
    return this.resolvePath('Library/Application Support/Claude/claude_desktop_config.json');
  }

  async isInstalled(): Promise<boolean> {
    try {
      const platform = process.platform;
      const execPath = platform === 'win32'
        ? this.resolvePath('AppData/Local/Programs/claude-desktop/Claude.exe')
        : '/Applications/Claude.app';

      await fs.access(execPath);

      const configDir = path.dirname(this.getConfigPath());
      await fs.access(configDir);

      return true;
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
      mcpServers: {
        ...(existingConfig as any).mcpServers,
        [config.name]: {
          runtime: config.runtime,
          command: config.command,
          args: config.args || [],
          env: config.env || {}
        }
      }
    };

    await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    return !config.transport || ['stdio', 'sse'].includes(config.transport);
  }
}
