import { Package, PackageHelper } from '../../src/types/package';

describe('Package Type', () => {
  describe('Custom Runtime', () => {
    it('should allow custom runtime with required fields', () => {
      const validPackage: Package = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        command: './run.sh',
        args: ['--test']
      };
      expect(validPackage.runtime).toBe('custom');
      expect(validPackage.command).toBeDefined();
      expect(validPackage.args).toBeDefined();
    });

    it('should enforce command field for custom runtime', () => {
      const invalidPackage: Partial<Package> = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        // command missing
        args: ['--test']
      };
      // TypeScript should catch this at compile time
      // @ts-expect-error
      const pkg: Package = invalidPackage;
      expect(pkg.command).toBeUndefined();
    });

    it('should allow node runtime without command and args', () => {
      const nodePackage: Package = {
        name: 'node-package',
        description: 'Node package',
        runtime: 'node',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };
      expect(nodePackage.runtime).toBe('node');
      expect(nodePackage.command).toBeUndefined();
      expect(nodePackage.args).toBeUndefined();
    });
  });
});
