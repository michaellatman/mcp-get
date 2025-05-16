import { Package, ResolvedPackage } from '../types/package.js';
import { ConfigManager } from './config-manager.js';
import { loadAllPackages, loadPackage } from './package-registry.js';

export function isPackageInstalled(packageName: string): boolean {
    return ConfigManager.isPackageInstalled(packageName);
}

export function resolvePackages(): ResolvedPackage[] {
    try {
        // Load packages from registry
        const packages: Package[] = loadAllPackages();
        
        if (packages.length === 0) {
            console.warn('No packages loaded from registry. This might be due to invalid package files.');
        }
        
        // Get installed packages from config
        const config = ConfigManager.readConfig();
        const installedServers = config.mcpServers || {};
        const installedPackageNames = Object.keys(installedServers);

        // Create a map of existing packages with both original and sanitized names
        const packageMap = new Map<string, Package>();
        for (const pkg of packages) {
            packageMap.set(pkg.name, pkg);
            // Also add sanitized version to map if different
            const sanitizedName = pkg.name.replace(/\//g, '-');
            if (sanitizedName !== pkg.name) {
                packageMap.set(sanitizedName, pkg);
            }
        }

        // Process installed packages
        const resolvedPackages = new Map<string, ResolvedPackage>();
        
        // First add all packages from package list
        for (const pkg of packages) {
            resolvedPackages.set(pkg.name, {
                ...pkg,
                runtime: pkg.runtime || 'node',
                isInstalled: false,
                isVerified: true
            });
        }

        // Then process installed packages
        for (const serverName of installedPackageNames) {
            // Convert server name back to package name
            const packageName = serverName.replace(/-/g, '/');
            const installedServer = installedServers[serverName];
            
            // Check if this package exists in our package list (either by original or sanitized name)
            const existingPkg = packageMap.get(packageName) || packageMap.get(serverName);
            
            if (existingPkg) {
                // Update existing package's installation status
                resolvedPackages.set(existingPkg.name, {
                    ...existingPkg,
                    runtime: existingPkg.runtime || installedServer?.runtime || 'node',
                    isInstalled: true,
                    isVerified: true
                });
            } else {
                // Add unverified package
                resolvedPackages.set(packageName, {
                    name: packageName,
                    description: 'Installed package (not in package list)',
                    vendor: 'Unknown',
                    sourceUrl: '',
                    homepage: '',
                    license: 'Unknown',
                    runtime: installedServer?.runtime || 'node',
                    isInstalled: true,
                    isVerified: false
                });
            }
        }

        return Array.from(resolvedPackages.values());
    } catch (error) {
        console.error('Error resolving packages:', error);
        return [];
    }
}

export function resolvePackage(packageName: string): ResolvedPackage | null {
    try {
        // Try to load the package from registry
        const pkg = loadPackage(packageName);
        
        // Also try with sanitized name if needed
        const sanitizedName = packageName.replace(/\//g, '-');
        
        if (!pkg) {
            // Check if it's an installed package (but not in registry)
            const config = ConfigManager.readConfig();
            const serverName = packageName.replace(/\//g, '-');
            const installedServer = config.mcpServers?.[serverName];
            
            if (installedServer) {
                return {
                    name: packageName,
                    description: 'Installed package (not in package list)',
                    vendor: 'Unknown',
                    sourceUrl: '',
                    homepage: '',
                    license: 'Unknown',
                    runtime: installedServer.runtime || 'node',
                    isInstalled: true,
                    isVerified: false
                };
            }
            return null;
        }

        // Check installation status
        const isInstalled = isPackageInstalled(packageName);

        return {
            ...pkg,
            runtime: pkg.runtime || 'node',  // Ensure runtime is set
            isInstalled,
            isVerified: true
        };
    } catch (error) {
        console.error('Error resolving package:', error);
        return null;
    }
}  