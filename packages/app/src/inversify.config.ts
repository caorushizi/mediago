import { Container } from "inversify";
import TYPES from "./types";
import {
  MyApp,
  DB,
  MainWindow,
  Config,
  Browser,
  InnerBrowser,
} from "./interfaces";
import Data from "./services/dataSource";
import MainWindowImpl from "./services/mainWindow";
import CoreApp from "./services/coreApp";
import ConfigImpl from "./services/configImpl";
import BrowserWindowImpl from "./services/browser";
import InnerBrowserImpl from "./services/innerBrowser";

const container = new Container({
  skipBaseClassChecks: true,
  defaultScope: "Singleton",
});
container.bind<DB>(TYPES.DB).to(Data);
container.bind<MyApp>(TYPES.MyApp).to(CoreApp);
container.bind<MainWindow>(TYPES.MainWindow).to(MainWindowImpl);
container.bind<Config>(TYPES.Config).to(ConfigImpl);
container.bind<InnerBrowser>(TYPES.InnerBrowser).to(InnerBrowserImpl);
container.bind<Browser>(TYPES.Browser).to(BrowserWindowImpl);

export { container };
