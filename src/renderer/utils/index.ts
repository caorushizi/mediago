import { M3u8DLArgs, MediaGoArgs } from "types/common";

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
  args: M3u8DLArgs | MediaGoArgs
): Promise<IpcRendererResp> =>
  new Promise((resolve) => {
    ipcRenderer.on(
      "execReply",
      (event: Electron.IpcRendererEvent, resp: IpcRendererResp) => {
        resolve(resp);
      }
    );
    ipcRenderer.send("exec", exeFile, args);
  });

const ipcSetStore = (key: string, value: any): Promise<any> =>
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

const ipcGetStore = (key: string): Promise<any> =>
  ipcRenderer.invoke("getLocalPath", key) as Promise<string>;

function isUrl(url: string): boolean {
  return /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/.test(
    url
  );
}

export { ipcExec, ipcSetStore, ipcGetStore, isUrl };
