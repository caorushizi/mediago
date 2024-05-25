import { deleteSync } from "del";
import { ElectronApp, mainResolve, Env, isWin } from "./utils";
import gulp from "gulp";
import * as esbuild from "esbuild";
import consola from "consola";
import { browserOptions, nodeOptions, getReleaseConfig } from "./config";
import semver from "semver";
import pkg from "../app/package.json";
import * as builder from "electron-builder";
import glob from "glob";
import path from "path";
import fs from "fs";

process.env.NODE_ENV = "development";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync([
    mainResolve("app/build"),
    mainResolve("app/bin"),
    mainResolve("release"),
  ]);
}

async function copyBin() {
  const sourceDir = mainResolve("bin", process.platform);
  const targetDir = mainResolve("app/bin");

  // 获取源目录下的所有文件
  const files = glob.sync(path.join(sourceDir, "*"));

  // 遍历每个文件
  for (const file of files) {
    // 忽略 .gitignore 文件和 Logs 文件夹
    if (file.endsWith(".gitignore") || file.includes("Logs")) {
      continue;
    }

    // 计算目标文件的路径
    const targetFile = path.join(targetDir, path.basename(file));
    // 如果没有文件夹则创建文件夹
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
    }

    // 复制文件
    fs.copyFileSync(file, targetFile);
  }
}

async function chmodBin() {
  // 遍历文件夹下的所有文件，将文件的权限设置为 777
  if (isWin) return;

  const files = glob.sync(mainResolve("app/bin/*"));
  for (const file of files) {
    fs.chmodSync(file, 0o777);
  }
}

const copy = gulp.parallel(copyBin);

async function watchTask() {
  const app = new ElectronApp();
  const main = await esbuild.context(nodeOptions("src/index.ts"));
  const preload = await esbuild.context(browserOptions("src/preload.ts"));

  const watcher = gulp.watch(["./src"]);
  watcher
    .on("ready", async () => {
      await main.rebuild();
      await preload.rebuild();
      app.start();
    })
    .on("change", async () => {
      await main.rebuild();
      await preload.rebuild();
      app.restart();
    })
    .on("error", (error) => {
      consola.error(error);
      process.exit();
    });
  return Promise.resolve();
}

async function buildTask() {
  await esbuild.build(nodeOptions("src/index.ts"));
  await esbuild.build(browserOptions("src/preload.ts"));
}

async function pack() {
  if (semver.neq(process.env.APP_VERSION || "", pkg.version)) {
    throw new Error("请先同步构建版本和发布版本");
  }
  const config = getReleaseConfig();
  if (process.env.GH_TOKEN) {
    config.publish = {
      provider: "github",
      repo: "mediago",
      owner: "caorushizi",
      releaseType: "release",
    };
  }
  await builder.build({ config });
}

// 开发环境
export const dev = gulp.series(clean, copy, chmodBin, watchTask);
// 构建打包
export const build = gulp.series(clean, copy, chmodBin, buildTask);
// release
export const release = gulp.series(pack);
