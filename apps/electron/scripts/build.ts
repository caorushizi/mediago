import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenvFlow from "dotenv-flow";
import type { Configuration } from "electron-builder";
import * as builder from "electron-builder";
import semver from "semver";

const args = process.argv.slice(2);
const isDir = args.includes("--dir");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const appRoot = path.resolve(__dirname, "..");

dotenvFlow.config({
  path: projectRoot,
});

const pkg = JSON.parse(await fs.readFile("./app/package.json", "utf-8"));

function getReleaseConfig(): Configuration {
  return {
    productName: process.env.APP_NAME,
    buildVersion: process.env.APP_VERSION,
    appId: process.env.APP_ID,
    copyright: process.env.APP_COPYRIGHT,
    artifactName: "${productName}-setup-${platform}-${arch}-${buildVersion}.${ext}",
    npmRebuild: true,
    directories: {
      output: "./release",
    },
    files: [
      {
        from: "./build",
        to: "./",
      },
      "./package.json",
    ],
    extraResources: [
      {
        from: "./app/build/plugin",
        to: "plugin",
      },
      {
        from: "./app/build/mobile",
        to: "mobile",
      },
      {
        from: "../../bin/${platform}/${arch}",
        to: "bin",
      },
    ],
    win: {
      icon: "../assets/icon.ico",
      target: [
        {
          target: "nsis",
          arch: ["x64"],
        },
        "portable",
      ],
    },
    portable: {
      artifactName: "${productName}-portable-${platform}-${arch}-${buildVersion}.${ext}",
    },
    dmg: {
      contents: [
        {
          x: 410,
          y: 150,
          type: "link",
          path: "/Applications",
        },
        {
          x: 130,
          y: 150,
          type: "file",
        },
      ],
    },
    mac: {
      icon: "../assets/icon.icns",
      target: [
        {
          target: "dmg",
          arch: [process.arch === "arm64" ? "arm64" : "x64"],
        },
      ],
      extendInfo: {
        CFBundleURLTypes: [
          {
            CFBundleURLName: "Mediago URL Scheme",
            CFBundleURLSchemes: ["mediago"],
          },
        ],
      },
    },
    linux: {
      category: "Utility",
      icon: "../assets/icon.icns",
      maintainer: "caorushizi <84996057@qq.com>",
      target: {
        target: "deb",
        arch: ["x64"],
      },
    },
    nsis: {
      oneClick: false,
      allowElevation: true,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
    },
  };
}

const electronTask = [
  {
    src: "apps/electron/build",
    dest: "app/build/main",
  },
  {
    src: "apps/ui/build/electron",
    dest: "app/build/renderer",
  },
  {
    src: "packages/electron-preload/build",
    dest: "app/build/preload",
  },
  {
    src: "packages/mobile-player/build",
    dest: "app/build/mobile",
  },
  {
    src: "packages/browser-extension/build",
    dest: "app/build/plugin",
  },
];

for (const task of electronTask) {
  await fs.cp(path.resolve(projectRoot, task.src), path.resolve(appRoot, task.dest), {
    recursive: true,
    force: true,
  });
}

if (semver.neq(process.env.APP_VERSION || "", pkg.version)) {
  throw new Error("请先同步构建版本和发布版本");
}

const config = getReleaseConfig();
if (process.env.GH_TOKEN) {
  config.publish = {
    provider: "github",
    repo: "mediago",
    owner: "caorushizi",
    releaseType: "draft",
  };
}
await builder.build({ config, dir: isDir });
