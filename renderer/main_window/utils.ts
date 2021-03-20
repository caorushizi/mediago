const { ipcRenderer } = window.require("electron");

const ipcExec = (exeFile, ...args) =>
  new Promise((resolve) => {
    ipcRenderer.on("execReply", (event, arg) => {
      resolve(arg);
    });
    ipcRenderer.send("exec", exeFile, ...args);
  });

const ipcSetStore = (key, value) =>
  new Promise((resolve, reject) => {
    ipcRenderer.on("setLocalPathReply", (e, resp) => {
      const { code, msg, data } = resp;
      if (code === 0) {
        resolve(data);
      } else {
        reject(new Error(msg));
      }
    });
    ipcRenderer.send("setLocalPath", key, value);
  });

const ipcGetStore = (key) => ipcRenderer.invoke("getLocalPath", key);

export { ipcExec, ipcSetStore, ipcGetStore };
