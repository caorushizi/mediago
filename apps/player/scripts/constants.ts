import path from "node:path";

export interface PlatformTarget {
  goos: string;
  goarch: string;
  platform: string;
  binaryName: string;
}

// Directory paths
const ROOT_DIR = path.resolve(__dirname, "..");
export const UI_DIR = path.join(ROOT_DIR, "ui");
export const ASSETS_UI_DIR = path.join(ROOT_DIR, "assets", "ui");
export const DIST_DIR = path.join(ROOT_DIR, "dist");
export const NPM_DIR = path.join(ROOT_DIR, "npm");
export const RELEASE_NPM_DIR = path.join(ROOT_DIR, "release", "npm");
export const ROOT_PATH = ROOT_DIR;

// Platform detection
export const IS_WINDOWS = process.platform === "win32";
export const SERVER_BINARY_NAME = `mediago-player${IS_WINDOWS ? ".exe" : ""}`;
export const SERVER_BINARY_PATH = path.join(DIST_DIR, SERVER_BINARY_NAME);

// Build targets
export const PLATFORM_TARGETS: PlatformTarget[] = [
  {
    goos: "darwin",
    goarch: "amd64",
    platform: "darwin-x64",
    binaryName: "mediago-player",
  },
  {
    goos: "darwin",
    goarch: "arm64",
    platform: "darwin-arm64",
    binaryName: "mediago-player",
  },
  {
    goos: "linux",
    goarch: "amd64",
    platform: "linux-x64",
    binaryName: "mediago-player",
  },
  {
    goos: "linux",
    goarch: "arm64",
    platform: "linux-arm64",
    binaryName: "mediago-player",
  },
  {
    goos: "windows",
    goarch: "amd64",
    platform: "win32-x64",
    binaryName: "mediago-player.exe",
  },
  {
    goos: "windows",
    goarch: "arm64",
    platform: "win32-arm64",
    binaryName: "mediago-player.exe",
  },
];
