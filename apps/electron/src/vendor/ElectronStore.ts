import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
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

    // Migrate bounds from old config.json (pre-refactoring)
    const oldConfigPath = resolve(workspace, "config.json");
    if (existsSync(oldConfigPath)) {
      try {
        const old = JSON.parse(readFileSync(oldConfigPath, "utf-8"));
        if (old.mainBounds) this.set("mainBounds", old.mainBounds);
        if (old.browserBounds) this.set("browserBounds", old.browserBounds);
        unlinkSync(oldConfigPath);
      } catch {
        // ignore migration errors
      }
    }
  }
}
