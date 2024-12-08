import chalk from 'chalk';
import inquirer from 'inquirer';
import { resolvePackage } from '../utils/package-resolver.js';
import { uninstallPackage } from '../utils/package-management.js';

export async function uninstall(packageName?: string): Promise<void> {
    console.error("!");
  try {
    // If no package name provided, show error
    if (!packageName) {
      console.error(chalk.red('Error: Package name is required'));
      console.log('Usage: mcp-get uninstall <package-name>');
      process.exit(1);
    }

    // Resolve the package
    const pkg = resolvePackage(packageName);
    if (!pkg) {
      console.log(chalk.yellow(`Package ${packageName} not found.`));
      return;
    }

    if (!pkg.isInstalled) {
      console.log(chalk.yellow(`Package ${packageName} is not installed.`));
      return;
    }

    // Confirm uninstallation
    const { confirmUninstall } = await inquirer.prompt<{ confirmUninstall: boolean }>([{
      type: 'confirm',
      name: 'confirmUninstall',
      message: `Are you sure you want to uninstall ${packageName}?`,
      default: false
    }]);

    if (!confirmUninstall) {
      console.log('Uninstallation cancelled.');
      return;
    }

    // Perform uninstallation
    await uninstallPackage(packageName);
    console.log(chalk.green(`\nSuccessfully uninstalled ${packageName}`));
    console.log(chalk.yellow('\nNote: Please restart Claude for the changes to take effect.'));

  } catch (error) {
    console.error(chalk.red('Failed to uninstall package:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
} 