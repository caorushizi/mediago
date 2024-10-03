import { deleteSync } from "del";
import { mainResolve, Env, isDev } from "./utils";
import gulp from "gulp";
import * as esbuild from "esbuild";
import consola from "consola";
import { buildOptions } from "./config";
import fs from "fs";
import nodemon from "gulp-nodemon";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync([mainResolve("dist/server")]);
}

async function buildClean() {
  return deleteSync([mainResolve("dist")]);
}

async function copyBin() {
  const source = mainResolve("../main/bin", isDev ? process.platform : "linux");
  const target = mainResolve("dist/server/bin");
  fs.cpSync(source, target, { recursive: true });
}

const copy = gulp.parallel(copyBin);

async function watchTask() {
  const main = await esbuild.context(buildOptions());
  await main.rebuild();

  const watcher = gulp.watch(["./src"]);
  watcher
    .on("change", async () => {
      await main.rebuild();
    })
    .on("error", (error: any) => {
      consola.error(error);
    });

  nodemon();
  return Promise.resolve();
}

async function buildTask() {
  await esbuild.build(buildOptions());
}

// 开发环境
export const dev = gulp.series(clean, copy, watchTask);
// 构建打包
export const build = gulp.series(buildClean, copy, buildTask);
