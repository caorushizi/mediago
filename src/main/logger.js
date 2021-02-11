import log from "electron-log";

log.transports.console.format = "{h}:{i}:{s} {text}";

log.transports.file.getFile();

export default log;
