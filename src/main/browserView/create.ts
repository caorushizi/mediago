import windowManager from "main/window/windowManager";
import { Windows } from "main/window/variables";
import { BrowserView, session } from "electron";
import path from "path";
import { is } from "electron-util";
import { log } from "main/utils";
import { SourceUrl } from "types/common";

const createBrowserView = (): void => {
  const browserWindow = windowManager.get(Windows.BROWSER_WINDOW);
  const partition = "persist:webview";
  const ses = session.fromPartition(partition);

  ses.protocol.registerFileProtocol("webview", (request, callback) => {
    const url = request.url.substr(10);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

  const view = new BrowserView({ webPreferences: { partition } });
  browserWindow.setBrowserView(view);
  browserWindow.webContents.send("viewReady");
  view.setBounds({ x: 0, y: 0, height: 0, width: 0 });

  const { webContents } = view;
  if (is.development) webContents.openDevTools();

  webContents.on("dom-ready", () => {
    webContents.on("new-window", async (event, url) => {
      event.preventDefault();
      await webContents.loadURL(url);
    });
  });

  const filter = { urls: ["*://*/*"] };
  ses.webRequest.onBeforeSendHeaders(
    filter,
    (
      details: Electron.OnBeforeSendHeadersListenerDetails,
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
