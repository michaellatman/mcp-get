/**
 * Zed Context Server Adapter
 * Documentation: https://zed.dev/docs/assistant/context-servers
 * Source: Official Zed documentation
 *
 * Example configuration (from official docs):
 * ```json
 * {
 *   "context_servers": {
 *     "my-server": {
 *       "command": "/path/to/server",
 *       "args": ["run"],
 *       "env": {}
 *     }
 *   }
 * }
 * ```
 * Note: transport and runtime fields are not required per official documentation
 * Support level: Partial (Prompts only via slash commands)
 * Configuration paths:
 * - Windows: %AppData%\Zed\settings.json
 * - macOS: ~/Library/Application Support/Zed/settings.json
 * - Linux: ~/.config/zed/settings.json
 */
import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as TOML from '@iarna/toml';
import { parse as parseJsonc } from 'jsonc-parser';
import * as os from 'os';

interface ZedSettings {
  mcp?: ServerConfig;
  [key: string]: any;
}

interface ZedConfigPaths {
  extension: string;
  settings: string;
  projectSettings?: string;
}

export class ZedAdapter extends ClientAdapter {
  constructor(config: ClientConfig) {
    super(config);
  }

  private async getConfigPaths(): Promise<ZedConfigPaths> {
    const home = os.homedir();
    const platform = process.platform;
    let settingsPath: string;
    let extensionPath: string;

    switch (platform) {
      case 'win32':
        const appData = process.env.APPDATA || '';
        settingsPath = path.win32.join(appData, 'Zed', 'settings.json');
        extensionPath = path.win32.join(appData, 'Zed', 'extensions', 'mcp', 'extension.toml');
        break;
      case 'darwin':
        settingsPath = path.posix.join(home, 'Library', 'Application Support', 'Zed', 'settings.json');
        extensionPath = path.posix.join(home, 'Library', 'Application Support', 'Zed', 'extensions', 'mcp', 'extension.toml');
        break;
      default: // linux
        const xdgConfig = process.env.XDG_CONFIG_HOME || path.posix.join(home, '.config');
        settingsPath = path.posix.join(xdgConfig, 'zed', 'settings.json');
        extensionPath = path.posix.join(xdgConfig, 'zed', 'extensions', 'mcp', 'extension.toml');
    }

    return { settings: settingsPath, extension: extensionPath };
  }

  getConfigPath(): string {
    return this.resolvePath('.zed/extensions/mcp-server/extension.toml');
  }

  private async parseConfig(content: string, isExtension: boolean = false): Promise<ZedSettings | any> {
    try {
      return isExtension ?
        TOML.parse(content) :
        parseJsonc(content);
    } catch (err) {
      const error = err as Error;
      throw new Error(`Failed to parse Zed config: ${error.message}`);
    }
  }

  async isInstalled(): Promise<boolean> {
    try {
      const platform = process.platform;
      const zedPath = platform === 'win32'
        ? this.resolvePath('AppData/Local/Programs/Zed/Zed.exe')
        : platform === 'darwin'
          ? '/Applications/Zed.app'
          : this.resolvePath('.local/share/zed/Zed');

      await fs.access(zedPath);

      const extensionsDir = this.resolvePath('.zed/extensions');
      await fs.access(extensionsDir);

      return true;
    } catch (err) {
      return false;
    }
  }

  async writeConfig(config: ServerConfig): Promise<void> {
    const paths = await this.getConfigPaths();

    const tomlConfig = {
      'context-servers': {
        [config.name]: {
          transport: config.transport || 'stdio',
          command: config.command,
          args: config.args || [],
          env: config.env || {}
        }
      }
    };

    let existingSettings = { mcp: { servers: {} } };
    try {
      const content = await fs.readFile(paths.settings, 'utf-8');
      const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*\n/g, '').trim();
      if (jsonContent) {
        existingSettings = JSON.parse(jsonContent);
      }
    } catch (error) {
      // File doesn't exist or is invalid, use empty config
    }

    const updatedSettings = {
      ...existingSettings,
      mcp: {
        ...existingSettings.mcp,
        servers: {
          ...existingSettings.mcp?.servers,
          [config.name]: {
            transport: config.transport || 'stdio',
            command: config.command,
            args: config.args || [],
            env: config.env || {},
            runtime: config.runtime
          }
        }
      }
    };

    await fs.mkdir(path.dirname(paths.extension), { recursive: true });
    await fs.mkdir(path.dirname(paths.settings), { recursive: true });

    await fs.writeFile(paths.extension, TOML.stringify(tomlConfig));
    await fs.writeFile(paths.settings, JSON.stringify(updatedSettings, null, 2));
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    return !config.transport || config.transport === 'stdio';
  }
}
