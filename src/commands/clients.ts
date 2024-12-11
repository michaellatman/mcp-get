import chalk from 'chalk';
import { Preferences } from '../utils/preferences.js';

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
      console.log(chalk.green(`- ${client}`));
    }
  } catch (error) {
    console.error(chalk.red('Error detecting installed clients:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
