import { contextBridge, ipcRenderer } from "electron/renderer";

const apiKey = "electron";
const api: ElectronAPI = {
  index: () => ipcRenderer.invoke("index"),
};

contextBridge.exposeInMainWorld(apiKey, api);
