import { contextBridge, dialog, ipcRenderer, shell } from "electron";
import { resolve } from "path";

const { send, invoke, on, removeListener } = ipcRenderer;

const apiKey = "electron";
const api: ElectronApi = {
  store: {
    set(key, value) {
      return invoke("set-store", key, value);
    },
    get(key) {
      return invoke("get-store", key);
    },
  },
  isWindows: process.platform === "win32",
  isMacos: process.platform === "darwin",
  ipcExec: (exeFile, args) => invoke("exec-command", exeFile, args),
  openBinDir: async () => {
    const binDir = await invoke("get-bin-dir");
    await shell.openPath(binDir);
  },
  openPath: (workspace) => shell.openPath(workspace),
  openConfigDir: async () => {
    const appName =
      process.env.NODE_ENV === "development"
        ? "media downloader dev"
        : "media downloader";
    const appPath = await invoke("get-path", "appData");
    await shell.openPath(resolve(appPath, appName));
  },
  openExternal: (url, options) => shell.openExternal(url, options),
  openBrowserWindow: (url) => send("open-browser-window", url),
  closeBrowserWindow: () => send("close-browser-window"),
  getPath: (name) => invoke("get-path", name),
  showOpenDialog: (options) => dialog.showOpenDialog(options),
  getBrowserView: () => invoke("get-current-window"),
  addEventListener: (channel, listener) => on(channel, listener),
  removeEventListener: (channel, listener) => removeListener(channel, listener),
  setBrowserViewRect: (rect) => send("set-browser-view-bounds", rect),
  closeMainWindow: () => send("close-main-window"),
  browserViewGoBack: () => send("browser-view-go-back"),
  browserViewReload: () => send("browser-view-reload"),
  browserViewLoadURL: (url) => send("browser-view-load-url", url),
  itemContextMenu: (item) => send("open-download-item-context-menu", item),
  minimize: (name) => send("window-minimize", name),
};

contextBridge.exposeInMainWorld(apiKey, api);
