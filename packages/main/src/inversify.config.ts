import DownloadController from "controller/DownloadController";
import HomeController from "controller/HomeController";
import WebviewController from "controller/WebviewController";
import { Container } from "inversify";
import FavoriteRepositoryImpl from "repository/favoriteRepositoryImpl";
import VideoRepositoryImpl from "repository/videoRepositoryImpl";
import DatabaseServiceImpl from "services/DatabaseServiceImpl";
import DevToolsServiceImpl from "services/DevToolsServiceImpl";
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
  DevToolsService,
  WebService,
  PlayerWindowService,
} from "./interfaces";
import IpcHandlerServiceImpl from "./services/IpcHandlerServiceImpl";
import LoggerServiceImpl from "./services/LoggerServiceImpl";
import ProtocolServiceImpl from "./services/ProtocolServiceImpl";
import UpdateServiceImpl from "./services/UpdateServiceImpl";
import { TYPES } from "./types";
import WebServiceImpl from "services/WebServiceImpl";
import MainWindow from "./windows/Main";
import PlayerWindow from "windows/Player";
import BrowserWin from "windows/Browser";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

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
container.bind<DevToolsService>(TYPES.DevToolsService).to(DevToolsServiceImpl);
container.bind<WebService>(TYPES.WebService).to(WebServiceImpl);

// windows
container.bind<MainWindowService>(TYPES.MainWindowService).to(MainWindow);
container.bind<BrowserWindowService>(TYPES.BrowserWindowService).to(BrowserWin);
container.bind<PlayerWindowService>(TYPES.PlayerWindowService).to(PlayerWindow);

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
