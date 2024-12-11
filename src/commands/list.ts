import chalk from 'chalk';
import inquirer from 'inquirer';
import { displayPackageDetailsWithActions } from '../utils/display.js';
import { resolvePackages } from '../utils/package-resolver.js';
import { ResolvedPackage } from '../types/package.js';
import AutocompletePrompt from 'inquirer-autocomplete-prompt';
import { createPackagePrompt, printPackageListHeader } from '../utils/ui.js';
import { handlePackageAction } from '../utils/package-actions.js';

// Register the autocomplete prompt
inquirer.registerPrompt('autocomplete', AutocompletePrompt);

export async function list() {
  try {
    const packages = await resolvePackages();
    printPackageListHeader(packages.length);

    const prompt = createPackagePrompt(packages, { showInstallStatus: true });
    const answer = await inquirer.prompt<{ selectedPackage: ResolvedPackage }>([prompt]);

    if (!answer.selectedPackage) {
      return;
    }

    const action = await displayPackageDetailsWithActions(answer.selectedPackage);
    await handlePackageAction(answer.selectedPackage, action, {
      onBack: list
    });
  } catch (error) {
    console.error(chalk.red('Error loading package list:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
} 