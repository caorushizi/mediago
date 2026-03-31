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
 * Resolves paths to helper binaries: ffmpeg, N_m3u8DL-RE, BBDown, gopeed.
 *
 * Development: .deps/{platform}-{arch}/ (downloaded by `pnpm deps:download`)
 * Production: extraResources/deps/
 *
 * Override with MEDIAGO_DEPS_DIR env var.
 */
export function resolveDepsBinaries(): {
  ffmpeg: string;
  n_m3u8dl_re: string;
  bbdown: string;
  gopeed: string;
} {
  let binDir: string;

  if (process.env.MEDIAGO_DEPS_DIR) {
    binDir = process.env.MEDIAGO_DEPS_DIR;
  } else if (isDev) {
    const platformKey = `${os.platform()}-${os.arch()}`;
    binDir = path.join(getMonorepoRoot(), ".deps", platformKey);
  } else {
    binDir = path.join(process.resourcesPath, "deps");
  }

  return {
    ffmpeg: path.resolve(binDir, `ffmpeg${ext}`),
    n_m3u8dl_re: path.resolve(binDir, `N_m3u8DL-RE${ext}`),
    bbdown: path.resolve(binDir, `BBDown${ext}`),
    gopeed: path.resolve(binDir, `gopeed${ext}`),
  };
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
