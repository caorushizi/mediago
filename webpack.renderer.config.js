// eslint-disable-next-line import/no-extraneous-dependencies
const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules: [
      ...rules,
      {
        test: /\.(s?css)$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          { loader: "sass-loader" },
        ],
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
