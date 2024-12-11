import { ClientConfig, ServerConfig } from '../types/client-config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Base adapter class for MCP client configuration
 */
export abstract class ClientAdapter {
  protected config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  /**
   * Get the platform-specific configuration path
   */
  abstract getConfigPath(): string;

  /**
   * Write server configuration to client config file
   */
  abstract writeConfig(config: ServerConfig): Promise<void>;

  /**
   * Validate server configuration against client requirements
   */
  abstract validateConfig(config: ServerConfig): Promise<boolean>;

  /**
   * Check if the client is installed by verifying config file existence
   */
  async isInstalled(): Promise<boolean> {
    try {
      const configPath = this.getConfigPath();
      await fs.access(configPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper method to get home directory
   */
  protected getHomeDir(): string {
    return os.homedir();
  }

  /**
   * Helper method to resolve platform-specific paths
   */
  protected resolvePath(relativePath: string): string {
    return path.resolve(this.getHomeDir(), relativePath);
  }
}
