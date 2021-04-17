import { contextBridge, ipcRenderer } from "electron";

console.log("=====");

contextBridge.exposeInMainWorld("myAPI", {
  openSettingWindow: () => ipcRenderer.invoke("openSettingWindow"),
});
