import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  OnBeforeSendHeadersListenerDetails,
  session,
} from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types";
import { LoggerService, MainWindowService } from "../interfaces";
import { PERSIST_WEBVIEW } from "helper/variables";

@injectable()
export default class MainWindowServiceImpl
  extends BrowserWindow
  implements MainWindowService
{
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
  ) {
    const options: BrowserWindowConstructorOptions = {
      width: 1100,
      minWidth: 1100,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    };
    super(options);

    this.beforeSendHandlerListener = this.beforeSendHandlerListener.bind(this);
  }

  init(): void {
    const url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
    void this.loadURL(url);

    isDev && this.webContents.openDevTools();

    this.once("ready-to-show", () => {
      this.show();
    });
  }

  async beforeSendHandlerListener(
    details: OnBeforeSendHeadersListenerDetails,
    callback: (beforeSendResponse: Electron.BeforeSendResponse) => void
  ): Promise<void> {
    const m3u8Reg = /\.m3u8$/;
    let cancel = false;
    const myURL = new URL(details.url);
    if (m3u8Reg.test(myURL.pathname)) {
      this.logger.info("在窗口中捕获 m3u8 链接: ", details.url);
      // TODO: 这里处理请求
      cancel = true;
    }
    callback({
      cancel,
      requestHeaders: details.requestHeaders,
    });
  }
}
