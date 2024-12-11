import { ClientType, ServerConfig } from '../types/client-config.js';

/**
 * Base class for MCP client adapters
 * Each client implementation should extend this class and implement its methods
 */
export abstract class ClientAdapter {
  protected clientType: ClientType;

  constructor(clientType: ClientType) {
    this.clientType = clientType;
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
   * Configure the client with the given server configuration
   */
  abstract configure(config: ServerConfig): Promise<void>;
}
