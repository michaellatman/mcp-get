/**
 * Types and interfaces for MCP client configuration
 */

/**
 * Supported MCP client types
 */
export enum ClientType {
  CLAUDE = 'claude',
  ZED = 'zed',
  CONTINUE = 'continue',
  FIREBASE = 'firebase'
}

/**
 * Server configuration interface
 */
export interface ServerConfig {
  /** Name of the MCP server */
  name: string;
  /** Runtime environment (node/python) */
  runtime: 'node' | 'python';
  /** Command to start the server */
  command: string;
  /** Optional command arguments */
  args?: string[];
  /** Optional environment variables */
  env?: Record<string, string>;
  /** Optional transport method */
  transport?: 'stdio' | 'sse' | 'websocket';
}

/**
 * Client configuration interface
 */
export interface ClientConfig {
  /** Type of MCP client */
  type: ClientType;
  /** Optional custom config path */
  configPath?: string;
}

/**
 * MCP preferences interface
 */
export interface MCPPreferences {
  /** Selected client types */
  selectedClients?: ClientType[];
  /** Analytics preference */
  allowAnalytics?: boolean;
}
