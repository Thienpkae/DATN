// Webpack configuration for performance optimization
const path = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isDevelopment = !isProduction;

  return {
    // Entry points for code splitting
    entry: {
      main: './src/index.js',
      vendor: ['react', 'react-dom', 'antd'],
    },

    // Output configuration
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: isProduction 
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/[name].js',
      chunkFilename: isProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
      publicPath: '/',
      clean: true,
    },

    // Optimization configuration
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            mangle: {
              safari10: true,
            },
            output: {
              comments: false,
              ascii_only: true,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],

      // Code splitting configuration
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for third-party libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          
          // Ant Design chunk
          antd: {
            test: /[\\/]node_modules[\\/]antd[\\/]/,
            name: 'antd',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          
          // React chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },

      // Runtime chunk
      runtimeChunk: {
        name: 'runtime',
      },
    },

    // Module resolution
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@styles': path.resolve(__dirname, 'src/styles'),
      },
      fallback: {
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
      },
    },

    // Module rules
    module: {
      rules: [
        // JavaScript/TypeScript
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', { useBuiltIns: 'entry', corejs: 3 }],
                  '@babel/preset-react',
                ],
                plugins: [
                  '@babel/plugin-syntax-dynamic-import',
                  '@babel/plugin-proposal-class-properties',
                  // Ant Design import optimization
                  ['import', {
                    libraryName: 'antd',
                    libraryDirectory: 'es',
                    style: true,
                  }],
                ],
                cacheDirectory: true,
              },
            },
          ],
        },

        // CSS
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  localIdentName: isProduction 
                    ? '[hash:base64:8]' 
                    : '[name]__[local]--[hash:base64:5]',
                },
              },
            },
            'postcss-loader',
          ],
        },

        // Images
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb
            },
          },
          generator: {
            filename: 'static/media/[name].[hash:8][ext]',
          },
        },

        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/fonts/[name].[hash:8][ext]',
          },
        },
      ],
    },

    // Plugins
    plugins: [
      // Define environment variables
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.REACT_APP_VERSION': JSON.stringify(process.env.npm_package_version),
      }),

      // Provide polyfills
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),

      // Compression for production
      ...(isProduction ? [
        new CompressionPlugin({
          algorithm: 'gzip',
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        }),
      ] : []),

      // Bundle analyzer for development
      ...(isDevelopment && process.env.ANALYZE ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        }),
      ] : []),
    ],

    // Development server
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },

    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000, // 500kb
      maxAssetSize: 512000, // 500kb
    },

    // Source maps
    devtool: isProduction ? 'source-map' : 'eval-source-map',

    // Cache configuration
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    },

    // Stats configuration
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    },
  };
};
