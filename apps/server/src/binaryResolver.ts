import os from "node:os";
import path from "node:path";

const isWindows = os.platform() === "win32";
const ext = isWindows ? ".exe" : "";

/**
 * Returns the monorepo root (two levels up from apps/server/).
 */
function getMonorepoRoot(): string {
  return path.resolve(__dirname, "..", "..", "..");
}

/**
 * Resolves the mediago-core binary and config.json paths.
 *
 * Uses monorepo paths: apps/core/bin/mediago-core
 * In Docker: the binary is placed at /usr/local/bin/mediago-core
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

  const coreDir = path.join(getMonorepoRoot(), "apps", "core");
  return {
    coreBin: path.join(coreDir, "bin", `mediago-core${ext}`),
    coreConfig: path.join(coreDir, "configs", "config.json"),
  };
}

/**
 * Resolves paths to helper binaries: ffmpeg, N_m3u8DL-RE, BBDown, gopeed.
 *
 * Uses .deps/{platform}-{arch}/ directory.
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
  } else {
    const platformKey = `${os.platform()}-${os.arch()}`;
    binDir = path.join(getMonorepoRoot(), ".deps", platformKey);
  }

  return {
    ffmpeg: path.resolve(binDir, `ffmpeg${ext}`),
    n_m3u8dl_re: path.resolve(binDir, `N_m3u8DL-RE${ext}`),
    bbdown: path.resolve(binDir, `BBDown${ext}`),
    gopeed: path.resolve(binDir, `gopeed${ext}`),
  };
}
