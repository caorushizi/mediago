import { config, devConfig } from "./config";
import { getExeExt, mkdir, runCommand } from "./utils";
import { join } from "path";

/**
 * 启动开发服务器
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
    `-schema-path=${devConfig.schema_path}`,
    `-max-runner=${devConfig.max_runner.toString()}`,
    `-local-dir=${devConfig.local_dir}`,
    `-delete-segments=${devConfig.delete_segments.toString()}`,
    `-proxy=${devConfig.proxy}`,
    `-use-proxy=${devConfig.use_proxy.toString()}`,
    `-bilibili-bin=${devConfig.bilibili_bin}`,
    `-m3u8-bin=${devConfig.m3u8_bin}`,
    `-direct-bin=${devConfig.direct_bin}`,
  ];
  await runCommand(command.join(" "), "启动开发服务器");
}

/**
 * 编译当前平台的开发版本
 */
export async function devBuild() {
  console.log("🔨 编译开发版本...");
  mkdir(config.BIN_DIR);
  const output = join(config.BIN_DIR, config.APP_NAME + getExeExt());
  await runCommand(
    `go build -ldflags "${config.GO_LDFLAGS}" -o ${output} ${config.CMD_PATH}`,
    "编译当前平台二进制文件"
  );
  console.log(`✅ 开发版本编译成功 -> ${output}`);
}
