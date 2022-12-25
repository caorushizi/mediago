import "reflect-metadata";
import { container } from "./inversify.config";
import { TYPES } from "./types";
import { App } from "./interfaces";
import { app, protocol } from "electron";
import { defaultScheme, workspace } from "./utils/variables";
import moment from "moment";
import path from "path";
import logger from "electron-log";

const start = async () => {
  const datetime = moment().format("YYYY-MM-DD");
  const logPath = path.resolve(workspace, `logs/${datetime}-mediago.log`);
  logger.transports.console.format = "{h}:{i}:{s} {text}";
  logger.transports.file.getFile();
  logger.transports.file.resolvePath = () => logPath;
  protocol.registerSchemesAsPrivileged([
    {
      scheme: defaultScheme,
      privileges: {
        secure: true,
        standard: true,
      },
    },
  ]);
  await app.whenReady();
  const mediago = container.get<App>(TYPES.App);
  mediago.init();
};

void start();
