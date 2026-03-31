import { series } from "gulp";
import { existsSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { platform as osPlatform } from "node:os";
import {
  config,
  releaseConfig,
  BuildConfig,
  BUILD_PLATFORMS,
  PACKAGE_PLATFORMS,
} from "./config";
import { mkdir, rmrf, copyFile, runCommand, resolveReleasePath } from "./utils";

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
    `go build -ldflags="${config.GO_LDFLAGS}" -o ${output} ${config.CMD_PATH}`,
    `✓ ${cfg.goos}/${cfg.goarch}`,
    {
      GOOS: cfg.goos,
      GOARCH: cfg.goarch,
      CGO_ENABLED: "0",
    },
  );
}

/**
 * Build binaries for all platforms
 */
export async function releaseBuild() {
  console.log("🔨 构建所有平台二进制文件...");
  mkdir(config.BIN_DIR);

  await Promise.all(BUILD_PLATFORMS.map(buildBinary));
  console.log("✅ 全平台二进制文件编译完成");
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
  if (cfg.goos !== "windows" && osPlatform() !== "win32") {
    try {
      chmodSync(join(pkgDir, config.APP_NAME), 0o755);
      const binDir = join(pkgDir, releaseConfig.packageBinDir);
      if (existsSync(binDir)) {
        await runCommand(`chmod +x ${join(binDir, "*")}`, undefined);
      }
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
  console.log("📦 打包所有平台发布包...");

  await Promise.all(PACKAGE_PLATFORMS.map(packagePlatform));

  console.log("✅ 所有平台发布包打包完成");
  console.log(
    `📦 发布包位置: ${resolveReleasePath(releaseConfig.packagesDir)}/`,
  );
}

/**
 * Clean all release artifacts
 */
export async function releaseClean() {
  console.log("🧹 清理发布产物...");
  rmrf(config.BIN_DIR);
  rmrf(config.RELEASE_DIR);
  console.log("✅ 发布产物清理完成");
}
export const releasePackageFull = series(
  releaseClean,
  releaseBuild,
  releasePackage,
);
