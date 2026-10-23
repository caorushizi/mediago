const { app, BrowserWindow, contextBridge, ipcRenderer } = require("electron");

if (process.type === "renderer") {
  const exposePreload = () =>
    contextBridge.exposeInMainWorld("electron", {
      app: {
        getEnvPath: () => Promise.resolve({ coreUrl: "http://127.0.0.1" }),
      },
    });
  if (process.argv.includes("--fixture-delayed-preload")) {
    ipcRenderer.once("fixture:expose-preload", exposePreload);
  } else {
    exposePreload();
  }
} else {
  app.whenReady().then(() => {
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: __filename,
        additionalArguments: process.argv.includes("--fixture-delayed-preload")
          ? ["--fixture-delayed-preload"]
          : [],
      },
    });
    window.loadURL("http://localhost:8500/").catch(() => app.quit());
  });
  app.on("window-all-closed", () => app.quit());
}
