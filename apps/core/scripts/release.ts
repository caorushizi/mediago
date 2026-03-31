import { series } from 'gulp';
import { existsSync, chmodSync } from 'fs';
import { join } from 'path';
import { platform as osPlatform } from 'os';
import { config, releaseConfig, BuildConfig, BUILD_PLATFORMS, PACKAGE_PLATFORMS } from './config';
import {
  mkdir,
  rmrf,
  copyFile,
  runCommand,
  resolveReleasePath,
} from './utils';

// ============================================================
// 发布环境任务 (Release Tasks)
// ============================================================

function getPackageName({ goos, goarch }: BuildConfig): string {
  return `${config.APP_NAME}-${goos}-${goarch}`;
}

function getTargetExt(goos: string): string {
  return goos === 'windows' ? '.exe' : '';
}

/**
 * 构建单个平台的二进制文件
 */
async function buildBinary(cfg: BuildConfig) {
  const ext = getTargetExt(cfg.goos);
  const output = join(config.BIN_DIR, `${getPackageName(cfg)}${ext}`);

  await runCommand(
    `go build -ldflags="${config.GO_LDFLAGS}" -o ${output} ${config.CMD_PATH}`,
    `✓ ${cfg.goos}/${cfg.goarch}`,
    {
      GOOS: cfg.goos,
      GOARCH: cfg.goarch,
      CGO_ENABLED: '0',
    }
  );
}

/**
 * 构建所有平台的二进制文件
 */
export async function releaseBuild() {
  console.log('🔨 构建所有平台二进制文件...');
  mkdir(config.BIN_DIR);

  await Promise.all(BUILD_PLATFORMS.map(buildBinary));
  console.log('✅ 全平台二进制文件编译完成');
}

/**
 * 打包单个平台的发布包
 */
async function packagePlatform(cfg: BuildConfig) {
  const ext = getTargetExt(cfg.goos);
  const pkgName = getPackageName(cfg);
  const pkgDir = resolveReleasePath(releaseConfig.packagesDir, pkgName);
  const toolsSrc = join(config.TOOLS_BIN_DIR, cfg.platform!, cfg.arch!);

  // 创建目录结构
  mkdir(pkgDir);
  mkdir(join(pkgDir, releaseConfig.packageBinDir));
  mkdir(join(pkgDir, releaseConfig.packageConfigsDir));
  mkdir(join(pkgDir, releaseConfig.packageLogsDir));

  // 复制主程序
  copyFile(
    join(config.BIN_DIR, `${pkgName}${ext}`),
    join(pkgDir, `${config.APP_NAME}${ext}`)
  );

  // 复制下载器工具
  if (existsSync(toolsSrc)) {
    copyFile(toolsSrc, join(pkgDir, releaseConfig.packageBinDir));
  }

  // 复制配置文件
  if (existsSync(releaseConfig.downloadSchema)) {
    copyFile(releaseConfig.downloadSchema, join(pkgDir, releaseConfig.packageConfigsDir));
  }

  // 设置可执行权限
  if (cfg.goos !== 'windows' && osPlatform() !== 'win32') {
    try {
      chmodSync(join(pkgDir, config.APP_NAME), 0o755);
      const binDir = join(pkgDir, releaseConfig.packageBinDir);
      if (existsSync(binDir)) {
        await runCommand(`chmod +x ${join(binDir, '*')}`, undefined);
      }
    } catch (error) {
      // 忽略权限错误
    }
  }

  console.log(`✓ ${cfg.goos}/${cfg.goarch} 发布包已打包`);
}

/**
 * 打包所有平台的完整发布包
 */
async function releasePackage() {
  console.log('📦 打包所有平台发布包...');

  await Promise.all(PACKAGE_PLATFORMS.map(packagePlatform));

  console.log('✅ 所有平台发布包打包完成');
  console.log(`📦 发布包位置: ${resolveReleasePath(releaseConfig.packagesDir)}/`);
}

/**
 * 清理所有发布产物
 */
export async function releaseClean() {
  console.log('🧹 清理发布产物...');
  rmrf(config.BIN_DIR);
  rmrf(config.RELEASE_DIR);
  console.log('✅ 发布产物清理完成');
}
export const releasePackageFull = series(releaseClean, releaseBuild, releasePackage);
