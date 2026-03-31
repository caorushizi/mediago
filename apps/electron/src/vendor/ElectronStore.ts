import { provide } from "@inversifyjs/binding-decorators";
import Store from "electron-store";
import { injectable } from "inversify";
import { workspace } from "../utils";

interface WindowBoundsStore {
  mainBounds?: Electron.Rectangle;
  browserBounds?: Electron.Rectangle;
}

@injectable()
@provide()
export default class ElectronStore extends Store<WindowBoundsStore> {
  constructor() {
    super({
      name: "window-state",
      cwd: workspace,
      defaults: {},
    });
  }
}
