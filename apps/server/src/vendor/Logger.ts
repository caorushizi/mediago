import { mkdirSync } from "node:fs";
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
    mkdirSync(LOG_DIR, { recursive: true });

    const fileFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
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

    this.logger = winston.createLogger({
      level: "info",
      transports,
    });

    if (process.env.NODE_ENV !== "production") {
      this.logger.add(
        new winston.transports.Console({
          level: "debug",
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.printf(
              ({ timestamp, level, message, stack, ...meta }) => {
                const extras =
                  Object.keys(meta).length > 0
                    ? ` ${JSON.stringify(meta)}`
                    : "";
                const stackLine = stack ? `\n${stack}` : "";
                return `${timestamp} ${level}: ${message}${extras}${stackLine}`;
              },
            ),
          ),
        }),
      );
    }
  }

  info(...args: unknown[]) {
    const [message, ...meta] = this.normalizeArgs(args);
    return this.logger.info(message, ...meta);
  }

  warn(...args: unknown[]) {
    const [message, ...meta] = this.normalizeArgs(args);
    return this.logger.warn(message, ...meta);
  }

  error(...args: unknown[]) {
    const [message, ...meta] = this.normalizeArgs(args);
    return this.logger.error(message, ...meta);
  }

  debug(...args: unknown[]) {
    const [message, ...meta] = this.normalizeArgs(args);
    return this.logger.debug(message, ...meta);
  }

  private normalizeArgs(args: unknown[]): [string, ...unknown[]] {
    if (args.length === 0) {
      return [""];
    }

    const [first, ...rest] = args;
    const message =
      typeof first === "string"
        ? first
        : first instanceof Error
          ? first.message
          : this.stringify(first);

    const meta: unknown[] = [];

    if (first instanceof Error) {
      meta.push({
        error: {
          name: first.name,
          message: first.message,
          stack: first.stack,
        },
      });
    } else if (typeof first !== "string") {
      meta.push({ payload: first });
    }

    for (const item of rest) {
      if (item instanceof Error) {
        meta.push({
          error: {
            name: item.name,
            message: item.message,
            stack: item.stack,
          },
        });
      } else {
        meta.push(item);
      }
    }

    const normalized: [string, ...unknown[]] = [
      message,
      ...meta,
    ] as [string, ...unknown[]];
    return normalized;
  }

  private stringify(value: unknown): string {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return String(value);
    }

    if (value === null || value === undefined) {
      return "";
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  async init() {}
}
