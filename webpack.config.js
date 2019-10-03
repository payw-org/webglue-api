const nodeExternals = require('webpack-node-externals')

module.exports = {
  target: 'node',
  externals: [nodeExternals()],
  entry: {
    'webglue.api': ['babel-polyfill', './src/main.ts']
  },
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    path: __dirname + '/build/',
    filename: '[name].built.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      Configs: __dirname + '/src/configs/',
      // Database: __dirname + '/src/database/',
      // Resources: __dirname + '/src/resources/',
      // Routes: __dirname + '/src/routes/',
      //
      Database: __dirname + '/src/app/database/',
      Providers: __dirname + '/src/app/providers/',
      Helpers: __dirname + '/src/app/helpers'
      // Http: __dirname + '/src/app/http'
    }
  },
  module: {
    rules: [
      {
        test: [/\.js$/],
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        ]
      },
      {
        test: [/\.tsx?$/],
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      }
    ]
  }
}
