import { mkdirSync } from "node:fs";
import { provide } from "@inversifyjs/binding-decorators";
import { injectable } from "inversify";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import type { Vendor } from "../core/vendor";
import { LOG_DIR } from "../utils";

@injectable()
@provide()
export default class Logger implements Vendor {
  logger: winston.Logger;

  constructor() {
    this.logger = this.createLogger();
  }

  private createLogger() {
    mkdirSync(LOG_DIR, { recursive: true });

    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const transports = [
      new DailyRotateFile({
        filename: "mediago-%DATE%-error.log",
        level: "error",
        dirname: LOG_DIR,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxFiles: "30d",
        format: fileFormat,
      }),
      new DailyRotateFile({
        filename: "mediago-%DATE%-combined.log",
        dirname: LOG_DIR,
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxFiles: "30d",
        format: fileFormat,
      }),
    ];

    const logger = winston.createLogger({
      level: "info",
      transports,
    });

    // 非生产环境添加控制台输出
    logger.add(
      new winston.transports.Console({
        level: "debug",
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ""}`;
          }),
        ),
      }),
    );

    return logger;
  }

  info(message: string, ...meta: unknown[]) {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]) {
    this.logger.warn(message, ...meta);
  }

  error(message: string | Error, ...meta: unknown[]) {
    if (message instanceof Error) {
      this.logger.error(message.message, { error: message, ...meta });
    } else {
      this.logger.error(message, ...meta);
    }
  }

  debug(message: string, ...meta: unknown[]) {
    this.logger.debug(message, ...meta);
  }

  async init() {}
}
