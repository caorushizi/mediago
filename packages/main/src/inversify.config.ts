import DownloadController from "controller/DownloadController";
import HomeController from "controller/HomeController";
import WebviewController from "controller/WebviewController";
import { Container } from "inversify";
import FavoriteRepositoryImpl from "repository/favoriteRepositoryImpl";
import VideoRepositoryImpl from "repository/videoRepositoryImpl";
import BrowserWindowServiceImpl from "services/BrowserWindowServiceImpl";
import DatabaseServiceImpl from "services/DatabaseServiceImpl";
import DownloadServiceImpl from "services/DownloadServiceImpl";
import StoreServiceImpl from "services/StoreServiceImpl";
import WebviewServiceImpl from "services/WebviewServiceImpl";
import ElectronApp from "./app";
import {
  App,
  StoreService,
  Controller,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  UpdateService,
  VideoRepository,
  DatabaseService,
  FavoriteRepository,
  WebviewService,
  BrowserWindowService,
} from "./interfaces";
import IpcHandlerServiceImpl from "./services/IpcHandlerServiceImpl";
import LoggerServiceImpl from "./services/LoggerServiceImpl";
import MainWindowServiceImpl from "./services/MainWindowServiceImpl";
import ProtocolServiceImpl from "./services/ProtocolServiceImpl";
import UpdateServiceImpl from "./services/UpdateServiceImpl";
import { TYPES } from "./types";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});
container
  .bind<MainWindowService>(TYPES.MainWindowService)
  .to(MainWindowServiceImpl);
container
  .bind<BrowserWindowService>(TYPES.BrowserWindowService)
  .to(BrowserWindowServiceImpl);
container.bind<App>(TYPES.App).to(ElectronApp);
container
  .bind<IpcHandlerService>(TYPES.IpcHandlerService)
  .to(IpcHandlerServiceImpl);
container.bind<ProtocolService>(TYPES.ProtocolService).to(ProtocolServiceImpl);
container.bind<UpdateService>(TYPES.UpdateService).to(UpdateServiceImpl);
container.bind<LoggerService>(TYPES.LoggerService).to(LoggerServiceImpl);
container.bind<StoreService>(TYPES.StoreService).to(StoreServiceImpl);
container.bind<DatabaseService>(TYPES.DatabaseService).to(DatabaseServiceImpl);
container.bind<WebviewService>(TYPES.WebviewService).to(WebviewServiceImpl);
container
  .bind<DownloadServiceImpl>(TYPES.DownloadService)
  .to(DownloadServiceImpl);

// === controller
container.bind<Controller>(TYPES.Controller).to(HomeController);
container.bind<Controller>(TYPES.Controller).to(WebviewController);
container.bind<Controller>(TYPES.Controller).to(DownloadController);

// === repository
container.bind<VideoRepository>(TYPES.VideoRepository).to(VideoRepositoryImpl);
container
  .bind<FavoriteRepository>(TYPES.FavoriteRepository)
  .to(FavoriteRepositoryImpl);

export { container };
