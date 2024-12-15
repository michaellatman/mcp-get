module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      },
      modules: 'commonjs' // Force CommonJS modules for testing
    }],
    '@babel/preset-typescript'
  ],
  env: {
    test: {
      // Additional test-specific configuration
      plugins: []
    }
  }
};
