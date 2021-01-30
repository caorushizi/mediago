// eslint-disable-next-line import/no-extraneous-dependencies
const ESLintPlugin = require("eslint-webpack-plugin");

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: "./src/main.js",
  // Put your normal webpack config below here
  module: {
    // eslint-disable-next-line global-require
    rules: require("./webpack.rules"),
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
