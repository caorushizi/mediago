#!/usr/bin/env zx
import { $, echo } from "zx";
import type { ProcessOutput } from "zx";
import { printObject } from "./utils";
$.verbose = true;
if (process.platform === "win32") {
  $.prefix = "";
  $.shell = "pwsh.exe";
}

echo("开始执行代码质量评估...\n");

// await $`pnpm spellcheck`.catch((out: ProcessOutput) => {
//   printObject(out);
//   throw new Error(out.stdout);
// });

// check type and stage
await Promise.all([$`pnpm types`]).catch((out: ProcessOutput) => {
  printObject(out);
  throw new Error(out.stdout);
});
