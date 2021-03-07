const ESLintPlugin = require("eslint-webpack-plugin");
const rules = require("./webpack.rules");
const loadEnv = require("./loadEnv");
const webpack = require("webpack");

loadEnv();

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
    new webpack.DefinePlugin({
      "process.env.TD_APP_ID": JSON.stringify(process.env.TD_APP_ID),
      "process.env.TD_APP_VN": JSON.stringify(process.env.TD_APP_VN),
      "process.env.TD_APP_VC": JSON.stringify(process.env.TD_APP_VC),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
};
