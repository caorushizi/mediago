#!/usr/bin/env zx
import { fileURLToPath } from "url";
import { echo, path, fs, $ } from "zx";

echo("开始构建 development ...");
echo("当前所在的目录是:", process.cwd());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const main = path.resolve(root, "packages/main");
const app = path.resolve(main, "app");

if (!fs.existsSync(path.resolve(app, "plugin"))) {
  await $`npm run build:plugin`;
}
