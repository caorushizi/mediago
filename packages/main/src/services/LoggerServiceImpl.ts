import { LoggerService } from "../interfaces";
import moment from "moment";
import path from "path";
import { workspace } from "../utils/variables";
import logger, { ElectronLog } from "electron-log";
import { injectable } from "inversify";

@injectable()
export default class LoggerServiceImpl implements LoggerService {
  logger: ElectronLog;

  constructor() {
    const datetime = moment().format("YYYY-MM-DD");
    const logPath = path.resolve(workspace, `logs/${datetime}-mediago.log`);
    logger.transports.console.format = "{h}:{i}:{s} {text}";
    logger.transports.file.getFile();
    logger.transports.file.resolvePath = () => logPath;
    this.logger = logger;
  }
  init(): void {
    // em,pty
  }
}
