import path from "path";
import moment from "moment";
import logger from "electron-log";
import { workspace } from "main/utils/variables";

const datetime = moment().format("YYYY-MM-DD");
const logPath = path.resolve(workspace, `logs/${datetime}-mediago.log`);
logger.transports.console.format = "{h}:{i}:{s} {text}";
logger.transports.file.getFile();
logger.transports.file.resolvePath = () => logPath;

export default logger;
