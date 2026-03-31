import os from "node:os";
import path from "node:path";

/**
 * Detects the current platform suffix used in @mediago/* package names.
 * e.g. "darwin-arm64", "win32-x64", "linux-x64"
 */
function getPlatformSuffix(): string {
  const platform = os.platform();
  const arch = os.arch();

  const supported: Record<string, string[]> = {
    darwin: ["x64", "arm64"],
    linux: ["x64", "arm64"],
    win32: ["x64", "arm64"],
  };

  const archList = supported[platform];
  if (!archList || !archList.includes(arch)) {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  return `${platform}-${arch}`;
}

/**
 * Resolves a platform-specific package directory by using the root package
 * as a resolution base. This is necessary because:
 *
 * 1. Root packages (@mediago/core, @mediago/deps, @mediago/player) are in
 *    the tsdown `external` list, so `require.resolve` works at runtime.
 * 2. Platform packages (@mediago/core-darwin-arm64) are optionalDependencies
 *    of root packages, so they're only resolvable from the root package's
 *    node_modules in pnpm's strict structure.
 * 3. We use `{ paths: [rootDir] }` to resolve from the root package location.
 *
 * Handles Electron ASAR path rewriting for production builds.
 */
function resolvePlatformPackageDir(
  rootPackage: string,
  platformPackage: string,
): string {
  const rootDir = path.dirname(require.resolve(`${rootPackage}/package.json`));

  let pkgPath = require.resolve(`${platformPackage}/package.json`, {
    paths: [rootDir],
  });

  if (
    process.env.NODE_ENV === "production" &&
    process.env.APP_TARGET === "electron"
  ) {
    pkgPath = pkgPath.replace("app.asar", "app.asar.unpacked");
  }

  return path.dirname(pkgPath);
}

const suffix = getPlatformSuffix();
const isWindows = os.platform() === "win32";

/**
 * Resolves the mediago-core binary and config.json paths.
 * Override with MEDIAGO_CORE_BIN env var (path to the binary).
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

  const pkgDir = resolvePlatformPackageDir(
    "@mediago/core",
    `@mediago/core-${suffix}`,
  );
  const binaryName = `mediago-core${isWindows ? ".exe" : ""}`;

  return {
    coreBin: path.resolve(pkgDir, binaryName),
    coreConfig: path.resolve(pkgDir, "config.json"),
  };
}

/**
 * Resolves paths to helper binaries: ffmpeg, N_m3u8DL-RE, BBDown, gopeed.
 * Override with MEDIAGO_DEPS_DIR env var (path to directory containing binaries).
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
    const pkgDir = resolvePlatformPackageDir(
      "@mediago/deps",
      `@mediago/deps-${suffix}`,
    );
    binDir = path.resolve(pkgDir, "bin");
  }

  const ext = isWindows ? ".exe" : "";

  return {
    ffmpeg: path.resolve(binDir, `ffmpeg${ext}`),
    n_m3u8dl_re: path.resolve(binDir, `N_m3u8DL-RE${ext}`),
    bbdown: path.resolve(binDir, `BBDown${ext}`),
    gopeed: path.resolve(binDir, `gopeed${ext}`),
  };
}

/**
 * Resolves the mediago-player binary path.
 * Override with MEDIAGO_PLAYER_BIN env var (path to the binary).
 */
export function resolvePlayerBinary(): { playerBin: string } {
  if (process.env.MEDIAGO_PLAYER_BIN) {
    return { playerBin: process.env.MEDIAGO_PLAYER_BIN };
  }

  const pkgDir = resolvePlatformPackageDir(
    "@mediago/player",
    `@mediago/player-${suffix}`,
  );
  const binaryName = `mediago-player${isWindows ? ".exe" : ""}`;

  return {
    playerBin: path.resolve(pkgDir, "bin", binaryName),
  };
}
