import { ipcRenderer } from "electron";

const ipcExec = (name, path, url, headers) =>
  new Promise((resolve) => {
    ipcRenderer.on("execReply", (event, arg) => {
      resolve(arg);
    });
    ipcRenderer.send("exec", name, path, url, headers);
  });

const ipcSetStore = (key, value) =>
  new Promise((resolve) => {
    ipcRenderer.on("setLocalPathReply", () => {
      resolve();
    });
    ipcRenderer.send("setLocalPath", key, value);
  });

const ipcGetStore = (key) => ipcRenderer.invoke("getLocalPath", key);

const onEvent = (eventId, label, mapKv) => {
  try {
    console.log(eventId);
    window.TDAPP.onEvent(eventId, label, mapKv);
  } catch (err) {
    console.log(`${eventId}=>err`, err);
  }
};

export { ipcExec, ipcSetStore, ipcGetStore, onEvent };
