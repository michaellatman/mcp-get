import { validateRequiredFields } from './pr-check.js';

describe('validateRequiredFields', () => {
  test('accepts valid GitHub URLs', () => {
    const pkg = {
      name: 'test-package',
      description: 'Test package',
      vendor: 'Test Vendor',
      sourceUrl: 'https://github.com/owner/repo',
      homepage: 'https://github.com/owner/repo',
      license: 'MIT',
      runtime: 'node'
    };
    expect(() => validateRequiredFields(pkg)).not.toThrow();
  });

  test('rejects invalid URLs without protocol', () => {
    const pkg = {
      name: 'test-package',
      description: 'Test package',
      vendor: 'Test Vendor',
      sourceUrl: 'github.com/owner/repo',
      homepage: 'https://github.com/owner/repo',
      license: 'MIT',
      runtime: 'node'
    };
    expect(() => validateRequiredFields(pkg)).toThrow(/invalid sourceUrl URL/);
  });

  test('accepts both http and https protocols', () => {
    const pkg = {
      name: 'test-package',
      description: 'Test package',
      vendor: 'Test Vendor',
      sourceUrl: 'http://github.com/owner/repo',
      homepage: 'https://github.com/owner/repo',
      license: 'MIT',
      runtime: 'node'
    };
    expect(() => validateRequiredFields(pkg)).not.toThrow();
  });
});
