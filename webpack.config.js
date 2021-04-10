// webpack 中智能提示
const path = require("path");

const resolve = (dir) => path.join(__dirname, dir);

module.exports = {
  resolve: {
    alias: {
      types: resolve("types"),
      main: resolve("main"),
      renderer: resolve("renderer"),
    },
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
};
