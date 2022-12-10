import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { resolve } from "path";
import { inject, injectable } from "inversify";
import { Browser, Config } from "../interfaces";
import TYPES from "../types";

@injectable()
export default class BrowserWindowImpl
  extends BrowserWindow
  implements Browser
{
  constructor(@inject(TYPES.Config) private readonly config: Config) {
    const options: BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        preload: resolve(config.get("execDir"), "preload/index.js"),
      },
      frame: true,
      x: -1073,
      y: 240,
    };

    super(options);
  }

  async init(): Promise<void> {
    await this.loadURL("http://localhost:5173/browser");

    this.on("resize", () => {
      console.log(this.getPosition(), this.getSize());
    });
  }
}
