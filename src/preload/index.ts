import { contextBridge, ipcRenderer, shell } from "electron";
import { resolve } from "path";

const apiKey = "electron";
const api: ElectronApi = {
  store: {
    set(key, value) {
      return ipcRenderer.invoke("set-store", key, value);
    },
    get(key) {
      return ipcRenderer.invoke("get-store", key);
    },
  },
  isWindows: process.platform === "win32",
  isMacos: process.platform === "darwin",
  ipcExec: (exeFile, args) => ipcRenderer.invoke("exec-command", exeFile, args),
  openBinDir: async () => {
    const binDir = await ipcRenderer.invoke("get-bin-dir");
    await shell.openPath(binDir);
  },
  openPath: (workspace) => shell.openPath(workspace),
  openConfigDir: async () => {
    const appName =
      process.env.NODE_ENV === "development"
        ? "media downloader dev"
        : "media downloader";
    const appPath = await ipcRenderer.invoke("get-path", "appData");
    await shell.openPath(resolve(appPath, appName));
  },
  openExternal: (url, options) => shell.openExternal(url, options),
  openBrowserWindow: (url) => ipcRenderer.send("open-browser-window", url),
  closeBrowserWindow: () => ipcRenderer.send("close-browser-window"),
  getPath: (name) => ipcRenderer.invoke("get-path", name),
  showOpenDialog: (options) => {
    return ipcRenderer.invoke("show-open-dialog", options);
  },
  getBrowserView: () => ipcRenderer.invoke("get-current-window"),
  addEventListener: (channel, listener) => ipcRenderer.on(channel, listener),
  removeEventListener: (channel, listener) =>
    ipcRenderer.removeListener(channel, listener),
  setBrowserViewRect: (rect) =>
    ipcRenderer.send("set-browser-view-bounds", rect),
  closeMainWindow: () => ipcRenderer.send("close-main-window"),
  browserViewGoBack: () => ipcRenderer.send("browser-view-go-back"),
  browserViewReload: () => ipcRenderer.send("browser-view-reload"),
  browserViewLoadURL: (url) => ipcRenderer.send("browser-view-load-url", url),
  request: (options) => ipcRenderer.invoke("request", options),
  itemContextMenu: (item) =>
    ipcRenderer.send("open-download-item-context-menu", item),
  minimize: (name) => ipcRenderer.send("window-minimize", name),
};

contextBridge.exposeInMainWorld(apiKey, api);
