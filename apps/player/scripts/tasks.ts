import { chmodSync, existsSync } from "node:fs";
import path from "node:path";

import {
  ASSETS_UI_DIR,
  DIST_DIR,
  SERVER_BINARY_PATH,
  UI_DIR,
} from "./constants";
import { copyDirectory, ensureDir, pathExists, runCommand } from "./utils";

// Documentation tasks
export async function docsTask() {
  await runCommand("swag", ["init", "-g", "cmd/server/main.go", "-o", "docs"]);
}

// Development tasks
export async function devServerTask() {
  await runCommand("go", [
    "run",
    "-tags",
    "dev",
    "./cmd/server",
    "-enable-docs",
    "-video-root",
    "/mnt/c/Users/Microsoft/Desktop/mediago_download",
  ]);
}

export async function devUiTask() {
  await runCommand("pnpm", ["dev"]);
}

// Test tasks
export async function testTask() {
  await runCommand("go", ["test", "./..."]);
}

// Build tasks
export async function buildUiTask() {
  await runCommand("pnpm", ["build"], { cwd: UI_DIR });
  const distDir = path.join(UI_DIR, "dist");
  if (!existsSync(distDir)) {
    throw new Error(
      "Expected UI build output at apps/player-ui/dist but it was not found",
    );
  }
  await copyDirectory(distDir, ASSETS_UI_DIR);
}

export async function buildServerTask() {
  await ensureDir(DIST_DIR);
  // No -tags dev: swagger excluded from production builds
  await runCommand("go", [
    "build",
    "-trimpath",
    "-ldflags",
    "-s -w",
    "-o",
    SERVER_BINARY_PATH,
    "./cmd/server",
  ]);
  if (process.platform !== "win32") {
    chmodSync(SERVER_BINARY_PATH, 0o755);
  }
}

// Run task
export async function runBinaryTask() {
  const absolutePath = path.resolve(SERVER_BINARY_PATH);
  if (!(await pathExists(absolutePath))) {
    throw new Error(
      `Server binary not found at ${absolutePath}. Run "pnpm gulp build" first.`,
    );
  }
  await runCommand(absolutePath, ["-enable-docs"]);
}
