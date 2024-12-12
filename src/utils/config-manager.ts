import fs from 'fs';
import path from 'path';
import os from 'os';
import { Package } from '../types/package.js';

export interface MCPServer {
    runtime: 'node' | 'python' | 'custom';
    command?: string;
    args?: string[];
    env?: Record<string, string>;
}

export interface MCPConfig {
    mcpServers: Record<string, MCPServer>;
}

export interface MCPPreferences {
    allowAnalytics?: boolean;
}

export class ConfigManager {
    private static configPath: string;
    private static preferencesPath: string;

    static {
        if (process.platform === 'win32') {
            const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
            this.configPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
            this.preferencesPath = path.join(appData, 'mcp-get', 'preferences.json');
        } else if (process.platform === 'darwin') {
            // macOS
            const homeDir = os.homedir();
            this.configPath = path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
            this.preferencesPath = path.join(homeDir, '.mcp-get', 'preferences.json');
        } else {
            // Linux
            const homeDir = os.homedir();
            const configDir = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
            this.configPath = path.join(configDir, 'Claude', 'claude_desktop_config.json');
            this.preferencesPath = path.join(homeDir, '.mcp-get', 'preferences.json');
        }
    }

    static getConfigPath(): string {
        return this.configPath;
    }

    static readConfig(): MCPConfig {
        try {
            if (!fs.existsSync(this.configPath)) {
                return { mcpServers: {} };
            }
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            return {
                mcpServers: config.mcpServers || {}
            };
        } catch (error) {
            console.error('Error reading config:', error);
            return { mcpServers: {} };
        }
    }

    static writeConfig(config: MCPConfig): void {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error writing config:', error);
            throw error;
        }
    }

    static readPreferences(): MCPPreferences {
        try {
            if (!fs.existsSync(this.preferencesPath)) {
                return {};
            }
            return JSON.parse(fs.readFileSync(this.preferencesPath, 'utf8'));
        } catch (error) {
            return {};
        }
    }

    static writePreferences(prefs: MCPPreferences): void {
        try {
            const prefsDir = path.dirname(this.preferencesPath);
            if (!fs.existsSync(prefsDir)) {
                fs.mkdirSync(prefsDir, { recursive: true });
            }
            fs.writeFileSync(this.preferencesPath, JSON.stringify(prefs, null, 2));
        } catch (error) {
            console.error('Error writing preferences:', error);
            throw error;
        }
    }

    static isPackageInstalled(packageName: string): boolean {
        const config = this.readConfig();
        const serverName = packageName.replace(/\//g, '-');
        return serverName in (config.mcpServers || {});
    }

    static async installPackage(pkg: Package, envVars?: Record<string, string>): Promise<void> {
        const config = this.readConfig();
        const serverName = pkg.name.replace(/\//g, '-');

        const serverConfig: MCPServer = {
            runtime: pkg.runtime,
            env: envVars
        };

        // Add command and args based on runtime
        if (pkg.runtime === 'node') {
            serverConfig.command = 'npx';
            serverConfig.args = ['-y', pkg.name];
        } else if (pkg.runtime === 'python') {
            serverConfig.command = 'uvx';
            serverConfig.args = [pkg.name];
        } else if (pkg.runtime === 'custom') {
            if (!pkg.command || !pkg.args) {
                throw new Error('Custom runtime requires both command and args fields');
            }
            serverConfig.command = pkg.command;
            serverConfig.args = pkg.args;
        }

        config.mcpServers[serverName] = serverConfig;
        this.writeConfig(config);
    }

    static async uninstallPackage(packageName: string): Promise<void> {
        const config = this.readConfig();
        const serverName = packageName.replace(/\//g, '-');

        if (!config.mcpServers || !config.mcpServers[serverName]) {
            console.log(`Package ${packageName} is not installed.`);
            return;
        }

        delete config.mcpServers[serverName];
        this.writeConfig(config);
    }
} 