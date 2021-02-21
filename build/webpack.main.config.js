const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");
const loadEnv = require("./loadEnv");
const webpack = require("webpack");
const path = require("path");

loadEnv();
const binPathString = path.resolve(__dirname, "../.bin").replace(/\\/g, "\\\\");

module.exports = {
  entry: "./src/main/index.js",
  module: {
    rules: [
      ...rules,
      {
        test: /\.js$/,
        use: "babel-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new ESLintPlugin({
      exclude: "node_modules",
    }),
    new webpack.DefinePlugin({
      __bin__: `"${binPathString}"`,
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
};
