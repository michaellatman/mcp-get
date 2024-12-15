#!/usr/bin/env node

import { list } from './commands/list.js';
import { install } from './commands/install.js';
import { uninstall } from './commands/uninstall.js';
import { listInstalledPackages } from './commands/installed.js';
import { updatePackage } from './auto-update.js';

const command = process.argv[2];
const packageName = process.argv[3];

async function main() {
  switch (command) {
    case 'list':
      await list();
      break;
    case 'install':
      if (!packageName) {
        console.error('Please provide a package name to install');
        process.exit(1);
      }
      await install(packageName);
      break;
    case 'uninstall':
      await uninstall(packageName);
      break;
    case 'installed':
      await listInstalledPackages();
      break;
    case 'update':
      await updatePackage();
      break;
    default:
      console.log('Available commands:');
      console.log('  list                  List all available packages');
      console.log('  install <package>     Install a package');
      console.log('  uninstall [package]   Uninstall a package');
      console.log('  installed             List installed packages');
      console.log('  update                Update mcp-get to latest version');
      process.exit(1);
  }
}

main();
