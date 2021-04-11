const concurrently = require("concurrently");

concurrently(
  [
    {
      command: "vite",
      name: "vite",
      prefixColor: "green",
      env: { NODE_ENV: "development" },
    },
    {
      command: "node esbuild.config.js && electron dist/main/index.js",
      name: "electron",
      prefixColor: "blue",
      env: { NODE_ENV: "development" },
    },
  ],
  {
    prefix: "name",
    killOthers: ["failure", "success"],
  }
).then(
  () => {
    // 成功
  },
  () => {
    // 失败
  }
);
