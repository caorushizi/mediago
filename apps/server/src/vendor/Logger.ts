import fs from "node:fs";
import { provide } from "@inversifyjs/binding-decorators";
import { injectable } from "inversify";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import type { Vendor } from "../core/vendor";
import { LOG_DIR } from "../helper";

@injectable()
@provide()
export default class Logger implements Vendor {
  logger: winston.Logger;

  constructor() {
    fs.mkdirSync(LOG_DIR, { recursive: true });

    const transports = [
      new DailyRotateFile({
        filename: "mediago-%DATE%-error.log",
        level: "error",
        dirname: LOG_DIR,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxFiles: "30d",
      }),
      new DailyRotateFile({
        filename: "mediago-%DATE%-combined.log",
        dirname: LOG_DIR,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxFiles: "30d",
      }),
    ];

    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.json(),
      transports,
    });

    if (process.env.NODE_ENV !== "production") {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
      );
    }
  }

  info(...args: unknown[]) {
    return this.logger.info(args);
  }

  warn(...args: unknown[]) {
    return this.logger.warn(args);
  }

  error(...args: unknown[]) {
    return this.logger.error(args);
  }

  debug(...args: unknown[]) {
    return this.logger.debug(args);
  }

  async init() {}
}
