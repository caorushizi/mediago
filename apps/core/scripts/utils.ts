import { exec as execCallback, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, rmSync, cpSync, chmodSync, writeFileSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { platform as osPlatform } from 'os';
import { config, releaseConfig, templateConfig, npmConfig } from './config';

const exec = promisify(execCallback);

// ============================================================
// 工具函数 (Utility Functions)
// ============================================================

/**
 * 获取版本号
 * 优先级：环境变量 VERSION > Git Tag > 'dev'
 *
 * @example
 * # 使用环境变量指定版本
 * VERSION=1.2.3 gulp npmBuild
 *
 * # 或在 package.json 的 scripts 中
 * "npm:build": "VERSION=1.2.3 gulp npmBuild"
 */
export async function getVersion(): Promise<string> {
  // 1. 优先使用环境变量
  if (process.env.VERSION) {
    console.log(`📌 使用指定版本: ${process.env.VERSION}`);
    return process.env.VERSION;
  }

  // 2. 尝试从 git 获取
  try {
    const { stdout } = await exec('git describe --tags --always --dirty 2>/dev/null');
    const version = stdout.trim();
    if (version) {
      console.log(`📌 使用 Git 版本: ${version}`);
      return version;
    }
  } catch {
    // Git 命令失败，继续
  }

  // 3. 默认版本
  console.log('⚠️  未找到版本信息，使用默认版本: dev');
  return 'dev';
}

/**
 * 获取可执行文件扩展名
 */
export function getExeExt(os: string = osPlatform()): string {
  return os === 'win32' ? '.exe' : '';
}

/**
 * 创建目录
 */
export function mkdir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * 递归删除文件或目录
 */
export function rmrf(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

/**
 * 复制文件或目录
 */
export function copyFile(src: string, dst: string): void {
  cpSync(src, dst, { recursive: true });
}

/**
 * 渲染模板文件
 */
export function renderTemplate(templateName: string, context: Record<string, string> = {}): string {
  const templatePath = join(templateConfig.dir, templateName);
  let template = readFileSync(templatePath, 'utf-8');

  for (const [key, value] of Object.entries(context)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    template = template.replace(pattern, value);
  }

  return template;
}

/**
 * 渲染并解析 JSON 模板
 */
export function renderJsonTemplate<T = any>(templateName: string, context: Record<string, string> = {}): T {
  return JSON.parse(renderTemplate(templateName, context)) as T;
}

/**
 * 缩进多行文本
 */
export function indentMultiline(content: string, spaces: number): string {
  const padding = ' '.repeat(spaces);
  return content
    .split('\n')
    .map((line, index) => (index === 0 ? line : padding + line))
    .join('\n');
}

/**
 * 解析 release 目录下的路径
 */
export function resolveReleasePath(...segments: string[]): string {
  return join(config.RELEASE_DIR, ...segments);
}

/**
 * 解析 npm scope 目录下的路径
 */
export function resolveNpmScopePath(...segments: string[]): string {
  return join(npmConfig.rootDir, npmConfig.scope, ...segments);
}

/**
 * 写入 JSON 文件
 */
export function writeJsonFile(filePath: string, data: any): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * 写入文本文件
 */
export function writeTextFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * 运行命令（实时输出）
 * @param command 要执行的命令
 * @param description 命令描述（可选）
 * @param env 环境变量（可选）
 */
export async function runCommand(command: string, description?: string, env?: Record<string, string>): Promise<void> {
  if (description) {
    console.log(`\n▶ ${description}: ${command}`);
  }

  return new Promise((resolve, reject) => {
    // 使用 shell 模式执行命令，以支持管道、环境变量等
    const child = spawn(command, {
      shell: true,
      stdio: 'inherit', // 直接继承父进程的 stdio，实现实时输出
      env: {
        ...process.env,
        ...env
      },
    });

    child.on('error', (error) => {
      console.error(`执行命令失败: ${error.message}`);
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`命令执行失败，退出码: ${code}`);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

