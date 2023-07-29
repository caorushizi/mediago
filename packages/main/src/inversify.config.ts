import DownloadController from "controller/DownloadController";
import HomeController from "controller/HomeController";
import WebviewController from "controller/WebviewController";
import { Container } from "inversify";
import FavoriteRepository from "repository/FavoriteRepository";
import VideoRepository from "repository/VideoRepository";
import DatabaseService from "services/DatabaseService";
import DevToolsService from "services/DevToolsService";
import DownloadService from "services/DownloadService";
import StoreService from "services/StoreService";
import WebviewService from "services/WebviewService";
import ElectronApp from "./app";
import { Controller } from "./interfaces";
import IpcHandlerService from "./services/IpcHandlerService";
import LoggerService from "./services/LoggerService";
import ProtocolService from "./services/ProtocolService";
import UpdateService from "./services/UpdateService";
import { TYPES } from "./types";
import WebService from "services/WebService";
import MainWindow from "./windows/MainWindow";
import PlayerWindow from "windows/PlayerWindow";
import BrowserWindow from "windows/BrowserWindow";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

container.bind<ElectronApp>(TYPES.ElectronApp).to(ElectronApp);

// services
container
  .bind<IpcHandlerService>(TYPES.IpcHandlerService)
  .to(IpcHandlerService);
container.bind<ProtocolService>(TYPES.ProtocolService).to(ProtocolService);
container.bind<UpdateService>(TYPES.UpdateService).to(UpdateService);
container.bind<LoggerService>(TYPES.LoggerService).to(LoggerService);
container.bind<StoreService>(TYPES.StoreService).to(StoreService);
container.bind<DatabaseService>(TYPES.DatabaseService).to(DatabaseService);
container.bind<WebviewService>(TYPES.WebviewService).to(WebviewService);
container.bind<DownloadService>(TYPES.DownloadService).to(DownloadService);
container.bind<DevToolsService>(TYPES.DevToolsService).to(DevToolsService);
container.bind<WebService>(TYPES.WebService).to(WebService);

// windows
container.bind<MainWindow>(TYPES.MainWindow).to(MainWindow);
container.bind<BrowserWindow>(TYPES.BrowserWindow).to(BrowserWindow);
container.bind<PlayerWindow>(TYPES.PlayerWindow).to(PlayerWindow);

// controller
container.bind<Controller>(TYPES.Controller).to(HomeController);
container.bind<Controller>(TYPES.Controller).to(WebviewController);
container.bind<Controller>(TYPES.Controller).to(DownloadController);

// repository
container.bind<VideoRepository>(TYPES.VideoRepository).to(VideoRepository);
container
  .bind<FavoriteRepository>(TYPES.FavoriteRepository)
  .to(FavoriteRepository);

export { container };
