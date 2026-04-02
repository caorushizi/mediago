import { join } from "node:path";
import { win32 } from "node:path/win32";

// ============================================================
// Configuration Variables
// ============================================================

export const config = {
  APP_NAME: "mediago-core",
  CMD_PATH: "./cmd/server",
  BIN_DIR: "./bin",
  RELEASE_DIR: "./release",
  DEPS_DIR: join("..", "..", ".deps"),
  GO_LDFLAGS: "-s -w",
  PLAYER_UI_DIR: join("..", "player-ui"),
  PLAYER_ASSETS_DIR: join("assets", "player"),
};

const exeExt = process.platform === "win32" ? ".exe" : "";
const platformKey = `${process.platform}/${process.arch}`;
const homeDir =
  process.platform === "win32"
    ? win32.join(process.env.USERPROFILE || "C:\\", ".mediago")
    : join(process.env.HOME || "/home/user", ".mediago");

export const devConfig = {
  gin_mode: "debug",
  log_level: "debug",
  log_dir: `${homeDir}/logs`,
  config_dir: `${homeDir}/data`,
  schema_path: "./configs/config.json",
  m3u8_bin: `${config.DEPS_DIR}/${platformKey}/N_m3u8DL-RE${exeExt}`,
  bilibili_bin: `${config.DEPS_DIR}/${platformKey}/BBDown${exeExt}`,
  direct_bin: `${config.DEPS_DIR}/${platformKey}/gopeed${exeExt}`,
  ffmpeg_bin: `${config.DEPS_DIR}/${platformKey}/ffmpeg${exeExt}`,
  max_runner: 3,
  local_dir: `${homeDir}/downloads`,
  delete_segments: true,
  proxy: "",
  use_proxy: false,
};

export interface BuildConfig {
  goos: string;
  goarch: string;
  platform?: string;
  arch?: string;
}

export interface PlatformDefinition extends BuildConfig {
  id: string;
  toolsPlatform: string;
  toolsArch: string;
}

export const releaseConfig = {
  packagesDir: "packages",
  packageBinDir: "bin",
  packageConfigsDir: "configs",
  packageLogsDir: "logs",
  readmeFile: "README.txt",
  startScript: "start.sh",
  downloadSchema: join("configs", "config.json"),
};

export const PLATFORMS: PlatformDefinition[] = [
  {
    id: "linux-x64",
    goos: "linux",
    goarch: "amd64",
    toolsPlatform: "linux",
    toolsArch: "x64",
  },
  {
    id: "linux-arm64",
    goos: "linux",
    goarch: "arm64",
    toolsPlatform: "linux",
    toolsArch: "arm64",
  },
  {
    id: "darwin-x64",
    goos: "darwin",
    goarch: "amd64",
    toolsPlatform: "darwin",
    toolsArch: "x64",
  },
  {
    id: "darwin-arm64",
    goos: "darwin",
    goarch: "arm64",
    toolsPlatform: "darwin",
    toolsArch: "arm64",
  },
  {
    id: "win32-x64",
    goos: "windows",
    goarch: "amd64",
    toolsPlatform: "win32",
    toolsArch: "x64",
  },
  {
    id: "win32-arm64",
    goos: "windows",
    goarch: "arm64",
    toolsPlatform: "win32",
    toolsArch: "arm64",
  },
];

export const BUILD_PLATFORMS: BuildConfig[] = PLATFORMS.map(
  ({ goos, goarch }) => ({ goos, goarch }),
);

export const PACKAGE_PLATFORMS: BuildConfig[] = PLATFORMS.map(
  ({ goos, goarch, toolsPlatform, toolsArch }) => ({
    goos,
    goarch,
    platform: toolsPlatform,
    arch: toolsArch,
  }),
);
