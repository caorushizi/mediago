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
import { exec } from "child_process";

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

function compileTypescript() {
  exec("npx tsc", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
  });
}

async function copySqlite() {
  const path = "build/Release/better_sqlite3.node";
  const source = mainResolve("node_modules/better-sqlite3", path);
  const target = mainResolve("app", path);
  fs.cpSync(source, target, { recursive: true });
}

async function copyBin() {
  const source = mainResolve("bin", process.platform, process.arch);
  const target = mainResolve("app/bin");
  fs.cpSync(source, target, { recursive: true });
}

async function chmodBin() {
  // Go through all the files in the folder and set the permissions on the files to 777
  if (isWin) return;

  const files = globSync(mainResolve("app/bin/*"));
  for (const file of files) {
    fs.chmodSync(file, 0o777);
  }
}

async function copyUpdateConfig() {
  const source = mainResolve("dev-app-update.yml");
  const target = mainResolve("app/build/main/dev-app-update.yml");
  fs.cpSync(source, target, { recursive: true });
}

const devCopy = gulp.parallel(copyBin, copySqlite, copyUpdateConfig);
const buildCopy = gulp.parallel(copySqlite);

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
      compileTypescript();

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

// Development environment
export const dev = gulp.series(devCopy, chmodBin, watchTask);
// Build packaging
export const build = gulp.series(clean, buildCopy, chmodBin, buildTask);
// release
export const release = gulp.series(pack);
