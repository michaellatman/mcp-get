import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayPackageDetailsWithActions } from '../utils/display.js';
import { resolvePackages } from '../utils/package-resolver.js';
import { ResolvedPackage } from '../types/package.js';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import { createPackagePrompt, printPackageListHeader } from '../utils/ui.js';
import { handlePackageAction } from '../utils/package-actions.js';

inquirer.registerPrompt('autocomplete', AutocompletePrompt);

export async function listInstalledPackages(): Promise<void> {
  // Get all packages with their resolved status
  const allPackages = resolvePackages();
  
  // Filter for only installed packages
  const installedPackages = allPackages.filter(pkg => pkg.isInstalled);

  if (installedPackages.length === 0) {
    console.log(chalk.yellow('\nNo MCP servers are currently installed.'));
    return;
  }

  printPackageListHeader(installedPackages.length, 'installed');

  const prompt = createPackagePrompt(installedPackages, {
    message: 'Search and select a package:'
  });
  const answer = await inquirer.prompt<{ selectedPackage: ResolvedPackage }>([prompt]);

  if (!answer.selectedPackage) {
    return;
  }

  const action = await displayPackageDetailsWithActions(answer.selectedPackage);
  await handlePackageAction(answer.selectedPackage, action, {
    onUninstall: () => listInstalledPackages(),
    onBack: listInstalledPackages
  });
} 