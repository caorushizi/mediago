const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");

module.exports = {
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
      {
        test: /\.jsx?$/,
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
