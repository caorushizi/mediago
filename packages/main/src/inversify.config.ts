import HomeController from "controller/HomeController";
import WebviewController from "controller/WebviewController";
import { Container } from "inversify";
import FavoriteRepositoryImpl from "repository/favoriteRepositoryImpl";
import UserRepositoryImpl from "repository/userRepositoryImpl";
import DatabaseServiceImpl from "services/DatabaseServiceImpl";
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
  UserRepository,
  DatabaseService,
  FavoriteRepository,
  WebviewService,
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

// === controller
container.bind<Controller>(TYPES.Controller).to(HomeController);
container.bind<Controller>(TYPES.Controller).to(WebviewController);

// === repository
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepositoryImpl);
container
  .bind<FavoriteRepository>(TYPES.FavoriteRepository)
  .to(FavoriteRepositoryImpl);

export { container };
