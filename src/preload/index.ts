import { contextBridge, ipcRenderer, shell } from "electron";
import { M3u8DLArgs, MediaGoArgs } from "types/common";
import { resolve } from "path";

const apiKey = "electron";
const api: ElectronApi = {
  store: {
    set(key: string, value: string) {
      return ipcRenderer.invoke("set-store", key, value);
    },
    get(key?: string) {
      return ipcRenderer.invoke("get-store", key);
    },
  },
  isWindows: process.platform === "win32",
  isMacos: process.platform === "darwin",
  ipcExec: (
    exeFile: string,
    args: M3u8DLArgs | MediaGoArgs
  ): Promise<IpcRendererResp> => {
    return new Promise((resolve) => {
      ipcRenderer.on(
        "execReply",
        (event: Electron.IpcRendererEvent, resp: IpcRendererResp) => {
          resolve(resp);
        }
      );
      ipcRenderer.send("exec", exeFile, args);
    });
  },
  openBinDir: async () => {
    const binDir = await ipcRenderer.invoke("get-bin-dir");
    console.log(binDir, "binDir");
    await shell.openPath(binDir);
  },
  openPath: (workspace: string) => {
    return shell.openPath(workspace);
  },
  openConfigDir: async () => {
    const appName =
      process.env.NODE_ENV === "development"
        ? "media downloader dev"
        : "media downloader";
    const appPath = await ipcRenderer.invoke("get-path", "appData");
    await shell.openPath(resolve(appPath, appName));
  },
  openExternal: (url, options?) => {
    return shell.openExternal(url, options);
  },
  openBrowserWindow: (url?) => ipcRenderer.send("open-browser-window", url),
  closeBrowserWindow: () => ipcRenderer.send("close-browser-window"),
  getPath: (name) => ipcRenderer.invoke("get-path", name) as any,
  showOpenDialog: (options) => {
    return ipcRenderer.invoke("show-open-dialog", options);
  },
  getBrowserView: async () => ipcRenderer.invoke("get-current-window"),
  addEventListener: (channel, listener) => ipcRenderer.on(channel, listener),
  removeEventListener: (channel, listener) =>
    ipcRenderer.removeListener(channel, listener),
  setBrowserViewRect: (rect: BrowserViewRect) =>
    ipcRenderer.send("set-browser-view-bounds", rect),
  closeMainWindow: () => ipcRenderer.send("close-main-window"),
  browserViewGoBack: () => ipcRenderer.send("browser-view-go-back"),
  browserViewReload: () => ipcRenderer.send("browser-view-reload"),
  browserViewLoadURL: (url?: string) =>
    ipcRenderer.send("browser-view-load-url"),
  request: (options) => ipcRenderer.invoke("request", options),
};

contextBridge.exposeInMainWorld(apiKey, api);
