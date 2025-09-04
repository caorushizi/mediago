import "reflect-metadata";
import { buildProviderModule } from "@inversifyjs/binding-decorators";
import { Container } from "inversify";
import ElectronApp from "./app";

const container = new Container({
  defaultScope: "Singleton",
});

await container.load(buildProviderModule());
const mediago = container.get(ElectronApp);
mediago.init();
