import builder from "electron-builder";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainResolve = (r) => resolve(__dirname, "..", r);
const rootResolve = (r) => resolve(__dirname, "../../..", r);
const Platform = builder.Platform;

const env = existsSync(rootResolve(".env.development.local"))
  ? rootResolve(".env.development.local")
  : rootResolve(".env.development");
dotenv.config({ path: env });

console.log(process.env.APP_NAME);

// Let's get that intellisense working
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const options = {
  productName: process.env.APP_NAME,
  appId: process.env.APP_ID,
  copyright: process.env.APP_COPYRIGHT,
  artifactName: "${productName}-setup-${version}.${ext}",
  directories: {
    output: "./dist",
  },
  files: [
    {
      from: "./build",
      to: "./",
      filter: ["**/*"],
    },
    "./package.json",
    {
      from: "./node_modules/better-sqlite3/build/Release",
      to: "./build/Release",
    },
  ],
  extraResources: ["bin/**/*"],
  win: {
    icon: "../assets/icon.ico",
    target: [
      {
        target: "nsis",
      },
    ],
  },
  dmg: {
    contents: [],
  },
  mac: {
    icon: "../icons/icon.icns",
    target: {
      target: "default",
      arch: ["x64", "arm64"],
    },
  },
  linux: {
    icon: "../build/icons",
  },
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: "",
    uninstallerIcon: "",
    installerHeaderIcon: "",
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "",
    include: "",
    script: "",
  },
};

const target =
  process.env.NODE_ENV === "development"
    ? builder.DIR_TARGET
    : builder.DEFAULT_TARGET;
try {
  await builder.build({
    targets: Platform.WINDOWS.createTarget(target),
    config: options,
  });
} catch (e) {
  console.log(e);
}
