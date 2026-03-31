import { exec as execCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  writeFileSync,
  readFileSync,
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
    const { stdout } = await exec(
      "git describe --tags --always --dirty 2>/dev/null",
    );
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

/**
 * Run a command (with live output)
 * @param command The command to execute
 * @param description Command description (optional)
 * @param env Environment variables (optional)
 */
export async function runCommand(
  command: string,
  description?: string,
  env?: Record<string, string>,
): Promise<void> {
  if (description) {
    console.log(`\n▶ ${description}: ${command}`);
  }

  return new Promise((resolve, reject) => {
    // Use shell mode to execute the command, supporting pipes, env vars, etc.
    const child = spawn(command, {
      shell: true,
      stdio: "inherit", // Inherit parent process stdio directly for live output
      env: {
        ...process.env,
        ...env,
      },
    });

    child.on("error", (error) => {
      console.error(`执行命令失败: ${error.message}`);
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const error = new Error(`命令执行失败，退出码: ${code}`);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
