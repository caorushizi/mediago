import { BrowserView, OnBeforeSendHeadersListenerDetails } from "electron";
import {
  BrowserViewService,
  LoggerService,
  MainWindowService,
  VideoRepository,
} from "../interfaces";
import { Sessions } from "../utils/variables";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import isDev from "electron-is-dev";
import SessionServiceImpl from "./SessionServiceImpl";
import { Video } from "../entity";
import { processHeaders } from "../utils";
import { VideoStatus } from "../entity/Video";

@injectable()
export default class BrowserViewServiceImpl implements BrowserViewService {
  private readonly filter = { urls: ["*://*/*"] };
  private readonly view: BrowserView;
  webContents: Electron.WebContents;

  constructor(
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.SessionService)
    private readonly session: SessionServiceImpl,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {
    const view = new BrowserView({
      webPreferences: {
        partition: Sessions.PERSIST_MEDIAGO,
      },
    });
    this.webContents = view.webContents;
    mainWindow.setBrowserView(view);
    view.setBounds({ x: 0, y: 0, height: 100, width: 100 });
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
        status: VideoStatus.Ready,
        headers: processHeaders(details.requestHeaders),
      };
      const res = await this.videoRepository.insertVideo(video);
      this.mainWindow.webContents.send("m3u8-notifier", res);
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

      this.mainWindow.webContents.send("dom-ready", { title, url });

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
