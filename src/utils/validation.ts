import { ServerConfig, ClientType } from '../types/client-config.js';
import { ConfigManager } from './config-manager.js';
import chalk from 'chalk';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

type TransportMethod = 'stdio' | 'sse' | 'websocket';

const CLIENT_TRANSPORT_SUPPORT = {
  claude: ['stdio', 'sse', 'websocket'] as TransportMethod[],
  zed: ['stdio'] as TransportMethod[],
  continue: ['stdio', 'sse', 'websocket'] as TransportMethod[],
  firebase: ['stdio', 'sse'] as TransportMethod[]
};

/**
 * Validates client compatibility with server configuration
 */
export async function validateClientCompatibility(
  serverConfig: ServerConfig,
  clientType: ClientType
): Promise<ValidationResult> {
  const configManager = new ConfigManager();
  const client = configManager.getClientAdapter(clientType);
  const errors: string[] = [];

  // Check if client is installed
  const isInstalled = await client.isInstalled();
  if (!isInstalled) {
    errors.push(`${clientType} is not installed`);
    return { isValid: false, errors };
  }

  // Validate transport compatibility
  const transport = serverConfig.transport || 'stdio';
  const supportedTransports = CLIENT_TRANSPORT_SUPPORT[clientType];

  if (!supportedTransports.includes(transport as TransportMethod)) {
    errors.push(
      `Transport method '${transport}' is not supported by ${clientType}. ` +
      `Supported methods: ${supportedTransports.join(', ')}`
    );
  }

  // Validate runtime compatibility
  if (!serverConfig.runtime) {
    errors.push('Runtime must be specified (node or python)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates server configuration across multiple clients
 */
export async function validateServerConfig(
  serverConfig: ServerConfig,
  clients: ClientType[]
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate basic server config
  if (!serverConfig.command) {
    errors.push('Server command is required');
  }

  if (!serverConfig.runtime) {
    errors.push('Runtime is required (node or python)');
  }

  // Check client compatibility
  for (const clientType of clients) {
    const result = await validateClientCompatibility(serverConfig, clientType);
    if (!result.isValid) {
      errors.push(`Client '${clientType}' validation failed:`);
      result.errors.forEach(error => errors.push(`  - ${error}`));
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';

  return chalk.red(
    'Configuration validation failed:\n' +
    errors.map(error => `  • ${error}`).join('\n')
  );
}
