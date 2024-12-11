import { execSync } from 'child_process';
import { validateRequiredFields, getNewPackages } from './pr-check.js';

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

describe('getNewPackages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly parse package with URL from git diff', () => {
    const mockDiff = `
+  {
+    "name": "test-package",
+    "description": "Test Package",
+    "vendor": "test",
+    "sourceUrl": "https://github.com/test/repo",
+    "homepage": "https://github.com/test/repo",
+    "license": "MIT",
+    "runtime": "python"
+  }`;

    execSync.mockReturnValue(Buffer.from(mockDiff));

    const packages = getNewPackages({});
    expect(packages).toHaveLength(1);
    expect(packages[0].sourceUrl).toBe('https://github.com/test/repo');
  });

  it('should handle multiple packages in diff', () => {
    const mockDiff = `
+  {
+    "name": "package1",
+    "sourceUrl": "https://github.com/test/repo1"
+  },
+  {
+    "name": "package2",
+    "sourceUrl": "https://github.com/test/repo2"
+  }`;

    execSync.mockReturnValue(Buffer.from(mockDiff));

    const packages = getNewPackages({});
    expect(packages).toHaveLength(2);
    expect(packages[0].sourceUrl).toBe('https://github.com/test/repo1');
    expect(packages[1].sourceUrl).toBe('https://github.com/test/repo2');
  });

  it('should handle invalid JSON gracefully', () => {
    const mockDiff = `
+  {
+    "name": "broken-package",
+    "sourceUrl": "https://github.com/test/repo"
+    invalid-json-here
+  }`;

    execSync.mockReturnValue(Buffer.from(mockDiff));

    const packages = getNewPackages({});
    expect(packages).toHaveLength(0);
  });
});
