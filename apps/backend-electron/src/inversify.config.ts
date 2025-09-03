import type { Controller } from "@mediago/shared/common";
import {
  ConversionRepository,
  DownloaderService,
  FavoriteRepository,
  TaskQueueService,
  TYPES,
  TypeORM,
  VideoRepository,
} from "@mediago/shared/node";
import { Container } from "inversify";
import ElectronApp from "./app";
import ConversionController from "./controller/ConversionController";
import DownloadController from "./controller/DownloadController";
import HomeController from "./controller/HomeController";
import PlayerController from "./controller/PlayerController";
import WebviewController from "./controller/WebviewController";
import IpcHandler from "./core/ipc";
import ProtocolService from "./core/protocol";
import { SniffingHelper } from "./services/SniffingHelperService";
import { VideoService } from "./services/VideoService";
import WebviewService from "./services/WebviewService";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronLogger from "./vendor/ElectronLogger";
import ElectronStore from "./vendor/ElectronStore";
import ElectronUpdater from "./vendor/ElectronUpdater";
import BrowserWindow from "./windows/BrowserWindow";
import MainWindow from "./windows/MainWindow";
import PlayerWindow from "./windows/PlayerWindow";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

container.bind<ElectronApp>(TYPES.ElectronApp).to(ElectronApp);

// services
container.bind<WebviewService>(TYPES.WebviewService).to(WebviewService);
container.bind<TaskQueueService>(TYPES.TaskQueueService).to(TaskQueueService);
container.bind<DownloaderService>(TYPES.DownloaderService).to(DownloaderService);
container.bind<SniffingHelper>(TYPES.SniffingHelper).to(SniffingHelper);
container.bind<VideoService>(TYPES.VideoService).to(VideoService);

// windows
container.bind<MainWindow>(TYPES.MainWindow).to(MainWindow);
container.bind<BrowserWindow>(TYPES.BrowserWindow).to(BrowserWindow);
container.bind<PlayerWindow>(TYPES.PlayerWindow).to(PlayerWindow);

// controller
container.bind<Controller>(TYPES.Controller).to(HomeController);
container.bind<Controller>(TYPES.Controller).to(WebviewController);
container.bind<Controller>(TYPES.Controller).to(DownloadController);
container.bind<Controller>(TYPES.Controller).to(ConversionController);
container.bind<Controller>(TYPES.Controller).to(PlayerController);

// repository
container.bind<VideoRepository>(TYPES.VideoRepository).to(VideoRepository);
container.bind<FavoriteRepository>(TYPES.FavoriteRepository).to(FavoriteRepository);
container.bind<ConversionRepository>(TYPES.ConversionRepository).to(ConversionRepository);

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
