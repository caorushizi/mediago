import HomeController from "./controller/HomeController.ts";
import { Container } from "inversify";
import FavoriteRepository from "./repository/FavoriteRepository.ts";
import ElectronApp from "./app.ts";
import { Controller } from "./interfaces.ts";
import { TYPES } from "./types.ts";
import TypeORM from "./vendor/TypeORM.ts";
import RouterHandler from "./core/router.ts";
import HomeService from "./services/HomeService.ts";
import Logger from "./vendor/Logger.ts";
import DownloadController from "./controller/DownloadController.ts";
import VideoRepository from "./repository/VideoRepository.ts";
import ConfigRepository from "./repository/ConfigRepository.ts";
import ConfigService from "./services/ConfigService.ts";
import DownloadService from "./services/DownloadService.ts";
import SocketIO from "./vendor/SocketIO.ts";
import DownloaderService from "./services/DownloaderService.ts";

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
container.bind<HomeService>(TYPES.HomeService).to(HomeService);
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService);
container.bind<DownloadService>(TYPES.DownloadService).to(DownloadService);
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
container.bind<ConfigRepository>(TYPES.ConfigRepository).to(ConfigRepository);

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
