import { provide } from "@inversifyjs/binding-decorators";
import {
  appStoreDefaults,
  appStoreSharedOptions,
  type AppStore,
} from "@mediago/shared-node";
import Store from "electron-store";
import { injectable } from "inversify";
import { download, workspace } from "../helper/index";

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
