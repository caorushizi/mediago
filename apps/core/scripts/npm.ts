import { series } from 'gulp';
import { existsSync, chmodSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { platform as osPlatform } from 'os';
import {
  config,
  releaseConfig,
  npmConfig,
  PLATFORMS,
  PlatformDefinition,
  CORE_NPM_PACKAGES,
  DEPS_NPM_PACKAGES,
} from './config';
import {
  mkdir,
  rmrf,
  copyFile,
  runCommand,
  getVersion,
  resolveNpmScopePath,
  writeTextFile,
  renderJsonTemplate,
  renderTemplate,
  indentMultiline,
  writeJsonFile,
} from './utils';
import { releaseBuild, releaseClean } from './release';

// ============================================================
// NPM 包元数据生成 (Package Metadata Generation)
// ============================================================

interface GenerateOptions {
  core?: boolean;
  deps?: boolean;
  rootCore?: boolean;
  rootDeps?: boolean;
}

function generatePlatformCorePackage(platform: PlatformDefinition, coreVersion: string): any {
  const binaryFile = `${config.APP_NAME}${platform.goos === 'windows' ? '.exe' : ''}`;

  return renderJsonTemplate('core-platform-package.json.tpl', {
    name: platform.id,
    version: coreVersion,
    os: platform.toolsPlatform,
    cpu: platform.toolsArch,
    binaryFile,
    appName: config.APP_NAME,
    npmScope: npmConfig.scope,
    configFile: basename(releaseConfig.downloadSchema),
  });
}

function generatePlatformDepsPackage(platform: PlatformDefinition, depsVersion: string): any {
  return renderJsonTemplate('deps-platform-package.json.tpl', {
    name: platform.id,
    version: depsVersion,
    os: platform.toolsPlatform,
    cpu: platform.toolsArch,
    npmScope: npmConfig.scope,
    depsPackagePrefix: npmConfig.depsPlatformPrefix,
    binDir: releaseConfig.packageBinDir,
  });
}

function generateCoreRootPackage(coreVersion: string): any {
  const optionalDependencies: Record<string, string> = {};

  for (const platform of PLATFORMS) {
    optionalDependencies[
      `${npmConfig.scope}/${npmConfig.corePlatformPrefix}${platform.id}`
    ] = coreVersion;
  }

  const optionalDependenciesBlock = indentMultiline(
    JSON.stringify(optionalDependencies, null, 2),
    2
  );

  return renderJsonTemplate('core-root-package.json.tpl', {
    version: coreVersion,
    optionalDependencies: optionalDependenciesBlock,
    npmScope: npmConfig.scope,
    corePackageName: npmConfig.corePackageName,
  });
}

function generatePlatformCoreReadme(platform: PlatformDefinition): string {
  return renderTemplate('core-platform-readme.md.tpl', {
    name: platform.id,
    os: platform.toolsPlatform,
    cpu: platform.toolsArch,
    npmScope: npmConfig.scope,
    corePackageName: npmConfig.corePackageName,
  });
}

function generatePlatformDepsReadme(platform: PlatformDefinition): string {
  return renderTemplate('deps-platform-readme.md.tpl', {
    name: platform.id,
    os: platform.toolsPlatform,
    cpu: platform.toolsArch,
    npmScope: npmConfig.scope,
    depsPackagePrefix: npmConfig.depsPlatformPrefix,
    corePackageName: npmConfig.corePackageName,
    binDir: releaseConfig.packageBinDir,
  });
}

function generateDepsRootPackage(depsVersion: string): any {
  const optionalDependencies: Record<string, string> = {};

  for (const platform of PLATFORMS) {
    optionalDependencies[
      `${npmConfig.scope}/${npmConfig.depsPlatformPrefix}${platform.id}`
    ] = depsVersion;
  }

  const optionalDependenciesBlock = indentMultiline(JSON.stringify(optionalDependencies, null, 2), 2);

  return renderJsonTemplate('deps-root-package.json.tpl', {
    version: depsVersion,
    optionalDependencies: optionalDependenciesBlock,
    npmScope: npmConfig.scope,
    depsPackageName: npmConfig.depsPackageName,
  });
}

function generateCoreRootReadme(coreVersion: string): string {
  return renderTemplate('core-root-readme.md.tpl', {
    version: coreVersion,
    npmScope: npmConfig.scope,
    corePackageName: npmConfig.corePackageName,
  });
}

function generateDepsRootReadme(depsVersion: string): string {
  return renderTemplate('deps-root-readme.md.tpl', {
    version: depsVersion,
    npmScope: npmConfig.scope,
    depsPackageName: npmConfig.depsPackageName,
    corePackageName: npmConfig.corePackageName,
  });
}

function generateCoreRootIndexModule(): string {
  return renderTemplate('core-root-index.js.tpl', {
    npmScope: npmConfig.scope,
    corePackageName: npmConfig.corePackageName,
    appName: config.APP_NAME,
    corePlatformPrefix: npmConfig.corePlatformPrefix,
    downloadSchemaFile: basename(releaseConfig.downloadSchema),
  });
}

function generateDepsRootIndexModule(): string {
  return renderTemplate('deps-root-index.js.tpl', {
    npmScope: npmConfig.scope,
    depsPackageName: npmConfig.depsPackageName,
    depsPlatformPrefix: npmConfig.depsPlatformPrefix,
    packageBinDir: releaseConfig.packageBinDir,
  });
}

function writePackageJson(pkgDir: string, data: any): void {
  mkdir(pkgDir);
  writeJsonFile(join(pkgDir, npmConfig.packageJsonFile), data);
}

function writeReadme(pkgDir: string, content: string): void {
  writeTextFile(join(pkgDir, npmConfig.readmeFile), content);
}

function writeIndexModule(pkgDir: string, content: string): void {
  writeTextFile(join(pkgDir, 'index.js'), content);
}

function writePackageGitignore(pkgDir: string): void {
  writeTextFile(join(pkgDir, '.gitignore'), `mediago-core\nconfig.json\nbin/\n`);
}

async function generateNpmPackages(
  coreVersion: string,
  depsVersion: string,
  options: GenerateOptions = {}
): Promise<void> {
  const {
    core = true,
    deps = true,
    rootCore = true,
    rootDeps = true,
  } = options;

  console.log(
    `\n📦 生成 NPM 包文件 (core: ${coreVersion}, deps: ${depsVersion}, rootCore: ${rootCore}, rootDeps: ${rootDeps})...`
  );

  if (rootCore) {
    const coreRootPath = resolveNpmScopePath(npmConfig.corePackageName);
    writePackageJson(coreRootPath, generateCoreRootPackage(coreVersion));
    writeReadme(coreRootPath, generateCoreRootReadme(coreVersion));
    writeIndexModule(coreRootPath, generateCoreRootIndexModule());
  }

  if (rootDeps) {
    const depsRootPath = resolveNpmScopePath(npmConfig.depsPackageName);
    writePackageJson(depsRootPath, generateDepsRootPackage(depsVersion));
    writeReadme(depsRootPath, generateDepsRootReadme(depsVersion));
    writeIndexModule(depsRootPath, generateDepsRootIndexModule());
  }

  for (const platform of PLATFORMS) {
    if (core) {
      const corePlatformPkgPath = resolveNpmScopePath(
        `${npmConfig.corePlatformPrefix}${platform.id}`
      );
      writePackageJson(corePlatformPkgPath, generatePlatformCorePackage(platform, coreVersion));
      writeReadme(corePlatformPkgPath, generatePlatformCoreReadme(platform));
      writePackageGitignore(corePlatformPkgPath);
    }

    if (deps) {
      const depsPlatformPkgPath = resolveNpmScopePath(
        `${npmConfig.depsPlatformPrefix}${platform.id}`
      );
      writePackageJson(depsPlatformPkgPath, generatePlatformDepsPackage(platform, depsVersion));
      writeReadme(depsPlatformPkgPath, generatePlatformDepsReadme(platform));
      writePackageGitignore(depsPlatformPkgPath);
    }
  }

  console.log(
    `\n✅ 成功生成 NPM 包文件 (core: ${coreVersion}, deps: ${depsVersion}, rootCore: ${rootCore}, rootDeps: ${rootDeps})\n`
  );
}

// ============================================================
// NPM 包组装和发布 (Package Assembly and Publishing)
// ============================================================

async function cleanCoreArtifacts() {
  console.log('🧹 清理 Core 包构建产物...');
  rmrf(resolveNpmScopePath(npmConfig.corePackageName));
  for (const platform of PLATFORMS) {
    rmrf(resolveNpmScopePath(`${npmConfig.corePlatformPrefix}${platform.id}`));
  }
  console.log('✅ Core 包构建产物清理完成');
}

async function cleanDepsArtifacts() {
  console.log('🧹 清理依赖包构建产物...');
  rmrf(resolveNpmScopePath(npmConfig.depsPackageName));
  for (const platform of PLATFORMS) {
    rmrf(resolveNpmScopePath(`${npmConfig.depsPlatformPrefix}${platform.id}`));
  }
  console.log('✅ 依赖包构建产物清理完成');
}

async function assembleCorePackages() {
  console.log('📦 组装 Core NPM 包...');
  const coreVersion = await getVersion();
  console.log(`📌 Core 包版本: ${coreVersion}`);

  await generateNpmPackages(coreVersion, coreVersion, {
    core: true,
    deps: false,
    rootCore: true,
    rootDeps: false,
  });

  for (const platform of PLATFORMS) {
    const ext = platform.goos === 'windows' ? '.exe' : '';
    const binaryName = `${config.APP_NAME}-${platform.goos}-${platform.goarch}${ext}`;
    const binarySrc = join(config.BIN_DIR, binaryName);

    if (!existsSync(binarySrc)) {
      throw new Error(`未找到二进制文件: ${binarySrc}`);
    }

    const corePkgDir = resolveNpmScopePath(`${npmConfig.corePlatformPrefix}${platform.id}`);
    const coreBinaryTarget = join(corePkgDir, `${config.APP_NAME}${ext}`);
    const configFileTarget = join(corePkgDir, basename(releaseConfig.downloadSchema));

    rmrf(coreBinaryTarget);
    rmrf(configFileTarget);

    copyFile(binarySrc, coreBinaryTarget);

    if (existsSync(releaseConfig.downloadSchema)) {
      copyFile(releaseConfig.downloadSchema, configFileTarget);
    }

    if (platform.goos !== 'windows' && osPlatform() !== 'win32') {
      try {
        chmodSync(coreBinaryTarget, 0o755);
      } catch {
        // 忽略权限错误
      }
    }

    console.log(`✓ ${platform.goos}/${platform.goarch} core 包已准备 (版本 ${coreVersion})`);

    writeTextFile(
      join(corePkgDir, '.gitignore'),
      `mediago-core\nconfig.json\nbin/\n`
    );
  }

  console.log(`✅ Core NPM 包组装完成 (版本: ${coreVersion})`);
}

async function assembleDepsPackages() {
  console.log('📦 组装依赖 NPM 包...');
  const depsVersion = await getVersion();
  console.log(`📌 Deps 包版本: ${depsVersion}`);

  await generateNpmPackages(depsVersion, depsVersion, {
    core: false,
    deps: true,
    rootCore: false,
    rootDeps: true,
  });

  for (const platform of PLATFORMS) {
    const depsPkgDir = resolveNpmScopePath(`${npmConfig.depsPlatformPrefix}${platform.id}`);
    const depsBinDir = join(depsPkgDir, releaseConfig.packageBinDir);
    const toolsSrc = join(config.TOOLS_BIN_DIR, platform.toolsPlatform, platform.toolsArch);

    rmrf(depsBinDir);
    mkdir(depsBinDir);

    let hasDepsBinaries = false;
    if (existsSync(toolsSrc)) {
      const toolEntries = readdirSync(toolsSrc);
      for (const entry of toolEntries) {
        copyFile(join(toolsSrc, entry), join(depsBinDir, entry));
      }
      hasDepsBinaries = toolEntries.length > 0;
    }

    if (hasDepsBinaries && platform.goos !== 'windows' && osPlatform() !== 'win32') {
      try {
        await runCommand(`chmod -R +x ${depsBinDir}`);
      } catch {
        // 忽略权限错误
      }
    }

    if (hasDepsBinaries) {
      console.log(`✓ ${platform.goos}/${platform.goarch} deps 包已准备 (版本 ${depsVersion})`);
    } else {
      console.log(`⚠️  ${platform.goos}/${platform.goarch} 未找到依赖二进制，已跳过`);
      rmrf(depsBinDir);
    }

    writeTextFile(
      join(depsPkgDir, '.gitignore'),
      `mediago-core\nconfig.json\nbin/\n`
    );
  }

  console.log(`✅ 依赖 NPM 包组装完成 (版本: ${depsVersion})`);
}

export const buildCorePackages = series(cleanCoreArtifacts, releaseClean, releaseBuild, assembleCorePackages);

export const buildDepsPackages = series(cleanDepsArtifacts, assembleDepsPackages);

export async function publishCorePackages() {
  console.log('📤 发布 Core NPM 包...');

  // 先发布平台子包
  console.log('📦 发布平台子包...');
  for (const platform of PLATFORMS) {
    const pkg = resolveNpmScopePath(`${npmConfig.corePlatformPrefix}${platform.id}`);
    console.log(`  发布: ${npmConfig.scope}/${npmConfig.corePlatformPrefix}${platform.id}`);
    await runCommand(`cd ${pkg} && npm publish --access public`);
  }

  // 再发布主包
  console.log('📦 发布主包...');
  const rootPkg = resolveNpmScopePath(npmConfig.corePackageName);
  console.log(`  发布: ${npmConfig.scope}/${npmConfig.corePackageName}`);
  await runCommand(`cd ${rootPkg} && npm publish --access public`);

  console.log(`✅ Core NPM 包发布成功`);
}

export async function publishDepsPackages() {
  console.log('📤 发布依赖 NPM 包...');

  // 先发布平台子包
  console.log('📦 发布平台子包...');
  for (const platform of PLATFORMS) {
    const pkg = resolveNpmScopePath(`${npmConfig.depsPlatformPrefix}${platform.id}`);
    console.log(`  发布: ${npmConfig.scope}/${npmConfig.depsPlatformPrefix}${platform.id}`);
    await runCommand(`cd ${pkg} && npm publish --access public`);
  }

  // 再发布主包
  console.log('📦 发布主包...');
  const rootPkg = resolveNpmScopePath(npmConfig.depsPackageName);
  console.log(`  发布: ${npmConfig.scope}/${npmConfig.depsPackageName}`);
  await runCommand(`cd ${rootPkg} && npm publish --access public`);

  console.log(`✅ 依赖 NPM 包发布成功`);
}
