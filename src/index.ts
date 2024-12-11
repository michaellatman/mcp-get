#!/usr/bin/env node

import { list } from './commands/list.js';
import { install } from './commands/install.js';
import { uninstall } from './commands/uninstall.js';
import { listInstalledPackages } from './commands/installed.js';
import { listClients } from './commands/clients.js';

const command = process.argv[2];
const packageName = process.argv[3];
const nonInteractive = process.argv.includes('--non-interactive');

async function main() {
  switch (command) {
    case 'list':
      await list(nonInteractive);
      break;
    case 'install':
      if (!packageName) {
        console.error('Please provide a package name to install');
        process.exit(1);
      }
      await install(packageName, nonInteractive);
      break;
    case 'uninstall':
      if (!packageName) {
        console.error('Please provide a package name to uninstall');
        process.exit(1);
      }
      await uninstall(packageName, nonInteractive);
      break;
    case 'installed':
      await listInstalledPackages();
      break;
    case 'clients':
      await listClients();
      break;
    default:
      console.log('Available commands:');
      console.log('  list                  List all available packages');
      console.log('  install <package>     Install a package');
      console.log('  uninstall [package]   Uninstall a package');
      console.log('  installed             List installed packages');
      console.log('  clients               List installed clients and config paths');
      process.exit(1);
  }
}

main();
