import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import fsp from "node:fs/promises";

import { ROOT_PATH } from "./constants";

export interface CommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

const childProcesses = new Set<ChildProcess>();
let cleanupRegistered = false;

function registerCleanup() {
  if (cleanupRegistered) {
    return;
  }
  cleanupRegistered = true;

  const cleanup = () => {
    for (const child of childProcesses) {
      if (!child.killed) {
        try {
          child.kill();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
}

export function runCommand(
  command: string,
  args: string[] = [],
  options: CommandOptions = {},
) {
  registerCleanup();

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT_PATH,
      env: { ...process.env, ...options.env },
      stdio: "inherit",
    });

    childProcesses.add(child);

    child.on("error", (error) => {
      childProcesses.delete(child);
      reject(error);
    });

    child.on("exit", (code, signal) => {
      childProcesses.delete(child);
      if (code === 0) {
        resolve();
      } else {
        const detail =
          typeof code === "number" ? `code ${code}` : `signal ${signal}`;
        reject(
          new Error(
            `Command "${command} ${args.join(" ")}" failed with ${detail}`,
          ),
        );
      }
    });
  });
}

export async function ensureDir(dir: string) {
  await fsp.mkdir(dir, { recursive: true });
}

export async function removeIfExists(target: string) {
  await fsp.rm(target, { recursive: true, force: true });
}

export async function pathExists(target: string) {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function copyDirectory(src: string, dest: string) {
  if (!(await pathExists(src))) {
    throw new Error(`Source directory "${src}" does not exist`);
  }
  await removeIfExists(dest);
  await fsp.cp(src, dest, { recursive: true });
}

export async function removeDirectoriesNamed(root: string, dirName: string) {
  if (!(await pathExists(root))) {
    return;
  }

  const entries = await fsp.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = `${root}/${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name === dirName) {
        await removeIfExists(entryPath);
      } else {
        await removeDirectoriesNamed(entryPath, dirName);
      }
    }
  }
}
