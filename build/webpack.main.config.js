const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");
const loadEnv = require("./loadEnv");

loadEnv();
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
  ],
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
};
