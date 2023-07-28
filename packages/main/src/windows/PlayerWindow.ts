import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "types";
import Window from "./window";
import VideoRepository from "repository/videoRepository";

@injectable()
export default class PlayerWindowServiceImpl extends Window {
  url = isDev ? "http://localhost:8555/player" : "mediago://index.html/player";

  constructor(
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {
    super({
      width: 1100,
      minWidth: 1100,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    });
  }

  openWindow = async (id: number) => {
    if (!this.window) {
      this.window = this.create();
    }

    const video = await this.videoRepository.findVideo(id);
    if (!video) throw new Error("video not found");

    isDev && this.window.webContents.openDevTools();
    this.window.webContents.send("open-player-window", video.id);
    this.window.show();
  };
}
