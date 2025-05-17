import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { loadPackage } from './package-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

export interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  runtime?: 'node' | 'python' | 'go' | 'http';
}

export interface ClaudeConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: any;
}

function getPackageRuntime(packageName: string): 'node' | 'python' | 'go' | 'http' {
  const pkg = loadPackage(packageName);
  return pkg?.runtime || 'node';
}

export function getConfigPath(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  }

  const configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Claude');
  return path.join(configDir, 'claude_desktop_config.json');
}

export function readConfig(): ClaudeConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export function writeConfig(config: ClaudeConfig): void {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export async function installMCPServer(packageName: string, envVars?: Record<string, string>, runtime?: 'node' | 'python' | 'go' | 'http'): Promise<void> {
  const config = readConfig();
  const serverName = packageName.replace(/\//g, '-');
  
  const effectiveRuntime = runtime || getPackageRuntime(packageName);
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  let command = 'npx';
  let args: string[] | undefined;
  let url: string | undefined;

  if (effectiveRuntime === 'http') {
    command = undefined as any;
    args = undefined;
    url = packageName;
  } else {
    if (effectiveRuntime === 'python') {
      try {
        const { stdout } = await execAsync('which uvx');
        command = stdout.trim();
      } catch (error) {
        command = 'uvx';
      }
      args = [packageName];
    } else if (effectiveRuntime === 'go') {
      command = 'go';
      args = ['run', packageName];
    } else {
      args = ['-y', packageName];
    }
  }

  const serverConfig: MCPServerConfig = {
    runtime: effectiveRuntime,
    env: envVars,
    command,
    args,
    url
  };
  
  config.mcpServers[serverName] = serverConfig;
  writeConfig(config);
}

export function envVarsToArgs(envVars: Record<string, string>): string[] {
  return Object.entries(envVars).map(([key, value]) => {
    const argName = key.toLowerCase().replace(/_/g, '-');
    return [`--${argName}`, value];
  }).flat();
}          