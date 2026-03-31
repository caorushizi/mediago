import { parallel, series } from "gulp";

import {
  buildServerTask,
  buildUiTask,
  devServerTask,
  devUiTask,
  docsTask,
  npmAssembleTask,
  npmPublishTask,
} from "./scripts/tasks";

/**
 * 1. dev - Start development mode (UI + Backend)
 * Starts both UI dev server and backend dev server in parallel
 */
const devServer = series(docsTask, devServerTask);
devServer.displayName = "dev:server";

const dev = parallel(devServer, devUiTask);
dev.displayName = "dev";
export { dev };

/**
 * 2. build - Build binary for current system
 * Generates Swagger docs, builds UI, and compiles backend binary
 */
const build = series(docsTask, buildUiTask, buildServerTask);
build.displayName = "build";
export { build };

/**
 * 3. npm:assemble - Generate all npm packages
 * Builds binaries for all platforms and assembles npm packages
 */
export { npmAssembleTask as "npm:assemble" };

/**
 * 4. npm:publish - Publish npm packages to registry
 * Publishes all generated npm packages to npm registry
 */
export { npmPublishTask as "npm:publish" };
