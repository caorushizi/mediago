import HomeController from "controller/HomeController";
import { Container } from "inversify";
import UserRepositoryImpl from "repository/userRepositoryImpl";
import DatabaseServiceImpl from "services/DatabaseServiceImpl";
import StoreServiceImpl from "services/StoreServiceImpl";
import ElectronApp from "./app";
import {
  App,
  StoreService,
  Controller,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  SessionService,
  UpdateService,
  UserRepository,
  DatabaseService,
} from "./interfaces";
import IpcHandlerServiceImpl from "./services/IpcHandlerServiceImpl";
import LoggerServiceImpl from "./services/LoggerServiceImpl";
import MainWindowServiceImpl from "./services/MainWindowServiceImpl";
import ProtocolServiceImpl from "./services/ProtocolServiceImpl";
import SessionServiceImpl from "./services/SessionServiceImpl";
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
container.bind<SessionService>(TYPES.SessionService).to(SessionServiceImpl);
container.bind<UpdateService>(TYPES.UpdateService).to(UpdateServiceImpl);
container.bind<LoggerService>(TYPES.LoggerService).to(LoggerServiceImpl);
container.bind<StoreService>(TYPES.StoreService).to(StoreServiceImpl);
container.bind<DatabaseService>(TYPES.DatabaseService).to(DatabaseServiceImpl);

// === controller
container.bind<Controller>(TYPES.Controller).to(HomeController);

// === repository
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepositoryImpl);

export { container };
