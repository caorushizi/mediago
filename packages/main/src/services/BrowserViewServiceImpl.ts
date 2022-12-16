import { BrowserView, OnBeforeSendHeadersListenerDetails } from "electron";
import {
  BrowserViewService,
  BrowserWindowService,
  LoggerService,
  MainWindowService,
  VideoRepostory,
} from "../interfaces";
import { Sessions } from "../utils/variables";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import isDev from "electron-is-dev";
import { nanoid } from "nanoid";
import SessionServiceImpl from "./SessionServiceImpl";
import { Video } from "../entity";

@injectable()
export default class BrowserViewServiceImpl implements BrowserViewService {
  private filter = { urls: ["*://*/*"] };
  private readonly view: BrowserView;
  webContents: Electron.WebContents;

  constructor(
    @inject(TYPES.BrowserWindowService)
    private browserWindow: BrowserWindowService,
    @inject(TYPES.MainWindowService)
    private mainWindow: MainWindowService,
    @inject(TYPES.SessionService)
    private session: SessionServiceImpl,
    @inject(TYPES.LoggerService)
    private logger: LoggerService,
    @inject(TYPES.VideoRepository)
    private videoRepository: VideoRepostory
  ) {
    const view = new BrowserView({
      webPreferences: {
        partition: Sessions.PERSIST_MEDIAGO,
      },
    });
    this.webContents = view.webContents;
    browserWindow.setBrowserView(view);
    view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
    this.view = view;

    this.beforeSendHandlerListener = this.beforeSendHandlerListener.bind(this);
  }

  async beforeSendHandlerListener(
    details: OnBeforeSendHeadersListenerDetails,
    callback: (beforeSendResponse: Electron.BeforeSendResponse) => void
  ): Promise<void> {
    const m3u8Reg = /\.m3u8$/;
    let cancel = false;
    const myURL = new URL(details.url);
    if (m3u8Reg.test(myURL.pathname)) {
      this.logger.logger.info("在窗口中捕获 m3u8 链接: ", details.url);
      const video: Video = {
        name: this.view.webContents.getTitle(),
        url: details.url,
      };
      const res = await this.videoRepository.insertVideo(video);
      console.log("res:", res);
      const value: SourceUrl = {
        id: nanoid(),
        title: this.view.webContents.getTitle(),
        url: details.url,
        headers: details.requestHeaders,
        duration: 0,
      };
      this.mainWindow.webContents.send("m3u8-notifier", value);
      cancel = true;
    }
    callback({
      cancel,
      requestHeaders: details.requestHeaders,
    });
  }

  init(): void {
    isDev && this.view.webContents.openDevTools();

    this.view.webContents.on("dom-ready", () => {
      const title = this.view.webContents.getTitle();
      const url = this.view.webContents.getURL();

      this.browserWindow.webContents.send("dom-ready", { title, url });

      this.view.webContents.setWindowOpenHandler((details) => {
        void this.view.webContents.loadURL(details.url);
        return { action: "deny" };
      });
    });

    this.session
      .get()
      .webRequest.onBeforeSendHeaders(
        this.filter,
        this.beforeSendHandlerListener
      );
  }

  getBounds(): Electron.Rectangle {
    return this.view.getBounds();
  }

  setAutoResize(options: Electron.AutoResizeOptions): void {
    this.view.setAutoResize(options);
  }

  setBackgroundColor(color: string): void {
    this.view.setBackgroundColor(color);
  }

  setBounds(bounds: Electron.Rectangle): void {
    this.view.setBounds(bounds);
  }
}
