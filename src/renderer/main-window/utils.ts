const { ipcRenderer }: { ipcRenderer: Electron.IpcRenderer } = window.require(
  "electron"
);

type IpcRendererResp = {
  code: number;
  msg: string;
  data: any;
};

const ipcExec = (
  exeFile: string,
  ...args: string[]
): Promise<IpcRendererResp> =>
  new Promise((resolve) => {
    ipcRenderer.on(
      "execReply",
      (event: Electron.IpcRendererEvent, arg: IpcRendererResp) => {
        resolve(arg);
      }
    );
    ipcRenderer.send("exec", exeFile, ...args);
  });

const ipcSetStore = (key: string, value: string): Promise<any> =>
  new Promise((resolve, reject) => {
    ipcRenderer.on(
      "setLocalPathReply",
      (e: Electron.IpcRendererEvent, resp: IpcRendererResp) => {
        const { code, msg, data } = resp;
        if (code === 0) {
          resolve(data);
        } else {
          reject(new Error(msg));
        }
      }
    );
    ipcRenderer.send("setLocalPath", key, value);
  });

const ipcGetStore = (key: string): Promise<string> =>
  ipcRenderer.invoke("getLocalPath", key) as Promise<string>;

export { ipcExec, ipcSetStore, ipcGetStore };
