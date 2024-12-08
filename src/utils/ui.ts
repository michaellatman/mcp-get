import { ResolvedPackage } from '../types/package.js';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';
import chalk from 'chalk';

export interface PackageChoice {
    name: string;
    value: ResolvedPackage;
    short: string;
}

export function formatPackageChoice(pkg: ResolvedPackage, showInstallStatus = false): PackageChoice {
    const prefix = showInstallStatus ? (pkg.isInstalled ? '✓ ' : '  ') : '';
    return {
        name: `${prefix}${pkg.name.padEnd(showInstallStatus ? 22 : 24)} │ ${
            pkg.description.length > 47 ? `${pkg.description.slice(0, 44)}...` : pkg.description.padEnd(49)
        } │ ${pkg.vendor.padEnd(19)} │ ${pkg.license.padEnd(14)}`,
        value: pkg,
        short: pkg.name
    };
}

export function createPackagePrompt(packages: ResolvedPackage[], options: {
    message?: string;
    showInstallStatus?: boolean;
} = {}) {
    const choices = packages.map(pkg => formatPackageChoice(pkg, options.showInstallStatus));

    return {
        type: 'autocomplete',
        name: 'selectedPackage',
        message: options.message || 'Search and select a package:',
        source: async (_answersSoFar: any, input: string) => {
            if (!input) return choices;

            return fuzzy
                .filter(input.toLowerCase(), choices, {
                    extract: (choice) => `${choice.value.name} ${choice.value.description} ${choice.value.vendor}`.toLowerCase()
                })
                .map(result => result.original);
        },
        pageSize: 10
    };
}

export async function confirmUninstall(packageName: string): Promise<boolean> {
    const { confirmUninstall } = await inquirer.prompt<{ confirmUninstall: boolean }>([
        {
            type: 'confirm',
            name: 'confirmUninstall',
            message: `Are you sure you want to uninstall ${packageName}?`,
            default: false
        }
    ]);
    return confirmUninstall;
}

export function printPackageListHeader(count: number, type: 'all' | 'installed' = 'all') {
    console.log(chalk.bold.cyan('\n📦 ' + (type === 'installed' ? 'Installed Packages' : 'Available Packages')));
    console.log(chalk.gray(`Found ${count} ${type === 'installed' ? 'installed ' : ''}packages\n`));
} 