import inquirer from 'inquirer';
import { Package } from '../types/package.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { packageHelpers } from '../helpers/index.js';
import { checkUVInstalled, promptForUVInstall } from './runtime-utils.js';
import { ConfigManager } from './config-manager.js';
import { ClientType } from '../types/client-config.js';
import { Preferences } from './preferences.js';

declare function fetch(url: string, init?: any): Promise<{ ok: boolean; statusText: string }>;

const execAsync = promisify(exec);

async function checkAnalyticsConsent(): Promise<boolean> {
  const prefs = await ConfigManager.readPreferences();

  if (typeof prefs?.allowAnalytics === 'boolean') {
    return prefs.allowAnalytics;
  }

  const { allowAnalytics } = await inquirer.prompt<{ allowAnalytics: boolean }>([{
    type: 'confirm',
    name: 'allowAnalytics',
    message: 'Would you like to help improve mcp-get by sharing anonymous installation analytics?',
    default: true
  }]);

  await ConfigManager.writePreferences({ ...prefs, allowAnalytics });
  return allowAnalytics;
}

async function trackInstallation(packageName: string): Promise<void> {
  try {
    const response = await fetch(`https://mcp-get.com/api/packages/${packageName}/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to track installation: ${response.statusText}`);
    }
  } catch (error) {
    console.warn('Failed to track package installation');
  }
}

async function promptForEnvVars(packageName: string): Promise<Record<string, string> | undefined> {
  const helpers = packageHelpers[packageName];
  if (!helpers?.requiredEnvVars) {
    return undefined;
  }

  const existingEnvVars: Record<string, string> = {};
  let hasAllRequired = true;

  for (const [key, value] of Object.entries(helpers.requiredEnvVars)) {
    const existingValue = process.env[key];
    if (existingValue) {
      existingEnvVars[key] = existingValue;
    } else if (value.required) {
      hasAllRequired = false;
    }
  }

  if (hasAllRequired && Object.keys(existingEnvVars).length > 0) {
    const { useAutoSetup } = await inquirer.prompt<{ useAutoSetup: boolean }>([{
      type: 'confirm',
      name: 'useAutoSetup',
      message: 'Found all required environment variables. Would you like to use them automatically?',
      default: true
    }]);

    if (useAutoSetup) {
      return existingEnvVars;
    }
  }

  const { configureEnv } = await inquirer.prompt<{ configureEnv: boolean }>([{
    type: 'confirm',
    name: 'configureEnv',
    message: hasAllRequired
      ? 'Would you like to manually configure environment variables for this package?'
      : 'Some required environment variables are missing. Would you like to configure them now?',
    default: !hasAllRequired
  }]);

  if (!configureEnv) {
    if (!hasAllRequired) {
      const configPath = ConfigManager.getConfigPath();
      console.log('\nNote: Some required environment variables are not configured.');
      console.log(`You can set them later by editing the config file at:`);
      console.log(configPath);
    }
    return undefined;
  }

  const envVars: Record<string, string> = {};

  for (const [key, value] of Object.entries(helpers.requiredEnvVars)) {
    const existingEnvVar = process.env[key];

    if (existingEnvVar) {
      const { reuseExisting } = await inquirer.prompt<{ reuseExisting: boolean }>([{
        type: 'confirm',
        name: 'reuseExisting',
        message: `Found ${key} in your environment variables. Would you like to use it?`,
        default: true
      }]);

      if (reuseExisting) {
        envVars[key] = existingEnvVar;
        continue;
      }
    }

    const { envValue } = await inquirer.prompt([{
      type: 'input',
      name: 'envValue',
      message: `Please enter ${value.description}:`,
      default: value.required ? undefined : null,
      validate: (input: string) => {
        if (value.required && !input) {
          return `${key} is required`;
        }
        return true;
      }
    }]);

    if (envValue !== null) {
      envVars[key] = envValue;
    }
  }

  if (Object.keys(envVars).length === 0) {
    const configPath = ConfigManager.getConfigPath();
    console.log('\nNo environment variables were configured.');
    console.log(`You can set them later by editing the config file at:`);
    console.log(configPath);
    return undefined;
  }

  return envVars;
}

async function isClientRunning(clientType: ClientType): Promise<boolean> {
  try {
    const platform = process.platform;
    switch (clientType) {
      case 'claude':
        if (platform === 'win32') {
          const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq Claude.exe" /NH');
          return stdout.includes('Claude.exe');
        } else if (platform === 'darwin') {
          const { stdout } = await execAsync('pgrep -x "Claude"');
          return !!stdout.trim();
        } else if (platform === 'linux') {
          const { stdout } = await execAsync('pgrep -f "claude"');
          return !!stdout.trim();
        }
        break;
      // Other clients don't require process checking
      default:
        return false;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function promptForRestart(clientType: ClientType): Promise<boolean> {
  const clientRunning = await isClientRunning(clientType);
  if (!clientRunning) {
    return false;
  }

  const { shouldRestart } = await inquirer.prompt<{ shouldRestart: boolean }>([
    {
      type: 'confirm',
      name: 'shouldRestart',
      message: `Would you like to restart the ${clientType} app to apply changes?`,
      default: true
    }
  ]);

  if (shouldRestart) {
    console.log(`Restarting ${clientType} app...`);
    try {
      const platform = process.platform;
      if (clientType === 'claude') {
        if (platform === 'win32') {
          await execAsync('taskkill /F /IM "Claude.exe" && start "" "Claude.exe"');
        } else if (platform === 'darwin') {
          await execAsync('killall "Claude" && open -a "Claude"');
        } else if (platform === 'linux') {
          await execAsync('pkill -f "claude" && claude');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (platform === 'win32') {
          await execAsync('start "" "Claude.exe"');
        } else if (platform === 'darwin') {
          await execAsync('open -a "Claude"');
        } else if (platform === 'linux') {
          await execAsync('claude');
        }
      }
      // Other clients don't require restart

      console.log(`${clientType} app has been restarted.`);
    } catch (error) {
      console.error(`Failed to restart ${clientType} app:`, error);
    }
  }

  return shouldRestart;
}

async function promptForClientSelection(clients: ClientType[]): Promise<ClientType> {
  const { selectedClient } = await inquirer.prompt<{ selectedClient: ClientType }>([{
    type: 'list',
    name: 'selectedClient',
    message: 'Select which client to configure:',
    choices: clients.map(client => ({
      name: client.charAt(0).toUpperCase() + client.slice(1),
      value: client
    }))
  }]);
  return selectedClient;
}

export async function installPackage(pkg: Package): Promise<void> {
  try {
    if (pkg.runtime === 'python') {
      const hasUV = await checkUVInstalled();
      if (!hasUV) {
        const installed = await promptForUVInstall(inquirer);
        if (!installed) {
          console.log('Proceeding with installation, but uvx commands may fail...');
        }
      }
    }

    const envVars = await promptForEnvVars(pkg.name);
    const configManager = new ConfigManager();
    const installedClients = await configManager.getInstalledClients();

    if (installedClients.length === 0) {
      throw new Error('No MCP clients installed. Please install a supported client first.');
    }

    let selectedClient: ClientType;
    if (installedClients.length > 1) {
      selectedClient = await promptForClientSelection(installedClients);
    } else {
      selectedClient = installedClients[0];
      console.log(`Using ${selectedClient} as the only installed client.`);
    }

    await ConfigManager.installPackage(pkg, [selectedClient]);
    console.log(`Updated ${selectedClient} configuration for ${pkg.name}`);

    const analyticsAllowed = await checkAnalyticsConsent();
    if (analyticsAllowed) {
      await trackInstallation(pkg.name);
    }

    await promptForRestart(selectedClient);
  } catch (error) {
    console.error('Failed to install package:', error);
    throw error;
  }
}

export async function uninstallPackage(packageName: string): Promise<void> {
  try {
    const configManager = new ConfigManager();
    const installedClients = await configManager.getInstalledClients();

    if (installedClients.length === 0) {
      throw new Error('No MCP clients installed');
    }

    let selectedClient: ClientType;
    if (installedClients.length > 1) {
      selectedClient = await promptForClientSelection(installedClients);
    } else {
      selectedClient = installedClients[0];
      console.log(`Using ${selectedClient} as the only installed client.`);
    }

    const pkg: Package = {
      name: packageName,
      description: '',
      vendor: '',
      sourceUrl: '',
      homepage: '',
      license: '',
      runtime: 'node'
    };

    await ConfigManager.uninstallPackage(pkg, [selectedClient]);
    console.log(`\nUninstalled ${packageName} from ${selectedClient}`);
    await promptForRestart(selectedClient);
  } catch (error) {
    console.error('Failed to uninstall package:', error);
    throw error;
  }
} 
