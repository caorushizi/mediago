import { Container } from "inversify";
import { TYPES } from "./types";
import {
  App,
  BrowserViewService,
  BrowserWindowService,
  ConfigService,
  Controller,
  DataService,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  SessionService,
  UpdateService,
} from "./interfaces";
import MainWindowServiceImpl from "./services/MainWindowServiceImpl";
import BrowserWindowServiceImpl from "./services/BrowserWindowServiceImpl";
import MediaGo from "./app";
import BrowserViewServiceImpl from "./services/BrowserViewServiceImpl";
import ConfigServiceImpl from "./services/ConfigServiceImpl";
import DataServiceImpl from "./services/DataServiceImpl";
import IpcHandlerServiceImpl from "./services/IpcHandlerServiceImpl";
import ProtocolServiceImpl from "./services/ProtocolServiceImpl";
import SessionServiceImpl from "./services/SessionServiceImpl";
import UpdateServiceImpl from "./services/UpdateServiceImpl";
import ConfigController from "./controller/ConfigController";
import DownloadController from "./controller/DownloadController";
import ViewController from "./controller/ViewController";
import WindowController from "./controller/WindowController";
import LoggerServiceImpl from "./services/LoggerServiceImpl";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
});
container
  .bind<MainWindowService>(TYPES.MainWindowService)
  .to(MainWindowServiceImpl);
container
  .bind<BrowserWindowService>(TYPES.BrowserWindowService)
  .to(BrowserWindowServiceImpl);
container
  .bind<BrowserViewService>(TYPES.BrowserViewService)
  .to(BrowserViewServiceImpl);
container.bind<App>(TYPES.App).to(MediaGo);
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigServiceImpl);
container.bind<DataService>(TYPES.DataService).to(DataServiceImpl);
container
  .bind<IpcHandlerService>(TYPES.IpcHandlerService)
  .to(IpcHandlerServiceImpl);
container.bind<ProtocolService>(TYPES.ProtocolService).to(ProtocolServiceImpl);
container.bind<SessionService>(TYPES.SessionService).to(SessionServiceImpl);
container.bind<UpdateService>(TYPES.UpdateService).to(UpdateServiceImpl);
container.bind<LoggerService>(TYPES.LoggerService).to(LoggerServiceImpl);

// === controller
container.bind<Controller>(TYPES.Controller).to(DownloadController);
container.bind<Controller>(TYPES.Controller).to(WindowController);
container.bind<Controller>(TYPES.Controller).to(ViewController);
container.bind<Controller>(TYPES.Controller).to(ConfigController);

export { container };
