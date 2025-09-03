import type { Controller } from "@mediago/shared/common";
import {
  DownloaderService,
  FavoriteRepository,
  TaskQueueService,
  TYPES,
  TypeORM,
  VideoRepository,
} from "@mediago/shared/node";
import { Container } from "inversify";
import ElectronApp from "./app";
import DownloadController from "./controller/DownloadController";
import HomeController from "./controller/HomeController";
import RouterHandler from "./core/router";
import Logger from "./vendor/Logger";
import SocketIO from "./vendor/SocketIO";
import StoreService from "./vendor/Store";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

container.bind<ElectronApp>(TYPES.ElectronApp).to(ElectronApp).inSingletonScope();

// services
container.bind<StoreService>(TYPES.StoreService).to(StoreService);
container.bind<TaskQueueService>(TYPES.TaskQueueService).to(TaskQueueService);
container.bind<DownloaderService>(TYPES.DownloaderService).to(DownloaderService);

// controller
container.bind<Controller>(TYPES.Controller).to(HomeController);
container.bind<Controller>(TYPES.Controller).to(DownloadController);

// repository
container.bind<FavoriteRepository>(TYPES.FavoriteRepository).to(FavoriteRepository);
container.bind<VideoRepository>(TYPES.VideoRepository).to(VideoRepository);

// vendor
container.bind<TypeORM>(TYPES.TypeORM).to(TypeORM);
container.bind<Logger>(TYPES.Logger).to(Logger);
container.bind<SocketIO>(TYPES.SocketIO).to(SocketIO);

// core
container.bind<RouterHandler>(TYPES.RouterHandlerService).to(RouterHandler).inSingletonScope();

export { container };
