import { jest } from '@jest/globals';
import { ConfigManager } from '../../src/utils/config-manager';
import { Package } from '../../src/types/package';

describe('ConfigManager', () => {
  describe('Custom Runtime', () => {
    it('should handle custom runtime package installation', async () => {
      const customPackage: Package = {
        name: 'custom-package',
        description: 'Custom package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        command: './custom.sh',
        args: ['--custom']
      };

      // Mock ConfigManager methods
      const mockInstall = jest.spyOn(ConfigManager, 'installPackage');

      // Test installation
      await expect(ConfigManager.installPackage(customPackage)).resolves.not.toThrow();
      expect(mockInstall).toHaveBeenCalledWith(customPackage);

      // Cleanup
      mockInstall.mockRestore();
    });

    it('should validate custom runtime requirements before installation', async () => {
      const invalidPackage = {
        name: 'invalid-package',
        description: 'Invalid package',
        runtime: 'custom' as const,
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      } as Package; // Cast to Package to trigger validation

      // Mock ConfigManager methods to verify it's not called
      const mockInstall = jest.spyOn(ConfigManager, 'installPackage');

      // Test installation of invalid package
      await expect(ConfigManager.installPackage(invalidPackage)).rejects.toThrow('Custom runtime requires both command and args fields');
      expect(mockInstall).toHaveBeenCalledWith(invalidPackage);

      // Cleanup
      mockInstall.mockRestore();
    });
  });
});
