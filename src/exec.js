import { ipcRenderer } from "electron";

export default (name, path, url) =>
  new Promise((resolve) => {
    ipcRenderer.on("asynchronous-reply", (event, arg) => {
      resolve(arg);
    });
    ipcRenderer.send("asynchronous-message", name, path, url);
  });
