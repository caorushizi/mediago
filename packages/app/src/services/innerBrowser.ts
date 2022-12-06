import { Config, DB, InnerBrowser } from "../interfaces";
import { BrowserView } from "electron";
import { inject, injectable } from "inversify";
import TYPES from "../types";

@injectable()
export default class InnerBrowserImpl
  extends BrowserView
  implements InnerBrowser
{
  constructor(
    @inject(TYPES.Config) private readonly config: Config,
    @inject(TYPES.DB) private readonly db: DB
  ) {
    super();
    console.log(12312312312, "klklkkkkkk");
    console.log(this.initView);
  }

  async initView(test: number): Promise<void> {
    console.log(test);
  }
}
