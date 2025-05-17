import logger, { Logger } from "electron-log";
import { injectable } from "inversify";
import dayjs from "dayjs";
import path from "path";
import { appName, workspace } from "../helper/index.ts";

@injectable()
export default class ElectronLogger {
  logger: Logger;

  constructor() {
    const datetime = dayjs().format("YYYY-MM-DD");
    const logPath = path.resolve(workspace, `logs/${datetime}-${appName}.log`);
    logger.transports.console.format = "{h}:{i}:{s} {text}";
    logger.transports.file.getFile();
    logger.transports.file.resolvePathFn = () => logPath;
    this.logger = logger;
  }

  info(...args: unknown[]) {
    return this.logger.info(...args);
  }

  warn(...args: unknown[]) {
    return this.logger.warn(...args);
  }

  error(...args: unknown[]) {
    return this.logger.error(...args);
  }

  debug(...args: unknown[]) {
    return this.logger.debug(...args);
  }

  async init() {}
}
