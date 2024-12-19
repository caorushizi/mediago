import { inject, injectable } from "inversify";
import { TYPES } from "../types.ts";
import isDev from "electron-is-dev";
import install, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import ElectronLogger from "./ElectronLogger.ts";
import { Vendor } from "../core/vendor.ts";

@injectable()
export default class DevToolsService implements Vendor {
  constructor(
    @inject(TYPES.ElectronLogger)
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
