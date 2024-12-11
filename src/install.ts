import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Package } from './types/index.js';
import { installPackage as installPkg } from './utils/package-management.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageListPath = join(__dirname, '../packages/package-list.json');

async function promptForRuntime(): Promise<'node' | 'python'> {
  const { runtime } = await inquirer.prompt<{ runtime: 'node' | 'python' }>([
    {
      type: 'list',
      name: 'runtime',
      message: 'What runtime does this package use?',
      choices: [
        { name: 'Node.js', value: 'node' },
        { name: 'Python', value: 'python' }
      ]
    }
  ]);
  return runtime;
}

function createUnknownPackage(packageName: string, runtime: 'node' | 'python'): Package {
  return {
    name: packageName,
    description: 'Unverified package',
    runtime,
    vendor: '',
    sourceUrl: '',
    homepage: '',
    license: '',
    supportedClients: ['claude', 'zed', 'continue', 'firebase'],
    supportedTransports: ['stdio', 'sse', 'websocket']
  };
}

export async function installPackage(pkg: Package): Promise<void> {
  return installPkg(pkg);
}

export async function install(packageName: string): Promise<void> {
  const packageList: Package[] = JSON.parse(readFileSync(packageListPath, 'utf-8'));

  const pkg = packageList.find(p => p.name === packageName);
  if (!pkg) {
    console.warn(chalk.yellow(`Package ${packageName} not found in the curated list.`));

    const { proceedWithInstall } = await inquirer.prompt<{ proceedWithInstall: boolean }>([
      {
        type: 'confirm',
        name: 'proceedWithInstall',
        message: `Would you like to try installing ${packageName} anyway? This package hasn't been verified.`,
        default: false
      }
    ]);

    if (proceedWithInstall) {
      console.log(chalk.cyan(`Proceeding with installation of ${packageName}...`));

      // Prompt for runtime for unverified packages
      const runtime = await promptForRuntime();

      // Create a basic package object for unverified packages
      const unknownPkg = createUnknownPackage(packageName, runtime);
      await installPkg(unknownPkg);
    } else {
      console.log('Installation cancelled.');
      process.exit(1);
    }
    return;
  }

  await installPkg(pkg);
}
