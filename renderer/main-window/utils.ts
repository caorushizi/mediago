const { ipcRenderer } = window.require("electron");

const ipcExec = (exeFile: string, ...args: string[]) =>
  new Promise((resolve) => {
    ipcRenderer.on("execReply", (event: any, arg: any) => {
      resolve(arg);
    });
    ipcRenderer.send("exec", exeFile, ...args);
  });

const ipcSetStore = (key: string, value: string) =>
  new Promise((resolve, reject) => {
    ipcRenderer.on("setLocalPathReply", (e: any, resp: any) => {
      const { code, msg, data } = resp;
      if (code === 0) {
        resolve(data);
      } else {
        reject(new Error(msg));
      }
    });
    ipcRenderer.send("setLocalPath", key, value);
  });

const ipcGetStore = (key: any) => ipcRenderer.invoke("getLocalPath", key);

export { ipcExec, ipcSetStore, ipcGetStore };
