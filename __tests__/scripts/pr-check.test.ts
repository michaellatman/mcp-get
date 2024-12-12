import { jest } from '@jest/globals';
import { validateRuntime } from '../../src/scripts/pr-check';
import { Package } from '../../src/types/package';

describe('PR Check Script', () => {
  describe('validateRuntime', () => {
    it('should validate custom runtime packages with required fields', () => {
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

      expect(() => validateRuntime(validPackage)).not.toThrow();
    });

    it('should reject custom runtime packages without command', () => {
      const invalidPackage = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom' as const,
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        args: ['--test']
      };

      expect(() => validateRuntime(invalidPackage)).toThrow(
        'Custom runtime requires both command and args fields'
      );
    });

    it('should reject custom runtime packages without args', () => {
      const invalidPackage = {
        name: 'test-package',
        description: 'Test package',
        runtime: 'custom' as const,
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT',
        command: './run.sh'
      };

      expect(() => validateRuntime(invalidPackage)).toThrow(
        'Custom runtime requires both command and args fields'
      );
    });

    it('should allow non-custom runtime packages without command and args', () => {
      const nodePackage: Package = {
        name: 'node-package',
        description: 'Node package',
        runtime: 'node',
        vendor: 'test',
        sourceUrl: 'https://test.com',
        homepage: 'https://test.com',
        license: 'MIT'
      };

      expect(() => validateRuntime(nodePackage)).not.toThrow();
    });
  });
});
