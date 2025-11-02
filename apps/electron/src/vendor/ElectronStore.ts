import { provide } from "@inversifyjs/binding-decorators";
import { appStoreDefaults, appStoreSharedOptions } from "@mediago/shared-node";
import Store from "electron-store";
import { injectable } from "inversify";
import { download, workspace } from "../utils";
import { AppStore } from "@mediago/shared-common";

@injectable()
@provide()
export default class StoreService extends Store<AppStore> {
  constructor() {
    super({
      ...appStoreSharedOptions,
      name: "config",
      cwd: workspace,
      defaults: {
        ...appStoreDefaults,
        local: download,
      },
    });
  }

  async init() {}
}
