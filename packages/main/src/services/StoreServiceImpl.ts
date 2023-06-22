import Store from "electron-store";
import { injectable } from "inversify";
import { AppStore } from "main";
import { download, workspace } from "../helper/variables";
import { StoreService } from "../interfaces";

@injectable()
export default class StoreServiceImpl
  extends Store<AppStore>
  implements StoreService
{
  constructor() {
    super({
      name: "config",
      cwd: workspace,
      fileExtension: "json",
      watch: true,
      defaults: {
        local: download,
        promptTone: true,
        proxy: "",
        useProxy: false,
        deleteSegments: true,
        openInNewWindow: false,
        blockAds: true,
      },
    });
  }

  init(): void {
    // empty
  }
}
