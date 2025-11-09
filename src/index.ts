#!/usr/bin/env node

import { list } from './commands/list.js';
import { install } from './commands/install.js';
import { uninstall } from './commands/uninstall.js';
import { listInstalledPackages } from './commands/installed.js';
import { updatePackage } from './auto-update.js';
import chalk from 'chalk';

const command = process.argv[2];
const packageName = process.argv[3];
const version = process.argv[4]; // Add support for version parameter

async function main() {
  // Show deprecation notice
  console.log(chalk.yellow('⚠️  NOTICE: mcp-get is deprecated and no longer actively maintained.'));
  console.log(chalk.cyan('We recommend using Smithery for MCP server management: https://smithery.ai'));
  console.log(chalk.gray('This tool will continue to work but will not receive updates.\n'));

  switch (command) {
    case 'list':
      await list();
      break;
    case 'install':
      if (!packageName) {
        console.error('Please provide a package name to install');
        process.exit(1);
      }
      await install(packageName, version); // Pass version to install function
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
      console.log('  install <package> [version]     Install a package with optional version');
      console.log('  uninstall [package]   Uninstall a package');
      console.log('  installed             List installed packages');
      console.log('  update                Update mcp-get to latest version');
      console.log('');
      console.log('Options:');
      console.log('  --ci                  Skip interactive prompts (for CI environments)');
      console.log('  --restart-claude      Automatically restart Claude without prompting');
      process.exit(1);
  }
}

main();
