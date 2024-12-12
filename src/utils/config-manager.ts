import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { Package } from '../types/package.js';
import { ClientType, ServerConfig } from '../types/client-config.js';
import { ClaudeAdapter } from '../clients/claude-adapter.js';
import { ZedAdapter } from '../clients/zed-adapter.js';
import { ContinueAdapter } from '../clients/continue-adapter.js';
import { FirebaseAdapter } from '../clients/firebase-adapter.js';

export interface MCPServer {
    runtime: 'node' | 'python';
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

    async getClientAdapter(clientType: ClientType) {
        switch (clientType) {
            case 'claude':
                return new ClaudeAdapter({ type: clientType, name: 'Claude Desktop' });
            case 'zed':
                return new ZedAdapter({ type: clientType, name: 'Zed' });
            case 'continue':
                return new ContinueAdapter({ type: clientType, name: 'Continue' });
            case 'firebase':
                return new FirebaseAdapter({ type: clientType, name: 'Firebase' });
            default:
                throw new Error(`Unsupported client type: ${clientType}`);
        }
    }

    async getInstalledClients(): Promise<ClientType[]> {
        const installedClients: ClientType[] = [];
        const clientTypes: ClientType[] = ['claude', 'zed', 'continue', 'firebase'];

        for (const clientType of clientTypes) {
            const adapter = await this.getClientAdapter(clientType);
            if (await adapter.isInstalled()) {
                installedClients.push(clientType);
            }
        }

        return installedClients;
    }

    async selectClients(): Promise<ClientType[]> {
        const installedClients = await this.getInstalledClients();

        if (installedClients.length === 0) {
            throw new Error('No MCP clients installed. Please install a supported client first.');
        }

        if (installedClients.length === 1) {
            return installedClients;
        }

        const { selectedClients } = await inquirer.prompt<{ selectedClients: ClientType[] }>([{
            type: 'checkbox',
            name: 'selectedClients',
            message: 'Select MCP clients to configure:',
            choices: installedClients.map(client => ({
                name: client.charAt(0).toUpperCase() + client.slice(1),
                value: client,
                checked: true
            })),
            validate: (answer: ClientType[]) => {
                if (answer.length < 1) {
                    return 'You must select at least one client.';
                }
                return true;
            }
        }]);

        return selectedClients;
    }

    async configureClients(config: ServerConfig, clients: ClientType[]): Promise<void> {
        for (const clientType of clients) {
            const adapter = await this.getClientAdapter(clientType);
            if (!(await adapter.validateConfig(config))) {
                throw new Error(`Invalid configuration for client ${clientType}`);
            }
            await adapter.writeConfig(config);
        }
    }
} 