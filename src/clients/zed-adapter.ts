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
    const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config');

    const settingsPath = process.platform === 'linux'
      ? path.join(xdgConfig, 'zed', 'settings.json')
      : path.join(home, '.config', 'zed', 'settings.json');

    const paths: ZedConfigPaths = {
      extension: this.resolvePath('.zed/extensions/mcp-server/extension.toml'),
      settings: settingsPath
    };

    const projectSettings = path.join(process.cwd(), '.zed', 'settings.json');
    try {
      await fs.access(projectSettings);
      paths.projectSettings = projectSettings;
    } catch (err) {
      // No project settings found, ignore
    }

    return paths;
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
      context_server: {
        command: config.command,
        args: config.args || [],
        env: config.env || {}
      }
    };

    await fs.mkdir(path.dirname(paths.extension), { recursive: true });
    await fs.writeFile(paths.extension, TOML.stringify(tomlConfig));

    try {
      let settings: ZedSettings = {};
      try {
        const settingsContent = await fs.readFile(paths.settings, 'utf8');
        settings = await this.parseConfig(settingsContent, false) as ZedSettings;
      } catch (err) {
        // Ignore if settings file doesn't exist
      }

      settings.mcp = { ...settings.mcp, ...config };
      await fs.mkdir(path.dirname(paths.settings), { recursive: true });
      await fs.writeFile(paths.settings, JSON.stringify(settings, null, 2));

      if (paths.projectSettings) {
        let projectSettings: ZedSettings = {};
        try {
          const projectContent = await fs.readFile(paths.projectSettings, 'utf8');
          projectSettings = await this.parseConfig(projectContent, false) as ZedSettings;
        } catch (err) {
          // Ignore if project settings file doesn't exist
        }

        projectSettings.mcp = { ...projectSettings.mcp, ...config };
        await fs.mkdir(path.dirname(paths.projectSettings), { recursive: true });
        await fs.writeFile(paths.projectSettings, JSON.stringify(projectSettings, null, 2));
      }
    } catch (err) {
      const error = err as Error;
      throw new Error(`Failed to update Zed settings: ${error.message}`);
    }
  }

  async validateConfig(config: ServerConfig): Promise<boolean> {
    return !config.transport || config.transport === 'stdio';
  }
}
