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
        return this.preferences.detectInstalledClients();
    }

    async selectClients(): Promise<ClientType[]> {
        const defaultClients = await this.preferences.getDefaultClients();
        if (defaultClients.length > 0) {
            return defaultClients;
        }

        const installed = await this.getInstalledClients();
        if (installed.length === 0) {
            throw new Error('No supported MCP clients found. Please install a supported client first.');
        }

        // For single client, automatically select it
        if (installed.length === 1) {
            await this.preferences.setDefaultClients(installed);
            return installed;
        }

        // Multiple clients - selection will be handled by the install command
        return installed;
    }

    async configureClients(serverConfig: ServerConfig, selectedClients?: ClientType[]): Promise<void> {
        const clients = selectedClients || await this.selectClients();

        // Store selected clients as defaults for future installations
        if (selectedClients) {
            await this.preferences.setDefaultClients(selectedClients);
        }

        for (const clientType of clients) {
            const adapter = this.clients.get(clientType);
            if (adapter && await adapter.validateConfig(serverConfig)) {
                await adapter.writeConfig(serverConfig);
            }
        }
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
        return await configManager.preferences.readConfig();
    }

    static async isPackageInstalled(packageName: string): Promise<boolean> {
        const configManager = new ConfigManager();
        const config = await configManager.preferences.readConfig();
        const serverName = packageName.replace(/\//g, '-');
        return !!config.mcpServers?.[serverName];
    }
} 