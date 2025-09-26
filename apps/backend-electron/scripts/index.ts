import { exec } from "node:child_process";
import fs from "node:fs";
import { consola } from "consola";
import { deleteSync } from "del";
import * as builder from "electron-builder";
import * as esbuild from "esbuild";
import { globSync } from "glob";
import gulp from "gulp";
import semver from "semver";
import pkg from "../../../app/package.json";
import { browserOptions, getReleaseConfig, nodeOptions } from "./config";
import { ElectronApp, Env, isWin, mainResolve, rootResolve } from "./utils";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync(
    [
      rootResolve("app/build"),
      rootResolve("app/bin"),
      // rootResolve("app/mobile"),
      // rootResolve("app/plugin"),
      rootResolve("release"),
    ],
    {
      force: true,
    },
  );
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
  const target = rootResolve("app", path);
  fs.cpSync(source, target, { recursive: true });
}

async function copyBin() {
  const source = rootResolve("bin", process.platform, process.arch);
  const target = rootResolve("app/bin");
  fs.cpSync(source, target, { recursive: true });
}

async function chmodBin() {
  // Go through all the files in the folder and set the permissions on the files to 777
  if (isWin) return;

  const files = globSync(rootResolve("app/bin/*"));
  for (const file of files) {
    fs.chmodSync(file, 0o777);
  }
}

async function copyUpdateConfig() {
  const source = mainResolve("dev-app-update.yml");
  const target = rootResolve("app/build/main/dev-app-update.yml");
  fs.cpSync(source, target, { recursive: true });
}

const devCopy = gulp.parallel(copyBin, copySqlite, copyUpdateConfig);
const buildCopy = gulp.parallel(copySqlite);

async function watchTask() {
  const app = new ElectronApp();
  const main = await esbuild.context(nodeOptions("src/index.ts"));
  const preload = await esbuild.context(browserOptions("../../packages/electron-preload/src/preload.ts"));

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
  await esbuild.build(browserOptions("../../packages/electron-preload/src/preload.ts"));
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
