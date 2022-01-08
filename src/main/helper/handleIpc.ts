import { app, dialog, ipcMain, Menu, shell } from "electron";
import { failFn, successFn } from "../utils";
import windowManager from "../window/windowManager";
import executor from "main/utils/executor";
import request from "main/utils/request";
import { binDir, Windows } from "main/utils/variables";

const handleIpc = (): void => {
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

  ipcMain.on("open-url", async (event, url) => {
    await shell.openExternal(url);
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

  ipcMain.on("open-download-item-context-menu", (e, item: SourceItem) => {
    const mainWin = windowManager.get(Windows.MAIN_WINDOW);
    const menu = Menu.buildFromTemplate([
      {
        label: "详情",
        click: () => {
          e.sender.send("download-context-menu-detail", item);
        },
      },
      { type: "separator" },
      {
        label: "下载",
        click: () => {
          e.sender.send("download-context-menu-download", item);
        },
      },
      {
        label: "删除",
        click: () => {
          e.sender.send("download-context-menu-delete", item);
        },
      },
      { type: "separator" },
      {
        label: "清空列表",
        click: () => {
          e.sender.send("download-context-menu-clear-all");
        },
      },
    ]);
    menu.popup({
      window: mainWin,
    });
  });

  ipcMain.on("window-minimize", (e, name) => {
    let window;
    if (name === "main") {
      window = windowManager.get(Windows.MAIN_WINDOW);
    } else {
      window = windowManager.get(Windows.BROWSER_WINDOW);
    }

    window.minimize();
  });

  ipcMain.handle(
    "exec-command",
    async (event, exeFile: string, args: M3u8DLArgs) => {
      try {
        const result = await executor(exeFile, args);
        return successFn(result);
      } catch (e: any) {
        return failFn(-1, e.message);
      }
    }
  );

  ipcMain.handle("get-bin-dir", async () => binDir);

  ipcMain.handle("set-store", (e, key, value) => global.store.set(key, value));

  ipcMain.handle("get-store", (e, key) => global.store.get(key));

  ipcMain.handle("get-path", (e, name) => app.getPath(name));

  ipcMain.handle("show-open-dialog", (e, options: Electron.OpenDialogOptions) =>
    dialog.showOpenDialog(options)
  );

  ipcMain.handle("get-current-window", (e) => {
    const currentWindow = windowManager.get(Windows.BROWSER_WINDOW);
    return currentWindow.getBrowserView();
  });

  ipcMain.handle("request", (e, options: RequestOptions) => request(options));
};

export default handleIpc;
