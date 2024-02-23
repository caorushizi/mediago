import DownloadController from "./controller/DownloadController";
import HomeController from "./controller/HomeController";
import WebviewController from "./controller/WebviewController";
import { Container } from "inversify";
import FavoriteRepository from "./repository/FavoriteRepository";
import VideoRepository from "./repository/VideoRepository";
import WebviewService from "./services/WebviewService";
import ElectronApp from "./app";
import { Controller } from "./interfaces";
import { TYPES } from "./types";
import MainWindow from "./windows/MainWindow";
import PlayerWindow from "./windows/PlayerWindow";
import BrowserWindow from "./windows/BrowserWindow";
import VideoService from "./services/VideoService";
import { SniffingHelper } from "./services/SniffingHelperService";
import DownloadService from "./services/DownloadService";
import ElectronLogger from "./vendor/ElectronLogger";
import ElectronUpdater from "./vendor/ElectronUpdater";
import TypeORM from "./vendor/TypeORM";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronStore from "./vendor/ElectronStore";
import IpcHandler from "./core/ipc";
import ProtocolService from "./core/protocol";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

container.bind<ElectronApp>(TYPES.ElectronApp).to(ElectronApp);

// services
container.bind<WebviewService>(TYPES.WebviewService).to(WebviewService);
container.bind<DownloadService>(TYPES.DownloadService).to(DownloadService);
container.bind<VideoService>(TYPES.VideoService).to(VideoService);
container.bind<SniffingHelper>(TYPES.SniffingHelper).to(SniffingHelper);

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

// vendor
container.bind<ElectronDevtools>(TYPES.ElectronDevtools).to(ElectronDevtools);
container.bind<TypeORM>(TYPES.TypeORM).to(TypeORM);
container.bind<ElectronUpdater>(TYPES.ElectronUpdater).to(ElectronUpdater);
container.bind<ElectronLogger>(TYPES.ElectronLogger).to(ElectronLogger);
container.bind<ElectronStore>(TYPES.ElectronStore).to(ElectronStore);

// core
container.bind<ProtocolService>(TYPES.ProtocolService).to(ProtocolService);
container.bind<IpcHandler>(TYPES.IpcHandlerService).to(IpcHandler);

export { container };
