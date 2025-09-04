import "reflect-metadata";
import { Container } from "inversify";
import ElectronApp from "./app";

const container = new Container({
  defaultScope: "Singleton",
});

const mediago = container.get(ElectronApp);
mediago.init();
