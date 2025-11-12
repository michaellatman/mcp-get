import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigManager, MCPConfig } from '../config-manager.js';
import { Package } from '../../types/package.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock fs, path, and os modules
jest.mock('fs');
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
  dirname: jest.fn((p: string) => p.split('/').slice(0, -1).join('/'))
}));
jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/user')
}));

describe('ConfigManager', () => {
  // Mock config paths
  const mockWinConfigPath = '/AppData/Roaming/Claude/claude_desktop_config.json';
  const mockMacConfigPath = '/Library/Application Support/Claude/claude_desktop_config.json';
  const mockLinuxConfigPath = '/.config/Claude/claude_desktop_config.json';
  
  // Mock preferences paths
  const mockWinPrefsPath = '/AppData/Roaming/mcp-get/preferences.json';
  const mockMacPrefsPath = '/.mcp-get/preferences.json';
  const mockLinuxPrefsPath = '/.mcp-get/preferences.json';
  
  // Sample config and package
  const sampleConfig: MCPConfig = {
    mcpServers: {
      'test-server': {
        runtime: 'node',
        command: 'npx',
        args: ['-y', 'test-server']
      }
    }
  };
  
  const samplePackage: Package = {
    name: 'test-package',
    description: 'Test package',
    runtime: 'node',
    vendor: 'test-vendor',
    sourceUrl: 'https://example.com',
    homepage: 'https://example.com',
    license: 'MIT'
  };
  
  const pythonPackage: Package = {
    name: 'test-python-pkg',
    description: 'Test python package',
    runtime: 'python',
    vendor: 'test-vendor',
    sourceUrl: 'https://example.com',
    homepage: 'https://example.com',
    license: 'MIT'
  };

  const httpPackage: Package = {
    name: 'https://example.com/server',
    description: 'Test http package',
    runtime: 'http',
    vendor: 'test-vendor',
    sourceUrl: 'https://example.com',
    homepage: 'https://example.com',
    license: 'MIT',
    url: 'https://example.com/server'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment vars
    process.env.APPDATA = '/AppData/Roaming';
    process.env.XDG_CONFIG_HOME = undefined; // Clear for tests
    
    // Set up fs mocks for exists and read/write
    const mockExists = jest.spyOn(fs, 'existsSync');
    mockExists.mockImplementation(() => true);
    
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(sampleConfig));
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => 'mock-dir' as any);
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('readConfig', () => {
    it('should read config correctly when file exists', () => {
      const config = ConfigManager.readConfig();
      expect(config).toEqual(sampleConfig);
      expect(fs.readFileSync).toHaveBeenCalled();
    });
    
    it('should return default config when file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
      const config = ConfigManager.readConfig();
      expect(config).toEqual({ mcpServers: {} });
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });
    
    it('should handle JSON parsing errors', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'invalid json');
      const config = ConfigManager.readConfig();
      expect(config).toEqual({ mcpServers: {} });
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error reading config:'), expect.any(Error));
    });
    
    it('should ensure mcpServers exists in read config', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify({ otherProp: 'value' }));
      const config = ConfigManager.readConfig();
      expect(config).toEqual({ otherProp: 'value', mcpServers: {} });
    });
  });
  
  describe('writeConfig', () => {
    it('should write config correctly', () => {
      ConfigManager.writeConfig(sampleConfig);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(sampleConfig, null, 2)
      );
    });
    
    it('should create directory if it does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
      ConfigManager.writeConfig(sampleConfig);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
    
    it('should handle errors when writing config', () => {
      const mockError = new Error('Write error');
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { throw mockError; });
      
      expect(() => ConfigManager.writeConfig(sampleConfig)).toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error writing config:'), mockError);
    });
  });
  
  describe('preferences management', () => {
    it('should read preferences correctly', () => {
      const mockPrefs = { allowAnalytics: true };
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(mockPrefs));
      
      const prefs = ConfigManager.readPreferences();
      expect(prefs).toEqual(mockPrefs);
    });
    
    it('should return empty object if preferences file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
      
      const prefs = ConfigManager.readPreferences();
      expect(prefs).toEqual({});
    });
    
    it('should handle JSON parsing errors in preferences', () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true);
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => 'invalid json');
      
      const prefs = ConfigManager.readPreferences();
      expect(prefs).toEqual({});
    });
    
    it('should write preferences correctly', () => {
      const mockPrefs = { allowAnalytics: true };
      
      ConfigManager.writePreferences(mockPrefs);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockPrefs, null, 2)
      );
    });
    
    it('should create directory if it does not exist when writing preferences', () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false);
      
      ConfigManager.writePreferences({ allowAnalytics: true });
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });
    
    it('should handle errors when writing preferences', () => {
      const mockError = new Error('Write error');
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { throw mockError; });
      
      expect(() => ConfigManager.writePreferences({ allowAnalytics: true })).toThrow(mockError);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error writing preferences:'), mockError);
    });

    it('should set allowAnalytics to false in CI environment', () => {
      // Save original environment
      const originalCI = process.env.CI;
      
      try {
        // Set CI environment variable for test
        process.env.CI = 'true';
        
        const writeSpy = jest.spyOn(ConfigManager, 'writePreferences');
        
        // Test the CI environment handling
        ConfigManager.writePreferences({ allowAnalytics: false });
        
        expect(writeSpy).toHaveBeenCalledWith({ allowAnalytics: false });
      } finally {
        // Restore original environment
        process.env.CI = originalCI;
      }
    });
  });
  
  describe('installPackage', () => {
    it('should add Node.js package to config', async () => {
      await ConfigManager.installPackage(samplePackage);
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['test-package']).toBeDefined();
      expect(writtenConfig.mcpServers['test-package'].runtime).toBe('node');
      expect(writtenConfig.mcpServers['test-package'].command).toBe('npx');
      expect(writtenConfig.mcpServers['test-package'].args).toEqual(['-y', 'test-package']);
    });
    
    it('should add Python package to config', async () => {
      await ConfigManager.installPackage(pythonPackage);
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['test-python-pkg']).toBeDefined();
      expect(writtenConfig.mcpServers['test-python-pkg'].runtime).toBe('python');
      expect(writtenConfig.mcpServers['test-python-pkg'].command).toBe('uvx');
      expect(writtenConfig.mcpServers['test-python-pkg'].args).toEqual(['test-python-pkg']);
    });

    it('should add HTTP package to config', async () => {
      await ConfigManager.installPackage(httpPackage);

      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);

      const key = 'https://example.com/server'.replace(/\//g, '-');
      expect(writtenConfig.mcpServers[key]).toBeDefined();
      expect(writtenConfig.mcpServers[key].runtime).toBe('http');
      expect(writtenConfig.mcpServers[key].url).toBe('https://example.com/server');
    });
    
    it('should include environment variables if provided', async () => {
      const envVars = { API_KEY: 'secret123' };
      await ConfigManager.installPackage(samplePackage, envVars);
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['test-package'].env).toEqual(envVars);
    });
    
    it('should handle packages with slashes in the name', async () => {
      const packageWithSlash: Package = {
        ...samplePackage,
        name: '@org/test-package'
      };
      
      await ConfigManager.installPackage(packageWithSlash);
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['@org-test-package']).toBeDefined();
    });
  });
  
  describe('uninstallPackage', () => {
    it('should remove package from config', async () => {
      // Setup a config with our test package
      const configWithPackage: MCPConfig = {
        mcpServers: {
          'test-package': {
            runtime: 'node',
            command: 'npx',
            args: ['-y', 'test-package']
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(configWithPackage);
      
      await ConfigManager.uninstallPackage('test-package');
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['test-package']).toBeUndefined();
    });
    
    it('should do nothing if package is not installed', async () => {
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce({ mcpServers: {} });
      
      await ConfigManager.uninstallPackage('non-existent-package');
      
      expect(console.log).toHaveBeenCalledWith('Package non-existent-package is not installed.');
    });
    
    it('should handle packages with slashes in the name', async () => {
      // Setup a config with our test package
      const configWithPackage: MCPConfig = {
        mcpServers: {
          '@org-test-package': {
            runtime: 'node',
            command: 'npx',
            args: ['-y', '@org/test-package']
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(configWithPackage);
      
      await ConfigManager.uninstallPackage('@org/test-package');
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['@org-test-package']).toBeUndefined();
    });
    
    it('should handle packages with slashes directly in config', async () => {
      // Setup a config with the package using exact name with slashes
      const configWithPackage: MCPConfig = {
        mcpServers: {
          '@org/test-package': {
            runtime: 'node',
            command: 'npx',
            args: ['-y', '@org/test-package']
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(configWithPackage);
      
      await ConfigManager.uninstallPackage('@org/test-package');
      
      const writeSpy = jest.spyOn(fs, 'writeFileSync');
      const writtenConfig = JSON.parse(writeSpy.mock.calls[0][1] as string);
      
      expect(writtenConfig.mcpServers['@org/test-package']).toBeUndefined();
    });
  });
  
  describe('isPackageInstalled', () => {
    it('should return true for installed packages', () => {
      const mockConfig: MCPConfig = {
        mcpServers: {
          'test-package': {
            runtime: 'node'
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(mockConfig);
      
      const isInstalled = ConfigManager.isPackageInstalled('test-package');
      expect(isInstalled).toBe(true);
    });
    
    it('should return false for packages that are not installed', () => {
      const mockConfig: MCPConfig = {
        mcpServers: {
          'other-package': {
            runtime: 'node'
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(mockConfig);
      
      const isInstalled = ConfigManager.isPackageInstalled('test-package');
      expect(isInstalled).toBe(false);
    });
    
    it('should handle packages with slashes in the name', () => {
      const mockConfig: MCPConfig = {
        mcpServers: {
          '@org-test-package': {
            runtime: 'node'
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(mockConfig);
      
      const isInstalled = ConfigManager.isPackageInstalled('@org/test-package');
      expect(isInstalled).toBe(true);
    });
    
    it('should detect packages stored with exact name including slashes', () => {
      const mockConfig: MCPConfig = {
        mcpServers: {
          '@org/test-package': {
            runtime: 'node'
          }
        }
      };
      
      jest.spyOn(ConfigManager, 'readConfig').mockReturnValueOnce(mockConfig);
      
      const isInstalled = ConfigManager.isPackageInstalled('@org/test-package');
      expect(isInstalled).toBe(true);
    });
  });
  
  describe('getConfigPath', () => {
    it('should return the current config path', () => {
      const configPath = ConfigManager.getConfigPath();
      expect(configPath).toBeDefined();
      expect(typeof configPath).toBe('string');
    });
  });
});