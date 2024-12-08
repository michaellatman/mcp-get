import chalk from 'chalk';
import { ResolvedPackage } from '../types/package.js';
import { displayPackageDetailsWithActions } from './display.js';
import { installPackage, uninstallPackage } from './package-management.js';
import { confirmUninstall } from './ui.js';

export type ActionHandler = {
    onInstall?: (pkg: ResolvedPackage) => Promise<void>;
    onUninstall?: (pkg: ResolvedPackage) => Promise<void>;
    onBack?: () => Promise<void>;
};

export async function handlePackageAction(
    pkg: ResolvedPackage,
    action: string,
    handlers: ActionHandler,
    showActionsAfter = true
): Promise<void> {
    switch (action) {
        case 'install':
            console.log(chalk.cyan(`\nPreparing to install ${pkg.name}...`));
            await installPackage(pkg);
            pkg.isInstalled = true;
            if (handlers.onInstall) {
                await handlers.onInstall(pkg);
            }
            break;
        case 'uninstall':
            if (await confirmUninstall(pkg.name)) {
                await uninstallPackage(pkg.name);
                console.log(chalk.green(`Successfully uninstalled ${pkg.name}`));
                pkg.isInstalled = false;
                if (handlers.onUninstall) {
                    await handlers.onUninstall(pkg);
                    return; // Don't show actions after uninstall if handler provided
                }
            } else {
                console.log('Uninstallation cancelled.');
            }
            break;
        case 'open':
            if (pkg.sourceUrl) {
                const open = (await import('open')).default;
                await open(pkg.sourceUrl);
                console.log(chalk.green(`\nOpened ${pkg.sourceUrl} in your browser`));
            } else {
                console.log(chalk.yellow('\nNo source URL available for this package'));
            }
            break;
        case 'back':
            if (handlers.onBack) {
                await handlers.onBack();
            }
            return;
        case 'exit':
            process.exit(0);
    }

    // Show actions again after completing an action (except for exit/back)
    if (showActionsAfter) {
        const nextAction = await displayPackageDetailsWithActions(pkg);
        await handlePackageAction(pkg, nextAction, handlers);
    }
} 