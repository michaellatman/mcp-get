import { Package, ResolvedPackage } from '../types/package.js';
import { installPackage as installPkg } from '../utils/package-management.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { resolvePackages } from '../utils/package-resolver.js';
import { ConfigManager } from '../utils/config-manager.js';
import { ClientType, ServerConfig } from '../types/client-config.js';
import { validateServerConfig, formatValidationErrors } from '../utils/validation.js';

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
    supportedTransports: ['stdio']
  };
}

function packageToServerConfig(pkg: Package): ServerConfig {
  return {
    name: pkg.name,
    runtime: pkg.runtime,
    command: `mcp-${pkg.name}`,
    args: [],
    env: {},
    transport: 'stdio'
  };
}

async function promptForClientSelection(availableClients: ClientType[]): Promise<ClientType[]> {
  if (availableClients.length === 0) {
    throw new Error('No supported MCP clients found. Please install a supported client first.');
  }

  if (availableClients.length === 1) {
    console.log(chalk.cyan(`Using ${availableClients[0]} as the only installed client.`));
    return availableClients;
  }

  const { selectedClients } = await inquirer.prompt<{ selectedClients: ClientType[] }>([
    {
      type: 'checkbox',
      name: 'selectedClients',
      message: 'Select MCP clients to configure (space to select, enter to confirm):',
      choices: availableClients.map(client => ({
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
    }
  ]);

  return selectedClients;
}

export async function installPackage(pkg: Package): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const selectedClients = await configManager.selectClients();

    // Create server configuration
    const serverConfig = packageToServerConfig(pkg);

    // Validate configuration before installation
    const validationResult = await validateServerConfig(serverConfig, selectedClients);
    if (!validationResult.isValid) {
      console.error(formatValidationErrors(validationResult.errors));
      process.exit(1);
    }

    await installPkg(pkg);
    await configManager.configureClients(serverConfig, selectedClients);

    console.log(chalk.green(`Successfully configured MCP server for ${selectedClients.join(', ')}`));
  } catch (error) {
    console.error(chalk.red('Failed to install package:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function install(packageName: string, nonInteractive = false): Promise<void> {
  const packages = await resolvePackages();
  const pkg = packages.find((p: ResolvedPackage) => p.name === packageName);

  if (!pkg) {
    console.warn(chalk.yellow(`Package ${packageName} not found in the curated list.`));

    if (nonInteractive) {
      console.log('Non-interactive mode: skipping unverified package installation');
      process.exit(1);
    }

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
      const runtime = await promptForRuntime();
      const unknownPkg = createUnknownPackage(packageName, runtime);
      await installPackage(unknownPkg);
    } else {
      console.log('Installation cancelled.');
      process.exit(1);
    }
    return;
  }

  await installPackage(pkg);
} 