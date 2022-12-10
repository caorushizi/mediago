import { series, parallel, src, dest } from "gulp";
import del from "del";

async function clean() {
  await del(["dist", "build", ".bin"]);
}

function copyMain() {
  return src("../app-main/dist/**/*").pipe(dest("./dist/main"));
}

function copyRenderer() {
  return src("../app-renderer/dist/**/*").pipe(dest("./dist/renderer"));
}

function copyBin() {
  return src("../app-main/.bin/**/*").pipe(dest(".bin"));
}

const source = series(clean, parallel(copyMain, copyRenderer, copyBin));

export { source };
