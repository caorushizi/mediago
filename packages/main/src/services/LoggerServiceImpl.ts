import logger, { ElectronLog } from "electron-log";
import { injectable } from "inversify";
import dayjs from "dayjs";
import path from "path";
import { appName, workspace } from "../helper";
import { LoggerService } from "../interfaces";

@injectable()
export default class LoggerServiceImpl implements LoggerService {
  logger: ElectronLog;

  constructor() {
    const datetime = dayjs().format("YYYY-MM-DD");
    const logPath = path.resolve(workspace, `logs/${datetime}-${appName}.log`);
    logger.transports.console.format = "{h}:{i}:{s} {text}";
    logger.transports.file.getFile();
    logger.transports.file.resolvePath = () => logPath;
    this.logger = logger;
  }

  info(...args: any[]) {
    return this.logger.info(...args);
  }

  warn(...args: any[]) {
    return this.logger.warn(...args);
  }

  error(...args: any[]) {
    return this.logger.error(...args);
  }

  debug(...args: any[]) {
    return this.logger.debug(...args);
  }
}
