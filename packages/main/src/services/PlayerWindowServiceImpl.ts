import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Menu,
  Event,
} from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { PlayerWindowService, VideoRepository } from "../interfaces";
import { TYPES } from "types";

@injectable()
export default class PlayerWindowServiceImpl
  extends BrowserWindow
  implements PlayerWindowService
{
  constructor(
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
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
  }

  init(): void {
    Menu.setApplicationMenu(null);

    const url = isDev
      ? "http://localhost:8555/player"
      : "mediago://index.html/player";
    void this.loadURL(url);

    this.once("ready-to-show", this.readyToShow);
    this.on("close", this.closeWindow);
  }

  closeWindow = (e: Event) => {
    e.preventDefault();
    this.hide();
  };

  readyToShow = () => {
    this.show();
    isDev && this.webContents.openDevTools();
  };

  openWindow = async (id: number) => {
    const video = await this.videoRepository.findVideo(id);
    if (!video) throw new Error("video not found");

    this.webContents.send("open-player-window", video.id);
    this.show();
  };
}
