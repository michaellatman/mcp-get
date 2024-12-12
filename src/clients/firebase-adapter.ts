/**
 * Firebase Genkit Adapter
 * Source: Firebase implementation and configuration schema
 *
 * Example configuration:
 * ```json
 * {
 *   "name": "my-server",
 *   "serverProcess": {
 *     "command": "/path/to/server",
 *     "args": ["run"],
 *     "env": {}
 *   },
 *   "transport": "stdio"
 * }
 * ```
 * Support level: Partial (Prompts and Tools, partial Resources)
 * Transports: stdio, sse
 * Installation: Requires firebase CLI and firebase.json
 * Configuration path: .firebase/mcp-config.json
 */
import { ClientAdapter } from './base-adapter.js';
import { ServerConfig, ClientConfig } from '../types/client-config.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

export class FirebaseAdapter extends ClientAdapter {
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

      const configPath = path.join(process.cwd(), 'firebase.json');
      await fs.access(configPath);

      return true;
    } catch (error) {
      return false;
    }
  }
}
