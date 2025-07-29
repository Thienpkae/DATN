const path = require('path');

module.exports = function override(config, env) {
  // Disable source maps to suppress warnings
  if (env === 'development') {
    config.devtool = false;
  }

  // Add fallbacks for Node.js modules that aren't available in the browser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "url": require.resolve("url"),
    "assert": require.resolve("assert")
  };

  // Add plugins for global polyfills
  config.plugins = [
    ...config.plugins,
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ];

  return config;
};
