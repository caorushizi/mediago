import { provide } from "@inversifyjs/binding-decorators";
import install, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from "electron-devtools-installer";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import ElectronLogger from "./ElectronLogger";

@injectable()
@provide()
export default class DevToolsService {
  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {}

  async init() {
    if (!isDev) {
      return;
    }
    // In the development environment, you can set environment variables to control whether developer tools are loaded
    if (!process.env.LOAD_DEVTOOLS) {
      return;
    }

    try {
      this.logger.debug("Loading devtools");
      await install([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS]);
      this.logger.debug("Devtools loaded");
    } catch (err: unknown) {
      this.logger.error("Failed to load devtools", err);
    }
  }
}
