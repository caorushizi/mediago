import { loadDotEnvRuntime, mainResolve, removeResource } from "./utils";
import * as builder from "electron-builder";
import semver from "semver";
import pkg from "../app/package.json";
import consola from "consola";

removeResource([mainResolve("release")]);

loadDotEnvRuntime();

if (semver.neq(process.env.APP_VERSION || "", pkg.version)) {
  consola.log("请先同步构建版本和发布版本");
  process.exit(0);
}

const options: builder.Configuration = {
  productName: process.env.APP_NAME,
  buildVersion: process.env.APP_VERSION,
  appId: process.env.APP_ID,
  copyright: process.env.APP_COPYRIGHT,
  artifactName: "${productName}-setup-${arch}-${buildVersion}.${ext}",
  // FIXME: 这里屏蔽 node-pty 自动重构，因为会导致打包失败
  npmRebuild: false,
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
      from: "./app/plugin",
      to: "plugin",
    },
    {
      from: "./app/bin/${platform}/",
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
    ],
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
    target: {
      target: "dmg",
      arch: ["x64", "arm64"],
    },
  },
  linux: {
    category: "Utility",
    icon: "../assets/icon.icns",
    maintainer: "caorushizi <84996057@qq.com>",
    target: {
      target: "deb",
      arch: ["x64", "arm64"],
    },
  },
  nsis: {
    oneClick: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: false,
    installerIcon: "",
    uninstallerIcon: "",
    installerHeaderIcon: "",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "",
    include: "",
    script: "",
  },
  publish: {
    provider: "github",
    repo: "mediago",
    owner: "caorushizi",
    releaseType: "release",
  },
};

async function start() {
  try {
    await builder.build({
      config: options,
    });
  } catch (e) {
    consola.log(e);
  }
}

start();
