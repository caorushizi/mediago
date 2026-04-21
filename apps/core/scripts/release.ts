import { series } from "gulp";
import { existsSync, chmodSync } from "node:fs";
import { join } from "node:path";
import {
  config,
  releaseConfig,
  BuildConfig,
  BUILD_PLATFORMS,
  PACKAGE_PLATFORMS,
} from "./config";
import {
  mkdir,
  rmrf,
  copyFile,
  runCommand,
  chmodExecutable,
  resolveReleasePath,
} from "./utils";
import { buildPlayerUI } from "./dev";

// ============================================================
// Release Tasks
// ============================================================

function getPackageName({ goos, goarch }: BuildConfig): string {
  return `${config.APP_NAME}-${goos}-${goarch}`;
}

function getTargetExt(goos: string): string {
  return goos === "windows" ? ".exe" : "";
}

/**
 * Build the binary for a single platform
 */
async function buildBinary(cfg: BuildConfig) {
  const ext = getTargetExt(cfg.goos);
  const output = join(config.BIN_DIR, `${getPackageName(cfg)}${ext}`);

  await runCommand(
    "go",
    [
      "build",
      "-trimpath",
      "-ldflags",
      config.GO_LDFLAGS,
      "-o",
      output,
      config.CMD_PATH,
    ],
    {
      description: `✓ ${cfg.goos}/${cfg.goarch}`,
      env: {
        GOOS: cfg.goos,
        GOARCH: cfg.goarch,
        CGO_ENABLED: "0",
      },
    },
  );
  if (cfg.goos !== "windows") {
    chmodSync(output, 0o755);
  }
}

/**
 * Build binaries for all platforms
 */
export async function releaseBuild() {
  console.log("🔨 Building binaries for all platforms...");
  mkdir(config.BIN_DIR);

  await Promise.all(BUILD_PLATFORMS.map(buildBinary));
  console.log("✅ All-platform binaries compiled");
}

/**
 * Package the release bundle for a single platform
 */
async function packagePlatform(cfg: BuildConfig) {
  const ext = getTargetExt(cfg.goos);
  const pkgName = getPackageName(cfg);
  const pkgDir = resolveReleasePath(releaseConfig.packagesDir, pkgName);
  const toolsSrc = join(config.TOOLS_BIN_DIR, cfg.platform!, cfg.arch!);

  // Create directory structure
  mkdir(pkgDir);
  mkdir(join(pkgDir, releaseConfig.packageBinDir));
  mkdir(join(pkgDir, releaseConfig.packageConfigsDir));
  mkdir(join(pkgDir, releaseConfig.packageLogsDir));

  // Copy main executable
  copyFile(
    join(config.BIN_DIR, `${pkgName}${ext}`),
    join(pkgDir, `${config.APP_NAME}${ext}`),
  );

  // Copy downloader tools
  if (existsSync(toolsSrc)) {
    copyFile(toolsSrc, join(pkgDir, releaseConfig.packageBinDir));
  }

  // Copy config files
  if (existsSync(releaseConfig.downloadSchema)) {
    copyFile(
      releaseConfig.downloadSchema,
      join(pkgDir, releaseConfig.packageConfigsDir),
    );
  }

  // Set executable permissions
  if (cfg.goos !== "windows" && process.platform !== "win32") {
    try {
      chmodSync(join(pkgDir, config.APP_NAME), 0o755);
      const binDir = join(pkgDir, releaseConfig.packageBinDir);
      chmodExecutable(binDir);
    } catch {
      // Ignore permission errors
    }
  }

  console.log(`✓ ${cfg.goos}/${cfg.goarch} release package bundled`);
}

/**
 * Package the complete release bundles for all platforms
 */
async function releasePackage() {
  console.log("📦 Packaging release bundles for all platforms...");

  await Promise.all(PACKAGE_PLATFORMS.map(packagePlatform));

  console.log("✅ All-platform release bundles packed");
  console.log(`📦 Output: ${resolveReleasePath(releaseConfig.packagesDir)}/`);
}

/**
 * Clean all release artifacts
 */
export async function releaseClean() {
  console.log("🧹 Cleaning release artifacts...");
  rmrf(config.BIN_DIR);
  rmrf(config.RELEASE_DIR);
  console.log("✅ Release artifacts cleaned");
}
export const releasePackageFull = series(
  releaseClean,
  buildPlayerUI,
  releaseBuild,
  releasePackage,
);
