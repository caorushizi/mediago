module.exports = {
  packagerConfig: {
    extraResource: [".bin"],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "media_downloader",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./build/webpack.main.config.js",
        renderer: {
          config: "./build/webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/main_window/index.html",
              js: "./src/main_window/renderer.jsx",
              name: "main_window",
              preload: {
                js: "./src/main_window/preload.js",
              },
            },
            {
              html: "./src/browser_window/index.html",
              js: "./src/browser_window/renderer.jsx",
              name: "browser_window",
              preload: {
                js: "./src/browser_window/preload.js",
              },
            },
          ],
        },
      },
    ],
  ],
};
