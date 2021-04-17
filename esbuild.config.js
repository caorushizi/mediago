const { resolve } = require("path");

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`),
});

require("esbuild").buildSync({
  entryPoints: [
    resolve(__dirname, "./src/main/index.ts"),
    resolve(__dirname, "./src/main/preload.ts"),
  ],
  bundle: true,
  platform: "node",
  sourcemap: true,
  target: ["node10.4"],
  external: ["electron"],
  define: {
    // 开发环境中二进制可执行文件的路径
    __bin__: `"${resolve(__dirname, ".bin").replace(/\\/g, "\\\\")}"`,
  },
  outdir: resolve(__dirname, "./dist/main"),
});
