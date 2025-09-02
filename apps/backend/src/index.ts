import "reflect-metadata";
import { container } from "./inversify.config.ts";
import { TYPES } from "@mediago/shared/node";
import ElectronApp from "./app.ts";

const mediago = container.get<ElectronApp>(TYPES.ElectronApp);
mediago.init();
