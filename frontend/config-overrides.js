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

  // Adds plugins for global polyfills
  config.plugins = [
    ...config.plugins,
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ];

  return config;
};

// Override dev server configuration
module.exports.devServer = function(configFunction) {
  return function(proxy, allowedHost) {
    const config = configFunction(proxy, allowedHost);
    
    // Fix allowedHosts issue
    config.allowedHosts = ['localhost', '127.0.0.1'];
    
    return config;
  };
};
