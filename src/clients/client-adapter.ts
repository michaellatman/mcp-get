import { ClientConfig, ClientType, ServerConfig } from '../types/client-config.js';

/**
 * Base class for MCP client adapters
 * Each client implementation should extend this class and implement its methods
 */
export abstract class ClientAdapter {
  protected clientType: ClientType;
  protected config: ClientConfig;

  constructor(config: ClientConfig) {
    this.clientType = config.type;
    this.config = config;
  }

  /**
   * Get supported transport methods for this client
   * @returns Array of supported transport methods
   */
  abstract getSupportedTransports(): ('stdio' | 'sse' | 'websocket')[];

  /**
   * Check if the client is installed
   */
  abstract isInstalled(): Promise<boolean>;

  /**
   * Get the configuration path for this client
   */
  abstract getConfigPath(): string;

  /**
   * Read the current configuration for this client
   * @returns The parsed configuration object or null if not found/invalid
   */
  abstract readConfig(): Promise<Record<string, any> | null>;

  /**
   * Validate the server configuration for this client
   * @throws Error if configuration is invalid
   */
  abstract validateConfig(config: ServerConfig): void;

  /**
   * Configure the client with the given server configuration
   */
  abstract configure(config: ServerConfig): Promise<void>;
}
