import { app } from "electron";
import os from "node:os";
import path from "node:path";

const isWindows = os.platform() === "win32";
const ext = isWindows ? ".exe" : "";
const isDev = !app.isPackaged;

/**
 * Returns the monorepo root.
 * At runtime __dirname = apps/electron/build/, so 3 levels up = monorepo root.
 */
function getMonorepoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

/**
 * Resolves the mediago-core binary and config.json paths.
 *
 * Development: apps/core/bin/mediago-core (compiled by `pnpm core:build`)
 * Production: extraResources/bin/mediago-core (copied by electron-builder)
 *
 * Override with MEDIAGO_CORE_BIN env var.
 */
export function resolveCoreBinaries(): {
  coreBin: string;
  coreConfig: string;
} {
  if (process.env.MEDIAGO_CORE_BIN) {
    const coreBin = process.env.MEDIAGO_CORE_BIN;
    const coreConfig = path.resolve(path.dirname(coreBin), "config.json");
    return { coreBin, coreConfig };
  }

  if (isDev) {
    const coreDir = path.join(getMonorepoRoot(), "apps", "core");
    return {
      coreBin: path.join(coreDir, "bin", `mediago-core${ext}`),
      coreConfig: path.join(coreDir, "configs", "config.json"),
    };
  }

  // Production: extraResources
  return {
    coreBin: path.join(process.resourcesPath, "bin", `mediago-core${ext}`),
    coreConfig: path.join(process.resourcesPath, "bin", "config.json"),
  };
}

/**
 * Resolves the deps directory containing helper binaries (ffmpeg, N_m3u8DL-RE, BBDown, etc.).
 *
 * Development: .deps/{platform}/{arch}/ (downloaded by `pnpm deps:download`)
 * Production: extraResources/deps/
 *
 * Override with MEDIAGO_DEPS_DIR env var.
 */
export function resolveDepsBinaries(): { depsDir: string } {
  let depsDir: string;

  if (process.env.MEDIAGO_DEPS_DIR) {
    depsDir = process.env.MEDIAGO_DEPS_DIR;
  } else if (isDev) {
    const platformKey = `${os.platform()}-${os.arch()}`;
    depsDir = path.join(getMonorepoRoot(), ".deps", platformKey);
  } else {
    depsDir = path.join(process.resourcesPath, "deps");
  }

  return { depsDir };
}

/**
 * Resolves the mediago-player binary path.
 *
 * Development: apps/player/dist/mediago-player (compiled by `pnpm player:build`)
 * Production: extraResources/bin/mediago-player
 *
 * Override with MEDIAGO_PLAYER_BIN env var.
 */
export function resolvePlayerBinary(): { playerBin: string } {
  if (process.env.MEDIAGO_PLAYER_BIN) {
    return { playerBin: process.env.MEDIAGO_PLAYER_BIN };
  }

  if (isDev) {
    const playerDir = path.join(getMonorepoRoot(), "apps", "player");
    return {
      playerBin: path.join(playerDir, "dist", `mediago-player${ext}`),
    };
  }

  return {
    playerBin: path.join(process.resourcesPath, "bin", `mediago-player${ext}`),
  };
}

/**
 * Resolves the bundled browser-extension directory.
 *
 * Development: packages/mediago-extension/dist (produced by
 *   `pnpm -F @mediago/extension build`)
 * Production: extraResources/extension (copied by electron-builder
 *   via the scripts/build.ts `extraResources` declaration)
 *
 * Override with MEDIAGO_EXTENSION_DIR env var.
 *
 * Consumed by the `shell.openExtensionDir` IPC — the Settings page
 * exposes a "Browser extension directory" button so users can locate
 * the unpacked extension to load into Chrome / Edge.
 */
export function resolveExtensionDir(): { extensionDir: string } {
  if (process.env.MEDIAGO_EXTENSION_DIR) {
    return { extensionDir: process.env.MEDIAGO_EXTENSION_DIR };
  }

  if (isDev) {
    return {
      extensionDir: path.join(
        getMonorepoRoot(),
        "packages",
        "mediago-extension",
        "dist",
      ),
    };
  }

  return {
    extensionDir: path.join(process.resourcesPath, "extension"),
  };
}
