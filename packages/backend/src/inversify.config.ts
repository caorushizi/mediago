import HomeController from "./controller/HomeController.ts";
import { Container } from "inversify";
import {
  FavoriteRepository,
  TaskQueueService,
  TypeORM,
  VideoRepository,
  DownloaderService,
} from "@mediago/shared/node";
import ElectronApp from "./app.ts";
import { Controller } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import RouterHandler from "./core/router.ts";
import Logger from "./vendor/Logger.ts";
import DownloadController from "./controller/DownloadController.ts";
import StoreService from "./vendor/Store.ts";
import SocketIO from "./vendor/SocketIO.ts";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
  autoBindInjectable: true,
});

container
  .bind<ElectronApp>(TYPES.ElectronApp)
  .to(ElectronApp)
  .inSingletonScope();

// services
container.bind<StoreService>(TYPES.StoreService).to(StoreService);
container.bind<TaskQueueService>(TYPES.TaskQueueService).to(TaskQueueService);
container
  .bind<DownloaderService>(TYPES.DownloaderService)
  .to(DownloaderService);

// controller
container.bind<Controller>(TYPES.Controller).to(HomeController);
container.bind<Controller>(TYPES.Controller).to(DownloadController);

// repository
container
  .bind<FavoriteRepository>(TYPES.FavoriteRepository)
  .to(FavoriteRepository);
container.bind<VideoRepository>(TYPES.VideoRepository).to(VideoRepository);

// vendor
container.bind<TypeORM>(TYPES.TypeORM).to(TypeORM);
container.bind<Logger>(TYPES.Logger).to(Logger);
container.bind<SocketIO>(TYPES.SocketIO).to(SocketIO);

// core
container
  .bind<RouterHandler>(TYPES.RouterHandlerService)
  .to(RouterHandler)
  .inSingletonScope();

export { container };
