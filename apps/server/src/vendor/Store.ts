import { provide } from "@inversifyjs/binding-decorators";
import { appStoreDefaults, appStoreSharedOptions } from "@mediago/shared-node";
import Conf from "conf";
import { injectable } from "inversify";
import { DOWNLOAD_DIR, WORKSPACE } from "../constants";
import { AppStore } from "@mediago/shared-common";

@injectable()
@provide()
export default class StoreService extends Conf<AppStore> {
  constructor() {
    super({
      ...appStoreSharedOptions,
      projectName: "config",
      cwd: WORKSPACE,
      defaults: {
        ...appStoreDefaults,
        local: DOWNLOAD_DIR,
      },
    });
  }

  async init() {}
}
