import { BrowserWindow, BrowserWindowConstructorOptions, Menu } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { PlayerWindowService, VideoRepository } from "../interfaces";
import { TYPES } from "types";

@injectable()
export default class PlayerWindowServiceImpl implements PlayerWindowService {
  private options: BrowserWindowConstructorOptions;
  private window: BrowserWindow | null = null;

  constructor(
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {
    this.options = {
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
  }

  create(): BrowserWindow {
    const window = new BrowserWindow(this.options);

    Menu.setApplicationMenu(null);

    const url = isDev
      ? "http://localhost:8555/player"
      : "mediago://index.html/player";
    void window.loadURL(url);
    return window;
  }

  openWindow = async (id: number) => {
    if (!this.window || this.window.isDestroyed()) {
      this.window = this.create();
    }

    const video = await this.videoRepository.findVideo(id);
    if (!video) throw new Error("video not found");

    isDev && this.window.webContents.openDevTools();
    this.window.webContents.send("open-player-window", video.id);
    this.window.show();
  };
}
