#!/usr/bin/env node

/**
 * Post-install script for @mediago/core
 * Detects the current platform and assembles files from split core/deps packages.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const PACKAGE_SCOPE = '@mediago';
const CORE_PACKAGE = 'core';
const CORE_PLATFORM_PREFIX = 'core-';
const DEPS_PLATFORM_PREFIX = 'deps-';
const TARGET_FILES_DIR = 'files';
const PACKAGE_NAME = `${PACKAGE_SCOPE}/${CORE_PACKAGE}`;
const CORE_CONFIG_FILE = 'config.json';
const DEPS_DIR = 'bin';

function detectPlatform() {
  const platform = os.platform();
  const arch = os.arch();

  const platformMap = {
    darwin: { x64: 'darwin-x64', arm64: 'darwin-arm64' },
    linux: { x64: 'linux-x64', arm64: 'linux-arm64' },
    win32: { x64: 'win32-x64', arm64: 'win32-arm64' },
  };

  const archMap = platformMap[platform];
  if (!archMap) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const target = archMap[arch];
  if (!target) {
    throw new Error(`Unsupported architecture: ${arch} on ${platform}`);
  }

  return target;
}

function resolvePackageDir(packageName, { optional = false } = {}) {
  try {
    const pkgPath = require.resolve(`${packageName}/package.json`);
    return path.dirname(pkgPath);
  } catch (err) {
    if (optional) {
      return null;
    }
    console.error(`Error: Could not find ${packageName}.`);
    console.error(`Please reinstall ${PACKAGE_NAME} to ensure all dependencies are installed.`);
    process.exit(1);
  }
}

function copyDirectoryContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isSymbolicLink()) {
      const realPath = fs.realpathSync(srcPath);
      const stat = fs.statSync(realPath);
      if (stat.isDirectory()) {
        copyDirectoryContents(realPath, destPath);
      } else {
        fs.copyFileSync(realPath, destPath);
      }
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectoryContents(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writeCliShim(rootDir, isWindows) {
  const binDir = path.join(rootDir, 'bin');
  if (fs.existsSync(binDir)) {
    fs.rmSync(binDir, { recursive: true, force: true });
  }
  fs.mkdirSync(binDir, { recursive: true });

  const shimPath = path.join(binDir, 'mediago-core');
  const shimContent = `#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const binaryName = process.platform === 'win32' ? 'mediago-core.exe' : 'mediago-core';
const binaryPath = path.join(__dirname, '..', '${TARGET_FILES_DIR}', binaryName);
const result = spawnSync(binaryPath, process.argv.slice(2), { stdio: 'inherit' });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
`;

  fs.writeFileSync(shimPath, shimContent, 'utf-8');
  if (!isWindows) {
    fs.chmodSync(shimPath, 0o755);
  }
}

function copyCorePackage(coreDir, targetDir, isWindows) {
  const binaryName = `mediago-core${isWindows ? '.exe' : ''}`;
  const sourceBinary = path.join(coreDir, binaryName);
  if (!fs.existsSync(sourceBinary)) {
    console.error(`Error: Core binary not found at ${sourceBinary}`);
    process.exit(1);
  }

  const targetBinary = path.join(targetDir, binaryName);
  fs.copyFileSync(fs.realpathSync(sourceBinary), targetBinary);

  const sourceConfig = path.join(coreDir, CORE_CONFIG_FILE);
  if (fs.existsSync(sourceConfig)) {
    fs.copyFileSync(fs.realpathSync(sourceConfig), path.join(targetDir, CORE_CONFIG_FILE));
  }

  if (!isWindows) {
    fs.chmodSync(targetBinary, 0o755);
  }
}

function copyDepsPackage(depsDir, targetDir) {
  if (!depsDir) return;
  const depsBinDir = path.join(depsDir, DEPS_DIR);
  copyDirectoryContents(depsBinDir, path.join(targetDir, DEPS_DIR));
}

function setupBinary() {
  const platform = detectPlatform();
  const isWindows = platform.startsWith('win32');
  const rootDir = __dirname;
  const targetDir = path.join(rootDir, TARGET_FILES_DIR);
  const corePackageName = `${PACKAGE_SCOPE}/${CORE_PLATFORM_PREFIX}${platform}`;
  const depsPackageName = `${PACKAGE_SCOPE}/${DEPS_PLATFORM_PREFIX}${platform}`;
  const coreDir = resolvePackageDir(corePackageName);
  const depsDir = resolvePackageDir(depsPackageName, { optional: true });

  console.log(`Setting up mediago-core for ${platform}...`);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  copyCorePackage(coreDir, targetDir, isWindows);
  copyDepsPackage(depsDir, targetDir);

  writeCliShim(rootDir, isWindows);

  console.log(`mediago-core is ready to use.`);
}

try {
  setupBinary();
} catch (err) {
  console.error('Installation failed:', err.message);
  process.exit(1);
}
