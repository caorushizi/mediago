import { app, ipcMain } from "electron";
import { exec, failFn, successFn } from "./utils";
import store from "./store";
import logger from "./logger";

const handleIpc = () => {
  ipcMain.on("exec", async (event, exeFile, ...args) => {
    let resp;
    try {
      const result = await exec(exeFile, ...args);
      resp = successFn(result);
    } catch (e) {
      resp = failFn(-1, e.message);
    }
    event.reply("execReply", resp);
  });

  ipcMain.on("setLocalPath", async (event, ...args) => {
    let resp;
    try {
      const [key, value] = args;
      store.set(key, value);
      resp = successFn("");
    } catch (e) {
      logger.info("设置 store 失败：", e.message);
      resp = failFn(-1, "设置 store 失败");
    }
    event.reply("setLocalPathReply", resp);
  });

  ipcMain.handle("getLocalPath", (event, key) => {
    try {
      return store.get(key);
    } catch (e) {
      logger.info("获取 store 中数据失败：", e.message);
      return "";
    }
  });

  ipcMain.on("closeMainWindow", async () => {
    app.quit();
  });
};

export default handleIpc;
