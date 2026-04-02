import {
  type ChildProcess,
  exec as execCallback,
  spawn,
} from "node:child_process";
import { promisify } from "node:util";
import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  writeFileSync,
  readFileSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { platform as osPlatform } from "node:os";
import { config, templateConfig, npmConfig } from "./config";

const exec = promisify(execCallback);

// ============================================================
// Utility Functions
// ============================================================

/**
 * Get version number
 * Priority: environment variable VERSION > Git Tag > 'dev'
 *
 * @example
 * # Specify version via environment variable
 * VERSION=1.2.3 gulp npmBuild
 *
 * # Or in package.json scripts
 * "npm:build": "VERSION=1.2.3 gulp npmBuild"
 */
export async function getVersion(): Promise<string> {
  // 1. Prefer environment variable
  if (process.env.VERSION) {
    console.log(`📌 使用指定版本: ${process.env.VERSION}`);
    return process.env.VERSION;
  }

  // 2. Try to get from git
  try {
    const { stdout } = await exec("git describe --tags --always --dirty");
    const version = stdout.trim();
    if (version) {
      console.log(`📌 使用 Git 版本: ${version}`);
      return version;
    }
  } catch {
    // Git command failed, continue
  }

  // 3. Default version
  console.log("⚠️  未找到版本信息，使用默认版本: dev");
  return "dev";
}

/**
 * Get executable file extension
 */
export function getExeExt(os: string = osPlatform()): string {
  return os === "win32" ? ".exe" : "";
}

/**
 * Create directory
 */
export function mkdir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Recursively delete a file or directory
 */
export function rmrf(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * Copy a file or directory
 */
export function copyFile(src: string, dst: string): void {
  cpSync(src, dst, { recursive: true });
}

/**
 * Render a template file
 */
export function renderTemplate(
  templateName: string,
  context: Record<string, string> = {},
): string {
  const templatePath = join(templateConfig.dir, templateName);
  let template = readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(context)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    template = template.replace(pattern, value);
  }

  return template;
}

/**
 * Render and parse a JSON template
 */
export function renderJsonTemplate<T = any>(
  templateName: string,
  context: Record<string, string> = {},
): T {
  return JSON.parse(renderTemplate(templateName, context)) as T;
}

/**
 * Indent multi-line text
 */
export function indentMultiline(content: string, spaces: number): string {
  const padding = " ".repeat(spaces);
  return content
    .split("\n")
    .map((line, index) => (index === 0 ? line : padding + line))
    .join("\n");
}

/**
 * Resolve a path under the release directory
 */
export function resolveReleasePath(...segments: string[]): string {
  return join(config.RELEASE_DIR, ...segments);
}

/**
 * Resolve a path under the npm scope directory
 */
export function resolveNpmScopePath(...segments: string[]): string {
  return join(npmConfig.rootDir, npmConfig.scope, ...segments);
}

/**
 * Write a JSON file
 */
export function writeJsonFile(filePath: string, data: any): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Write a text file
 */
export function writeTextFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, "utf-8");
}

export interface RunCommandOptions {
  description?: string;
  env?: Record<string, string>;
  cwd?: string;
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

/**
 * Run a command (with live output)
 * @param command The command to execute
 * @param args Command arguments
 * @param options Options (description, env, cwd)
 */
export async function runCommand(
  command: string,
  args: string[] = [],
  options: RunCommandOptions = {},
): Promise<void> {
  registerCleanup();

  if (options.description) {
    console.log(`\n▶ ${options.description}: ${command} ${args.join(" ")}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "inherit",
      env: {
        ...process.env,
        ...options.env,
      },
      shell: process.platform === "win32",
    });

    childProcesses.add(child);

    child.on("error", (error) => {
      childProcesses.delete(child);
      console.error(`执行命令失败: ${error.message}`);
      reject(error);
    });

    child.on("close", (code) => {
      childProcesses.delete(child);
      if (code !== 0) {
        const error = new Error(`命令执行失败，退出码: ${code}`);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Set executable permissions on all files in a directory (Unix only)
 */
export function chmodExecutable(dir: string): void {
  if (osPlatform() === "win32" || !existsSync(dir)) {
    return;
  }
  const entries = readdirSync(dir);
  for (const entry of entries) {
    chmodSync(join(dir, entry), 0o755);
  }
}
