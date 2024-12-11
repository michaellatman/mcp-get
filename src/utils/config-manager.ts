import { ClientType, ServerConfig } from '../types/client-config.js';
import { ClientAdapter } from '../clients/base-adapter.js';
import { ClaudeAdapter } from '../clients/claude-adapter.js';
import { ZedAdapter } from '../clients/zed-adapter.js';
import { ContinueAdapter } from '../clients/continue-adapter.js';
import { FirebaseAdapter } from '../clients/firebase-adapter.js';
import { Preferences } from './preferences.js';

export class ConfigManager {
    private clients: Map<ClientType, ClientAdapter>;
    private preferences: Preferences;

    constructor() {
        this.clients = new Map();
        this.preferences = new Preferences();
        this.initializeClients();
    }

    private initializeClients(): void {
        this.clients.set('claude', new ClaudeAdapter({ type: 'claude' }));
        this.clients.set('zed', new ZedAdapter({ type: 'zed' }));
        this.clients.set('continue', new ContinueAdapter({ type: 'continue' }));
        this.clients.set('firebase', new FirebaseAdapter({ type: 'firebase' }));
    }

    async getInstalledClients(): Promise<ClientType[]> {
        const installed: ClientType[] = [];
        for (const [clientType, adapter] of this.clients.entries()) {
            if (await adapter.isInstalled()) {
                installed.push(clientType);
            }
        }
        return installed;
    }

    async selectClients(): Promise<ClientType[]> {
        const defaultClients = await this.preferences.getDefaultClients();
        if (defaultClients.length > 0) {
            const installed = await this.getInstalledClients();
            const validDefaults = defaultClients.filter(client => installed.includes(client));
            if (validDefaults.length > 0) {
                return validDefaults;
            }
        }

        const installed = await this.getInstalledClients();
        if (installed.length === 0) {
            throw new Error('No supported MCP clients found. Please install a supported client first.');
        }

        if (installed.length === 1) {
            await this.preferences.setDefaultClients(installed);
            return installed;
        }

        return installed;
    }

    async configureClients(config: { mcpServers: Record<string, ServerConfig> }, selectedClients?: ClientType[]): Promise<void> {
        const clients = selectedClients || await this.selectClients();
        const installed = await this.getInstalledClients();
        const validClients = clients.filter(client => installed.includes(client));

        if (validClients.length === 0) {
            throw new Error('No valid clients found for configuration');
        }

        if (!config?.mcpServers) {
            throw new Error('Invalid configuration: mcpServers is required');
        }

        await Promise.all(
            validClients.map(async (clientType) => {
                const adapter = this.clients.get(clientType);
                if (adapter) {
                    for (const [_, serverConfig] of Object.entries(config.mcpServers)) {
                        if (await adapter.validateConfig(serverConfig)) {
                            await adapter.writeConfig(serverConfig);
                        }
                    }
                }
            })
        );
    }

    getClientAdapter(clientType: ClientType): ClientAdapter {
        const adapter = this.clients.get(clientType);
        if (!adapter) {
            throw new Error(`Client adapter not found for type: ${clientType}`);
        }
        return adapter;
    }

    static async readConfig(): Promise<any> {
        const configManager = new ConfigManager();
        const config = await configManager.preferences.readConfig();
        return {
            mcpServers: config.mcpServers || {}
        };
    }

    static async isPackageInstalled(packageName: string): Promise<boolean> {
        const config = await this.readConfig();
        const serverName = packageName.replace(/\//g, '-');
        return Object.prototype.hasOwnProperty.call(config.mcpServers, serverName);
    }
} 