#!/usr/bin/env zx

import { $, echo } from "zx";
import type { ProcessOutput } from "zx";
import { printObject } from "./utils";

echo("开始执行代码质量评估...\n");

await $`pnpm spellcheck`.catch((out: ProcessOutput) => {
  printObject(out);
  throw new Error(out.stdout);
});

// check type and stage
await Promise.all([$`pnpm types`, $`pnpm lint-staged`]).catch(
  (out: ProcessOutput) => {
    printObject(out);
    throw new Error(out.stdout);
  },
);
