// eslint-disable-next-line import/no-extraneous-dependencies
const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules: rules.concat([
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
    ]),
  },
  plugins: [
    new ESLintPlugin({
      exclude: "node_modules",
    }),
  ],
};
