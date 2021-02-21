const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");
const loadEnv = require("./loadEnv");
const webpack = require("webpack");
const path = require("path");

loadEnv();

const plugins = [
  new ESLintPlugin({
    exclude: "node_modules",
  }),
];

if (process.env.NODE_ENV === "development") {
  plugins.push(
    new webpack.DefinePlugin({
      __bin__: `"${path.resolve(__dirname, "../.bin").replace(/\\/g, "\\\\")}"`,
    })
  );
}

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
  plugins,
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
};
