import { windowManager } from "./window";
import { BrowserView } from "electron";
import { Sessions, Windows } from "../utils/variables";
import { nanoid } from "nanoid";
import { sessionList } from "./session";
import logger from "./logger";

const createBrowserView = (): void => {
  const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);

  const view = new BrowserView({
    webPreferences: {
      partition: Sessions.PERSIST_MEDIAGO,
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
  sessionList
    .get(Sessions.PERSIST_MEDIAGO)!
    .webRequest.onBeforeSendHeaders(
      filter,
      (
        details,
        callback: (beforeSendResponse: Electron.BeforeSendResponse) => void
      ) => {
        const m3u8Reg = /\.m3u8$/;
        let cancel = false;
        const myURL = new URL(details.url);
        if (m3u8Reg.test(myURL.pathname)) {
          logger.info("在窗口中捕获 m3u8 链接: ", details.url);
          const { webContents: mainWindow } = windowManager.get(
            Windows.MAIN_WINDOW
          );
          const value: SourceUrl = {
            id: nanoid(),
            title: webContents.getTitle(),
            url: details.url,
            headers: details.requestHeaders,
            duration: 0,
          };
          mainWindow.send("m3u8-notifier", value);
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
