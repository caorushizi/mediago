import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config, devConfig } from "./config";
import { getExeExt, mkdir, runCommand, copyFile, rmrf } from "./utils";

/**
 * Start the development server
 */
export async function dev() {
  console.log("🚀 启动开发服务器...");
  const args = [
    "run",
    "-tags",
    "dev",
    "-work",
    config.CMD_PATH,
    `-log-level=${devConfig.log_level}`,
    `-log-dir=${devConfig.log_dir}`,
    `-config-dir=${devConfig.config_dir}`,
    `-schema-path=${devConfig.schema_path}`,
    `-max-runner=${devConfig.max_runner.toString()}`,
    `-local-dir=${devConfig.local_dir}`,
    `-delete-segments=${devConfig.delete_segments.toString()}`,
    `-proxy=${devConfig.proxy}`,
    `-use-proxy=${devConfig.use_proxy.toString()}`,
    `-deps-dir=${devConfig.deps_dir}`,
  ];
  await runCommand("go", args, { description: "Start development server" });
}

/**
 * Build player-ui and copy dist to core assets for embedding
 */
export async function buildPlayerUI() {
  console.log("🎬 构建 Player UI...");
  const playerUiDist = join(config.PLAYER_UI_DIR, "dist");

  // Build player-ui
  await runCommand("pnpm", ["build"], { cwd: config.PLAYER_UI_DIR });

  if (!existsSync(playerUiDist)) {
    throw new Error(
      `Expected player-ui build output at ${playerUiDist} but it was not found`,
    );
  }

  // Copy dist to core assets/player/ for go:embed
  rmrf(config.PLAYER_ASSETS_DIR);
  copyFile(playerUiDist, config.PLAYER_ASSETS_DIR);

  console.log(`✅ Player UI 已复制到 ${config.PLAYER_ASSETS_DIR}`);
}

/**
 * Compile the development build for the current platform
 */
export async function devBuild() {
  console.log("🔨 编译开发版本...");

  // Build and embed player-ui first
  await buildPlayerUI();

  mkdir(config.BIN_DIR);
  const output = join(config.BIN_DIR, config.APP_NAME + getExeExt());
  await runCommand(
    "go",
    [
      "build",
      "-tags",
      "dev",
      "-trimpath",
      "-ldflags",
      config.GO_LDFLAGS,
      "-o",
      output,
      config.CMD_PATH,
    ],
    { description: "Compile binary for current platform" },
  );
  if (process.platform !== "win32") {
    chmodSync(output, 0o755);
  }
  console.log(`✅ 开发版本编译成功 -> ${output}`);
}
