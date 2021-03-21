import windowManager from "../window/windowManager";
import { WindowName } from "../window/variables";
import { BrowserView, session } from "electron";
import path from "path";
import { is } from "electron-util";
import XhrFilter from "./xhrFilter";

const xhrFilter = new XhrFilter();

const createBrowserView = async () => {
  const browserWindow = windowManager.get(WindowName.BROWSER_WINDOW);
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
  ses.webRequest.onBeforeSendHeaders(filter, xhrFilter.beforeSendHeaders);
};

export default createBrowserView;
