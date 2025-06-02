import { Package } from '../types/package.js';
import { installPackage as installPkg } from '../utils/package-management.js';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { resolvePackages } from '../utils/package-resolver.js';

async function promptForRuntime(): Promise<'node' | 'python' | 'go' | 'http'> {
  const { runtime } = await inquirer.prompt<{ runtime: 'node' | 'python' | 'go' | 'http' }>([
    {
      type: 'list',
      name: 'runtime',
      message: 'What runtime does this package use?',
      choices: [
        { name: 'Node.js', value: 'node' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' },
        { name: 'HTTP URL', value: 'http' }
      ]
    }
  ]);
  return runtime;
}

function createUnknownPackage(packageName: string, runtime: 'node' | 'python' | 'go' | 'http', version?: string): Package {
  return {
    name: packageName,
    description: 'Unverified package',
    runtime,
    vendor: '',
    sourceUrl: '',
    homepage: '',
    license: '',
    url: runtime === 'http' ? packageName : undefined,
    version
  };
}

export async function installPackage(pkg: Package): Promise<void> {
  return installPkg(pkg);
}

export async function install(packageName: string, version?: string): Promise<void> {
  const packages = resolvePackages();
  const pkg = packages.find(p => p.name === packageName);

  const isUrl = /^https?:\/\//.test(packageName);

  if (!pkg) {
    if (isUrl) {
      const httpPkg = createUnknownPackage(packageName, 'http', version);
      await installPkg(httpPkg);
      return;
    }

    console.warn(chalk.yellow(`Package ${packageName} not found in the curated list.`));

    const { proceedWithInstall } = await inquirer.prompt<{ proceedWithInstall: boolean }>([
      {
        type: 'confirm',
        name: 'proceedWithInstall',
        message: `Would you like to try installing ${packageName}${version ? ` version ${version}` : ''} anyway? This package hasn't been verified.`,
        default: false
      }
    ]);

    if (proceedWithInstall) {
      console.log(chalk.cyan(`Proceeding with installation of ${packageName}${version ? ` version ${version}` : ''}...`));

      // Prompt for runtime for unverified packages
      const runtime = await promptForRuntime();

      // Create a basic package object for unverified packages
      const unknownPkg = createUnknownPackage(packageName, runtime, version);
      await installPkg(unknownPkg);
    } else {
      console.log('Installation cancelled.');
      process.exit(1);
    }
    return;
  }

  if (version) {
    pkg.version = version;
  }

  await installPkg(pkg);
}                    