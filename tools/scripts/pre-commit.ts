#!/usr/bin/env zx
import { $, echo } from "zx";
$.verbose = true;
if (process.platform === "win32") {
  $.prefix = "";
  $.shell = "pwsh.exe";
}

echo("开始执行代码质量评估...\n");

await import("./check").catch(() => {
  throw new Error("代码质量评估失败, 请检查代码");
});

echo('printf "检测通过, 创建 commit 中...\n');

await $`git add .`;
