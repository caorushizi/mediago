import fs from "node:fs/promises";
import os from "node:os";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenvFlow from "dotenv-flow";
import { type Configuration, build } from "electron-builder";

const args = process.argv.slice(2);
const isDir = args.includes("--dir");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const appRoot = path.resolve(__dirname, "..");
const arch = process.arch === "arm64" ? "arm64" : "x64";

dotenvFlow.config({
  path: projectRoot,
});

const pkg = JSON.parse(await fs.readFile("./app/package.json", "utf-8"));

function getReleaseConfig(): Configuration {
  return {
    asar: true,
    asarUnpack: [],
    productName: process.env.APP_NAME,
    buildVersion: pkg.version,
    appId: process.env.APP_ID,
    copyright: process.env.APP_COPYRIGHT,
    artifactName:
      "${productName}-setup-${platform}-${arch}-${buildVersion}.${ext}",
    npmRebuild: true,
    directories: {
      output: "./release",
    },
    files: [
      {
        from: "./build/main",
        to: "./main",
      },
      {
        from: "./build/renderer",
        to: "./renderer",
      },
      {
        from: "./build/preload",
        to: "./preload",
      },
      "./package.json",
    ],
    extraResources: [
      {
        from: "./app/build/plugin",
        to: "plugin",
      },
      {
        from: "./app/build/bin",
        to: "bin",
      },
      {
        from: "./app/build/deps",
        to: "deps",
      },
    ],
    win: {
      icon: "../assets/icon.ico",
      target: [
        {
          target: "nsis",
          arch,
        },
        {
          target: "portable",
          arch,
        },
      ],
    },
    portable: {
      artifactName:
        "${productName}-portable-${platform}-${arch}-${buildVersion}.${ext}",
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
          arch,
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
        arch,
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
    src: "packages/browser-extension/build",
    dest: "app/build/plugin",
  },
];

for (const task of electronTask) {
  await fs.cp(
    path.resolve(projectRoot, task.src),
    path.resolve(appRoot, task.dest),
    {
      recursive: true,
      force: true,
    },
  );
}

// Copy Go binaries to app/build/bin/ and app/build/deps/ for extraResources
const isWindows = os.platform() === "win32";
const ext = isWindows ? ".exe" : "";
const binDir = path.resolve(appRoot, "app/build/bin");
const depsDir = path.resolve(appRoot, "app/build/deps");

await fs.mkdir(binDir, { recursive: true });
await fs.mkdir(depsDir, { recursive: true });

// Copy mediago-core binary + config
await fs.copyFile(
  path.resolve(projectRoot, `apps/core/bin/mediago-core${ext}`),
  path.join(binDir, `mediago-core${ext}`),
);
await fs.copyFile(
  path.resolve(projectRoot, "apps/core/configs/config.json"),
  path.join(binDir, "config.json"),
);

// Copy mediago-player binary
await fs.copyFile(
  path.resolve(projectRoot, `apps/player/dist/mediago-player${ext}`),
  path.join(binDir, `mediago-player${ext}`),
);

// Copy dependency binaries (ffmpeg, N_m3u8DL-RE, BBDown, gopeed)
const platformKey = `${os.platform()}-${os.arch()}`;
const localDepsDir = path.resolve(projectRoot, ".deps", platformKey);
try {
  await fs.cp(localDepsDir, depsDir, { recursive: true, force: true });
} catch {
  console.warn(`Warning: .deps/${platformKey} not found, skipping deps copy`);
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
await build({
  config,
  dir: isDir,
  // targets: Platform.WINDOWS.createTarget(["nsis", "portable"], Arch.x64),
});
