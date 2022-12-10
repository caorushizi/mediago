import { ipcRenderer, contextBridge } from "electron";
import { MyAPI, Size } from "../../types/context";
import { GET_VIDEO_LIST } from "../channels";

const myAPI: MyAPI = {
  changeViewSize: (data: Size) => {
    ipcRenderer.send("change-window-size", data);
  },
  getVideoList: async () => {
    return await ipcRenderer.invoke(GET_VIDEO_LIST);
  },
};

contextBridge.exposeInMainWorld("myAPI", myAPI);
