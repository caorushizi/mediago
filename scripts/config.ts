import { join } from "path";
import { win32 } from "path/win32";

// ============================================================
// 配置变量 (Configuration Variables)
// ============================================================

export const config = {
  APP_NAME: "mediago-core",
  CMD_PATH: "./cmd/server",
  BIN_DIR: "./bin",
  RELEASE_DIR: "./release",
  TOOLS_BIN_DIR: ".bin",
  GO_LDFLAGS: "-s -w",
};

const exeExt = process.platform === "win32" ? ".exe" : "";
const homeDir =
  process.platform === "win32"
    ? win32.join(process.env.USERPROFILE || "C:\\", ".mediago")
    : join(process.env.HOME || "/home/user", ".mediago");

export const devConfig = {
  gin_mode: "debug",
  log_level: "debug",
  log_dir: `${homeDir}/logs`,
  schema_path: "./configs/config.json",
  m3u8_bin: `./.bin/${process.platform}/${process.arch}/N_m3u8DL-RE${exeExt}`,
  bilibili_bin: `./.bin/${process.platform}/${process.arch}/BBDown${exeExt}`,
  direct_bin: `./.bin/${process.platform}/${process.arch}/gopeed${exeExt}`,
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

export const templateConfig = {
  dir: join("scripts", "templates"),
};

export const npmConfig = {
  rootDir: "npm",
  scope: "@mediago",
  filesDir: "files",
  packageJsonFile: "package.json",
  readmeFile: "README.md",
  corePackageName: "core",
  depsPackageName: "deps",
  corePlatformPrefix: "core-",
  depsPlatformPrefix: "deps-",
};

export const releaseConfig = {
  packagesDir: "packages",
  npmDir: "npm",
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
  ({ goos, goarch }) => ({ goos, goarch })
);

export const PACKAGE_PLATFORMS: BuildConfig[] = PLATFORMS.map(
  ({ goos, goarch, toolsPlatform, toolsArch }) => ({
    goos,
    goarch,
    platform: toolsPlatform,
    arch: toolsArch,
  })
);

export const NPM_PACKAGE_MAPPINGS = PLATFORMS.map(({ goos, goarch, id }) => ({
  src: `${config.APP_NAME}-${goos}-${goarch}`,
  dst: `core-${id}`,
}));

const npmScopePath = `${npmConfig.rootDir}/${npmConfig.scope}`;

export const CORE_NPM_PACKAGES = [
  `${npmScopePath}/${npmConfig.corePackageName}`,
  ...PLATFORMS.map(
    ({ id }) => `${npmScopePath}/${npmConfig.corePlatformPrefix}${id}`
  ),
];

export const DEPS_NPM_PACKAGES = [
  `${npmScopePath}/${npmConfig.depsPackageName}`,
  ...PLATFORMS.map(
    ({ id }) => `${npmScopePath}/${npmConfig.depsPlatformPrefix}${id}`
  ),
];

export const NPM_PACKAGES = [...CORE_NPM_PACKAGES, ...DEPS_NPM_PACKAGES];
