import "reflect-metadata";
import { TYPES } from "@mediago/shared/node";
import type ElectronApp from "./app";
import { container } from "./inversify.config";

const mediago = container.get<ElectronApp>(TYPES.ElectronApp);
mediago.init();
