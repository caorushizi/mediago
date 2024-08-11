import { deleteSync } from "del";
import { ElectronApp, mainResolve, Env, isWin } from "./utils";
import gulp from "gulp";
import * as esbuild from "esbuild";
import consola from "consola";
import { browserOptions, nodeOptions, getReleaseConfig } from "./config";
import semver from "semver";
import pkg from "../app/package.json";
import * as builder from "electron-builder";
import { globSync } from "glob";
import fs from "fs";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync([
    mainResolve("app/build"),
    mainResolve("app/bin"),
    mainResolve("app/mobile"),
    mainResolve("app/plugin"),
    mainResolve("release"),
  ]);
}

async function copySqlite() {
  const path = "build/Release/better_sqlite3.node";
  const source = mainResolve("node_modules/better-sqlite3", path);
  const target = mainResolve("app", path);
  fs.cpSync(source, target, { recursive: true });
}

async function copyBin() {
  const source = mainResolve("bin", process.platform);
  const target = mainResolve("app/bin");
  fs.cpSync(source, target, { recursive: true });
}

async function chmodBin() {
  // 遍历文件夹下的所有文件，将文件的权限设置为 777
  if (isWin) return;

  const files = globSync(mainResolve("app/bin/*"));
  for (const file of files) {
    fs.chmodSync(file, 0o777);
  }
}

const copy = gulp.parallel(copyBin, copySqlite);

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
      releaseType: "draft",
    };
  }
  await builder.build({ config });
}

// 开发环境
export const dev = gulp.series(copy, chmodBin, watchTask);
// 构建打包
export const build = gulp.series(clean, copy, chmodBin, buildTask);
// release
export const release = gulp.series(pack);
