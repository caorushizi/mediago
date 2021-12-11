import { app, dialog, ipcMain, shell } from "electron";
import { failFn, successFn } from "./utils";
import windowManager from "./window/windowManager";
import { M3u8DLArgs } from "types/common";
import executor from "main/executor";
import request from "main/request";
import { Windows } from "main/variables";

const handleIpc = (): void => {
  ipcMain.handle("exec", async (event, exeFile: string, args: M3u8DLArgs) => {
    let resp;
    try {
      const result = await executor(exeFile, args);
      resp = successFn(result);
    } catch (e: any) {
      resp = failFn(-1, e.message);
    }
    return resp;
  });

  ipcMain.on("close-main-window", async () => {
    app.quit();
  });

  ipcMain.on("open-browser-window", (e, url) => {
    // 开始计算主窗口的位置
    const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const browserView = browserWindow.getBrowserView();
    browserView?.webContents.loadURL(url || "https://baidu.com");
    browserWindow.show();
  });

  ipcMain.on("close-browser-window", () => {
    const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
    browserWindow.hide();
  });

  // @ts-ignore
  ipcMain.handle("get-bin-dir", async () => __bin__);

  ipcMain.on("open-url", async (event, url) => {
    await shell.openExternal(url);
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

  ipcMain.handle("get-current-window", (e) => {
    const currentWindow = windowManager.get(Windows.BROWSER_WINDOW);
    return currentWindow.getBrowserView();
  });

  ipcMain.on("set-browser-view-bounds", (e, rect) => {
    const currentWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const view = currentWindow.getBrowserView();
    if (view) view.setBounds(rect);
  });

  ipcMain.on("browser-view-go-back", (e) => {
    const currentWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const view = currentWindow.getBrowserView();
    if (view) {
      const canGoBack = view.webContents.canGoBack();
      if (canGoBack) view.webContents.goBack();
    }
  });

  ipcMain.on("browser-view-reload", (e) => {
    const currentWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const view = currentWindow.getBrowserView();
    if (view) view.webContents.reload();
  });

  ipcMain.on("browser-view-load-url", (e, url: string) => {
    const currentWindow = windowManager.get(Windows.BROWSER_WINDOW);
    const view = currentWindow.getBrowserView();
    if (view) view.webContents.loadURL(url || "https://baidu.com");
  });

  ipcMain.handle("request", (e, options: RequestOptions) => request(options));
};

export default handleIpc;
