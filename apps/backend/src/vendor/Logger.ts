import { injectable } from "inversify";
import { Vendor } from "../core/vendor.ts";
import winston from "winston";

@injectable()
export default class Logger implements Vendor {
  logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.json(),
      defaultMeta: { service: "user-service" },
      transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({
          filename: "./log/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "./log/combined.log" }),
      ],
    });

    //
    // If we're not in production then log to the `console` with the format:
    // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
    //
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
