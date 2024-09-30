import { deleteSync } from "del";
import { mainResolve, Env } from "./utils";
import gulp from "gulp";
import * as esbuild from "esbuild";
import consola from "consola";
import { buildOptions } from "./config";
import fs from "fs";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync([mainResolve("dist/server")]);
}

async function copyBin() {
  const source = mainResolve("../main/bin", process.platform);
  const target = mainResolve("dist/server/bin");
  fs.cpSync(source, target, { recursive: true });
}

const copy = gulp.parallel(copyBin);

async function watchTask() {
  const main = await esbuild.context(buildOptions());

  const watcher = gulp.watch(["./src"]);
  watcher
    .on("ready", async () => {
      await main.rebuild();
    })
    .on("change", async () => {
      await main.rebuild();
    })
    .on("error", (error: any) => {
      consola.error(error);
    });
  return Promise.resolve();
}

async function buildTask() {
  await esbuild.build(buildOptions());
}

// 开发环境
// TODO 暂时不拷贝 bin 文件夹
export const dev = gulp.series(clean, copy, watchTask);
// 构建打包
export const build = gulp.series(clean, copy, buildTask);
