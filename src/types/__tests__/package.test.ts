import { Package } from '../package';

describe('Package Type', () => {
  it('should allow node runtime', () => {
    const pkg: Package = {
      name: 'test-package',
      description: 'Test package',
      runtime: 'node',
      vendor: 'test',
      sourceUrl: 'https://test.com',
      homepage: 'https://test.com',
      license: 'MIT'
    };
    expect(pkg.runtime).toBe('node');
  });

  it('should allow python runtime', () => {
    const pkg: Package = {
      name: 'test-package',
      description: 'Test package',
      runtime: 'python',
      vendor: 'test',
      sourceUrl: 'https://test.com',
      homepage: 'https://test.com',
      license: 'MIT'
    };
    expect(pkg.runtime).toBe('python');
  });

  it('should allow custom runtime with command and args', () => {
    const pkg: Package = {
      name: 'test-package',
      description: 'Test package',
      runtime: 'custom',
      vendor: 'test',
      sourceUrl: 'https://test.com',
      homepage: 'https://test.com',
      license: 'MIT',
      command: 'custom-cmd',
      args: ['--arg1', '--arg2']
    };
    expect(pkg.runtime).toBe('custom');
    expect(pkg.command).toBe('custom-cmd');
    expect(pkg.args).toEqual(['--arg1', '--arg2']);
  });
});
