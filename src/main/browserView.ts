import windowManager from "main/window/windowManager";
import { Windows } from "main/window/variables";
import { BrowserView } from "electron";
import { log } from "main/utils";
import { SourceUrl } from "types/common";
import { webviewPartition } from "main/variables";

const createBrowserView = (session: Electron.Session): void => {
  const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);

  const view = new BrowserView({
    webPreferences: {
      partition: webviewPartition,
    },
  });
  browserWindow.setBrowserView(view);
  view.setBounds({ x: 0, y: 0, height: 0, width: 0 });

  const { webContents } = view;
  if (process.env.NODE_ENV === "development") webContents.openDevTools();

  webContents.on("dom-ready", () => {
    const title = webContents.getTitle();
    const url = webContents.getURL();

    browserWindow.webContents.send("dom-ready", { title, url });

    webContents.setWindowOpenHandler((details) => {
      webContents.loadURL(details.url);
      return { action: "deny" };
    });
  });

  const filter = { urls: ["*://*/*"] };
  session.webRequest.onBeforeSendHeaders(
    filter,
    (
      details,
      callback: (beforeSendResponse: Electron.BeforeSendResponse) => void
    ) => {
      const m3u8Reg = /\.m3u8$/;
      let cancel = false;
      const myURL = new URL(details.url);
      if (m3u8Reg.test(myURL.pathname)) {
        log.info("在窗口中捕获 m3u8 链接: ", details.url);
        const { webContents: mainWindow } = windowManager.get(
          Windows.MAIN_WINDOW
        );
        const value: SourceUrl = {
          title: webContents.getTitle(),
          url: details.url,
          headers: details.requestHeaders,
          duration: 0,
        };
        mainWindow.send("m3u8", value);
        cancel = true;
      }
      callback({
        cancel,
        requestHeaders: details.requestHeaders,
      });
    }
  );
};

export default createBrowserView;
