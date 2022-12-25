import { Container } from "inversify";
import { TYPES } from "./types";
import {
  App,
  BrowserViewService,
  CollectionRepository,
  ConfigService,
  Controller,
  DataService,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  RunnerService,
  SessionService,
  UpdateService,
  VideoRepository,
} from "./interfaces";
import MainWindowServiceImpl from "./services/MainWindowServiceImpl";
import MediaGo from "./app";
import BrowserViewServiceImpl from "./services/BrowserViewServiceImpl";
import ConfigServiceImpl from "./services/ConfigServiceImpl";
import DataServiceImpl from "./services/DataServiceImpl";
import IpcHandlerServiceImpl from "./services/IpcHandlerServiceImpl";
import ProtocolServiceImpl from "./services/ProtocolServiceImpl";
import SessionServiceImpl from "./services/SessionServiceImpl";
import UpdateServiceImpl from "./services/UpdateServiceImpl";
import ConfigControllerImpl from "./controller/ConfigControllerImpl";
import DownloadControllerImpl from "./controller/DownloadControllerImpl";
import ViewControllerImpl from "./controller/ViewControllerImpl";
import WindowControllerImpl from "./controller/WindowControllerImpl";
import LoggerServiceImpl from "./services/LoggerServiceImpl";
import RunnerServiceImpl from "./services/RunnerServiceImpl";
import VideoRepositoryImpl from "./repository/VideoRepositoryImpl";
import VideoControllerImpl from "./controller/VideoControllerImpl";
import CollectionControllerImpl from "./controller/CollectionControllerImpl";
import CollectionRepositoryImpl from "./repository/CollectionRepositoryImpl";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});
container
  .bind<MainWindowService>(TYPES.MainWindowService)
  .to(MainWindowServiceImpl);
container
  .bind<BrowserViewService>(TYPES.BrowserViewService)
  .to(BrowserViewServiceImpl);
container.bind<App>(TYPES.App).to(MediaGo);
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigServiceImpl);
container.bind<DataService>(TYPES.DataService).to(DataServiceImpl);
container.bind<RunnerService>(TYPES.RunnerService).to(RunnerServiceImpl);
container
  .bind<IpcHandlerService>(TYPES.IpcHandlerService)
  .to(IpcHandlerServiceImpl);
container.bind<ProtocolService>(TYPES.ProtocolService).to(ProtocolServiceImpl);
container.bind<SessionService>(TYPES.SessionService).to(SessionServiceImpl);
container.bind<UpdateService>(TYPES.UpdateService).to(UpdateServiceImpl);
container.bind<LoggerService>(TYPES.LoggerService).to(LoggerServiceImpl);

// === controller
container.bind<Controller>(TYPES.Controller).to(DownloadControllerImpl);
container.bind<Controller>(TYPES.Controller).to(WindowControllerImpl);
container.bind<Controller>(TYPES.Controller).to(ViewControllerImpl);
container.bind<Controller>(TYPES.Controller).to(ConfigControllerImpl);
container.bind<Controller>(TYPES.Controller).to(VideoControllerImpl);
container.bind<Controller>(TYPES.Controller).to(CollectionControllerImpl);

// === repository
container.bind<VideoRepository>(TYPES.VideoRepository).to(VideoRepositoryImpl);
container
  .bind<CollectionRepository>(TYPES.CollectionRepository)
  .to(CollectionRepositoryImpl);

export { container };
