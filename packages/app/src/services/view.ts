import { Config, View } from "../interfaces";
import { BrowserView } from "electron";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";

@injectable()
export default class ViewImpl implements View {
  public readonly view: BrowserView;
  constructor(@inject(TYPES.Config) private readonly config: Config) {
    this.view = new BrowserView();
  }

  async init(): Promise<void> {
    this.view.setBounds({ x: 0, y: 0, width: 300, height: 300 });
    await this.view.webContents.loadURL("https://electronjs.org");
  }
}
