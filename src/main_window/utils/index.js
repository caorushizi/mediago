import { ipcRenderer } from "electron";

const ipcExec = (name, path, url) =>
  new Promise((resolve) => {
    ipcRenderer.on("execReply", (event, arg) => {
      resolve(arg);
    });
    ipcRenderer.send("exec", name, path, url);
  });

const ipcSetStore = (key, value) =>
  new Promise((resolve) => {
    ipcRenderer.on("setLocalPathReply", () => {
      resolve();
    });
    ipcRenderer.send("setLocalPath", key, value);
  });

const ipcGetStore = (key) => ipcRenderer.invoke("getLocalPath", key);

export { ipcExec, ipcSetStore, ipcGetStore };
