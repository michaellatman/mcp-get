import { ClientType, ServerConfig } from '../types/client-config';
import { ClientAdapter } from '../clients/base-adapter';
import { ClaudeAdapter } from '../clients/claude-adapter';
import { ZedAdapter } from '../clients/zed-adapter';
import { ContinueAdapter } from '../clients/continue-adapter';
import { FirebaseAdapter } from '../clients/firebase-adapter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class ConfigManager {
    private clients: Map<ClientType, ClientAdapter>;

    constructor() {
        this.clients = new Map();
        this.initializeClients();
    }

    private initializeClients(): void {
        this.clients.set(ClientType.CLAUDE, new ClaudeAdapter({ type: ClientType.CLAUDE }));
        this.clients.set(ClientType.ZED, new ZedAdapter({ type: ClientType.ZED }));
        this.clients.set(ClientType.CONTINUE, new ContinueAdapter({ type: ClientType.CONTINUE }));
        this.clients.set(ClientType.FIREBASE, new FirebaseAdapter({ type: ClientType.FIREBASE }));
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
        const installed = await this.getInstalledClients();
        if (installed.length === 0) {
            throw new Error('No supported MCP clients found. Please install a supported client first.');
        }
        if (installed.length === 1) {
            return installed;
        }
        return installed;
    }

    async configureClients(serverConfig: ServerConfig, selectedClients?: ClientType[]): Promise<void> {
        const clients = selectedClients || await this.selectClients();
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
} 