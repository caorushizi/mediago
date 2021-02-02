const ESLintPlugin = require("eslint-webpack-plugin");
const fs = require("fs");
const dotenv = require("dotenv");
const rules = require("./webpack.rules");

const envConfig = dotenv.parse(fs.readFileSync(".env.override"));
for (const k of Object.keys(envConfig)) {
  process.env[k] = envConfig[k];
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
  plugins: [
    new ESLintPlugin({
      exclude: "node_modules",
    }),
  ],
  resolve: {
    extensions: [".js", ".jsx", ".css"],
  },
};
