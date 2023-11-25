const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

// env refers to webpack cli env vars
module.exports = {
  // single entrypoint
  entry: './src/index.ts',
  plugins: [
    // creates new html file
    new HtmlWebpackPlugin({
      // title: 'Created by webpack',
      template: './src/index.html'
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
      chunkFilename: "[id].[contenthash].css",
    })
  ],
  output: {
    // single output
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // load css
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'], // loaders are used in reverse order
      },
      // load images
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource', // built in module
      },
      // load fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // load sounds
      {
        test: /\.(ogg|mp3|wav)$/i,
        type: 'asset/resource',
      }
    ],
  },
  resolve: {
    // ensure that in case of same name different extension, imports are resolved with the given order
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    // ensures vendor hash will not change if vendors don't change.
    // If this wasn't here, order of resolving could change hash
    // and vendors bundle would change when our code changes
    moduleIds: 'deterministic',

    minimizer: [
      // `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`)
      `...`,
      new CssMinimizerPlugin(),
    ],
  }
};