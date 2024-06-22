import { Configuration } from "electron-builder";
import { Env, isDev, mainResolve } from "./utils";
import esbuild from "esbuild";

const external = [
  "electron",
  "nock",
  "aws-sdk",
  "mock-aws-s3",
  "@cliqz/adblocker-electron-preload",
  "node-pty",
];

function getConfig(): esbuild.BuildOptions {
  const getDefine = (): Record<string, string> => {
    if (isDev) {
      return {
        __bin__: `"${mainResolve("app/bin").replace(/\\/g, "\\\\")}"`,
      };
    }

    return {
      ...Env.getInstance().loadDotEnvDefined(),
      "process.env.NODE_ENV": '"production"',
    };
  };

  return {
    bundle: true,
    sourcemap: process.env.NODE_ENV === "development",
    external,
    define: getDefine(),
    outdir: mainResolve("app/build/main"),
    loader: { ".png": "file" },
    minify: process.env.NODE_ENV === "production",
  };
}

function buildOptions(
  entry: string,
  platform: esbuild.Platform,
  target: string
): esbuild.BuildOptions {
  return {
    ...getConfig(),
    entryPoints: [mainResolve(entry)],
    platform: platform,
    target: [target],
  };
}

export function browserOptions(entry: string): esbuild.BuildOptions {
  return buildOptions(entry, "browser", "chrome89");
}

export function nodeOptions(entry: string): esbuild.BuildOptions {
  return buildOptions(entry, "node", "node16.13");
}

export function getReleaseConfig(): Configuration {
  return {
    productName: process.env.APP_NAME,
    buildVersion: process.env.APP_VERSION,
    appId: process.env.APP_ID,
    copyright: process.env.APP_COPYRIGHT,
    artifactName: "${productName}-setup-${arch}-${buildVersion}.${ext}",
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
        from: "./app/plugin",
        to: "plugin",
      },
      {
        from: "./app/bin/",
        to: "bin",
      },
    ],
    win: {
      icon: "../assets/icon.ico",
      target: [
        {
          target: "nsis",
          arch: ["x64", "ia32"],
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
      target: [
        {
          target: "dmg",
          arch: ["x64", "arm64"],
        },
      ],
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
