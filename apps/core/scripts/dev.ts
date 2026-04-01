import { config, devConfig } from "./config";
import { getExeExt, mkdir, runCommand } from "./utils";
import { join } from "node:path";

/**
 * Start the development server
 */
export async function dev() {
  console.log("🚀 启动开发服务器...");
  const command = [
    "go",
    "run",
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
    `-bilibili-bin=${devConfig.bilibili_bin}`,
    `-m3u8-bin=${devConfig.m3u8_bin}`,
    `-direct-bin=${devConfig.direct_bin}`,
    `-ffmpeg-bin=${devConfig.ffmpeg_bin}`,
  ];
  await runCommand(command.join(" "), "Start development server");
}

/**
 * Compile the development build for the current platform
 */
export async function devBuild() {
  console.log("🔨 编译开发版本...");
  mkdir(config.BIN_DIR);
  const output = join(config.BIN_DIR, config.APP_NAME + getExeExt());
  await runCommand(
    `go build -ldflags "${config.GO_LDFLAGS}" -o ${output} ${config.CMD_PATH}`,
    "Compile binary for current platform",
  );
  console.log(`✅ 开发版本编译成功 -> ${output}`);
}
