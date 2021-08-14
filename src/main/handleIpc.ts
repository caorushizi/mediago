import { app, dialog, ipcMain, shell } from "electron";
import { eventEmitter, failFn, successFn } from "./utils";
import windowManager from "./window/windowManager";
import { Windows } from "./window/variables";
import { M3u8DLArgs } from "types/common";
import executor from "main/executor";

const handleIpc = (): void => {
  ipcMain.on("exec", async (event, exeFile: string, args: M3u8DLArgs) => {
    let resp;
    try {
      const result = await executor(exeFile, args);
      resp = successFn(result);
    } catch (e) {
      resp = failFn(-1, e.message);
    }
    event.reply("execReply", resp);
  });

  ipcMain.on("closeMainWindow", async () => {
    app.quit();
  });

  ipcMain.on("openBrowserWindow", (e, url) => {
    // 开始计算主窗口的位置
    const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const browserView = browserWindow.getBrowserView();
    if (url) {
      browserView?.webContents.loadURL(url);
    }
    browserWindow.show();
  });

  ipcMain.on("closeBrowserWindow", () => {
    const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
    browserWindow.hide();
  });

  ipcMain.handle("openSettingWindow", async () => {
    const settingWindow = windowManager.get(Windows.SETTING_WINDOW);
    settingWindow.show();
    return true;
  });

  // @ts-ignore
  ipcMain.handle("getBinDir", async () => __bin__);

  ipcMain.on("open-url", async (event, url) => {
    await shell.openExternal(url);
  });

  ipcMain.on("setProxy", (e, enableProxy) => {
    eventEmitter.emit("setProxy", enableProxy);
  });

  ipcMain.handle("set-store", (e, key, value) => {
    return global.store.set(key, value);
  });

  ipcMain.handle("get-store", (e, key) => {
    return global.store.get(key);
  });

  ipcMain.handle("get-path", (e, name) => app.getPath(name));

  ipcMain.handle("show-open-dialog", (e, options: Electron.OpenDialogOptions) =>
    dialog.showOpenDialog(options)
  );
};

export default handleIpc;
