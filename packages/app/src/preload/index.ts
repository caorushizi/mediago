import { ipcRenderer, contextBridge } from "electron";
import { MyAPI, Size } from "../../types/context";

const myAPI: MyAPI = {
  changeViewSize: (data: Size) => {
    ipcRenderer.send("change-window-size", data);
  },
  getVideoList: async () => {
    return await ipcRenderer.invoke("get-video-list");
  },
};

contextBridge.exposeInMainWorld("myAPI", myAPI);
