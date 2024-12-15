import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function getCurrentVersion(): Promise<string> {
  const packageJsonPath = new URL('../package.json', import.meta.url).pathname;
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

async function getLatestVersion(): Promise<string> {
  const { stdout } = await execAsync('npm show @michaellatman/mcp-get version');
  return stdout.trim();
}

export async function updatePackage(silent: boolean = false): Promise<void> {
  try {
    const currentVersion = await getCurrentVersion();
    const latestVersion = await getLatestVersion();

    if (currentVersion !== latestVersion) {
      if (!silent) {
        console.log(chalk.yellow(`\nA new version of mcp-get is available: ${latestVersion} (current: ${currentVersion})`));
        console.log(chalk.cyan('Installing update...'));
      }

      try {
        const { stdout, stderr } = await execAsync('npm install -g @michaellatman/mcp-get@latest');
        if (!silent) {
          if (stdout) console.log(stdout);
          if (stderr) console.error(chalk.yellow('Update process output:'), stderr);
          console.log(chalk.green('✓ Update complete\n'));
        }
      } catch (installError: any) {
        if (!silent) {
          console.error(chalk.red('Failed to install update:'), installError.message);
          if (installError.stdout) console.log('stdout:', installError.stdout);
          if (installError.stderr) console.error('stderr:', installError.stderr);
          console.error(chalk.yellow('Try running the update manually with sudo:'));
          console.error(chalk.cyan('  sudo npm install -g @michaellatman/mcp-get@latest'));
        }
        return;
      }
    } else {
      if (!silent) console.log(chalk.green('✓ mcp-get is already up to date\n'));
    }
  } catch (error: any) {
    if (!silent) {
      console.error(chalk.red('Failed to check for updates:'), error.message);
      if (error.stdout) console.log('stdout:', error.stdout);
      if (error.stderr) console.error('stderr:', error.stderr);
    }
    return;
  }
}

