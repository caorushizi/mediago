import { app, ipcMain } from "electron";
import { exec, failFn, successFn } from "./utils";
import store from "./store";
import logger from "./logger";
import windowManager from "../window/windowManager";
import { Windows } from "../window/variables";
import { M3u8DLArgs } from "types/common";

const handleIpc = (): void => {
  ipcMain.on("exec", async (event, exeFile: string, args: M3u8DLArgs) => {
    let resp;
    try {
      const result = await exec(exeFile, args);
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

  ipcMain.on("openBrowserWindow", (e, url) => {
    // 开始计算主窗口的位置
    const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const browserView = browserWindow.getBrowserView();
    console.log("url: ", url);
    if (url) {
      browserView?.webContents.loadURL(url);
    }
    browserWindow.show();
  });

  ipcMain.on("closeBrowserWindow", () => {
    logger.info("closeBrowserWindow");
    const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
    browserWindow.hide();
  });

  ipcMain.handle("openSettingWindow", async () => {
    const settingWindow = windowManager.get(Windows.SETTING_WINDOW);
    settingWindow.show();
    return true;
  });

  ipcMain.handle("getBinDir", async () => __bin__);
};

export default handleIpc;
