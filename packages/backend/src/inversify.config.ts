import HomeController from "./controller/HomeController.ts";
import { Container } from "inversify";
import FavoriteRepository from "./repository/FavoriteRepository.ts";
import ElectronApp from "./app.ts";
import { Controller } from "./interfaces.ts";
import { TYPES } from "./types.ts";
import TypeORM from "./vendor/TypeORM.ts";
import RouterHandler from "./core/router.ts";
import HomeService from "./services/HomeService.ts";

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

// controller
container.bind<Controller>(TYPES.Controller).to(HomeController);

// repository
container
  .bind<FavoriteRepository>(TYPES.FavoriteRepository)
  .to(FavoriteRepository);

// vendor
container.bind<TypeORM>(TYPES.TypeORM).to(TypeORM);

// core
container
  .bind<RouterHandler>(TYPES.RouterHandlerService)
  .to(RouterHandler)
  .inSingletonScope();

export { container };
