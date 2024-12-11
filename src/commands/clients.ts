import chalk from 'chalk';
import { Preferences } from '../utils/preferences.js';
import { ConfigManager } from '../utils/config-manager.js';
import { ClientType } from '../types/client-config.js';

export async function listClients(): Promise<void> {
  try {
    const preferences = new Preferences();
    const installedClients = await preferences.detectInstalledClients();

    if (installedClients.length === 0) {
      console.log(chalk.yellow('\nNo MCP clients detected.'));
      return;
    }

    console.log('\nInstalled MCP clients:');
    for (const client of installedClients) {
      const configManager = new ConfigManager();
      const adapter = await configManager.getClientAdapter(client as ClientType);
      const configPath = adapter.getConfigPath();
      console.log(chalk.green(`- ${client}:`));
      console.log(chalk.blue(`  Config: ${configPath}`));
    }
  } catch (error) {
    console.error(chalk.red('Error detecting installed clients:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
