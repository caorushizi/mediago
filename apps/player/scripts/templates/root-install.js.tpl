#!/usr/bin/env node

/**
 * Post-install script for @mediago/player
 * Detects the current platform and sets up the binary from the appropriate optional dependency
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PACKAGE_NAME = '@mediago/player';
const BINARY_NAME = 'mediago-player';

// Platform mapping: { platform: { arch: npmPackageSuffix } }
const PLATFORM_MAP = {
  darwin: { x64: 'darwin-x64', arm64: 'darwin-arm64' },
  linux: { x64: 'linux-x64', arm64: 'linux-arm64' },
  win32: { x64: 'win32-x64', arm64: 'win32-arm64' },
};

function detectPlatform() {
  const platform = os.platform();
  const arch = os.arch();
  const archMap = PLATFORM_MAP[platform];

  if (!archMap) {
    const supported = Object.keys(PLATFORM_MAP).join(', ');
    throw new Error(`Unsupported platform: ${platform}. Supported: ${supported}`);
  }

  const target = archMap[arch];
  if (!target) {
    const supported = Object.keys(archMap).join(', ');
    throw new Error(`Unsupported architecture: ${arch} on ${platform}. Supported: ${supported}`);
  }

  return target;
}

function resolvePlatformPackage(platformSuffix) {
  const packageName = `${PACKAGE_NAME}-${platformSuffix}`;
  try {
    const pkgPath = require.resolve(`${packageName}/package.json`);
    return path.dirname(pkgPath);
  } catch (err) {
    throw new Error(
      `Could not find ${packageName}. Please run 'npm install' to ensure all dependencies are installed.`
    );
  }
}

function setupBinary() {
  const platformSuffix = detectPlatform();
  const isWindows = platformSuffix.startsWith('win32');
  const binaryName = isWindows ? `${BINARY_NAME}.exe` : BINARY_NAME;

  console.log(`\nSetting up MediaGo Player for ${platformSuffix}...`);

  const platformPkgDir = resolvePlatformPackage(platformSuffix);
  const sourceBinary = path.join(platformPkgDir, 'bin', binaryName);
  const binDir = path.join(__dirname, 'bin');
  const targetBinary = path.join(binDir, binaryName);

  // Validate source binary exists
  if (!fs.existsSync(sourceBinary)) {
    throw new Error(`Binary not found at ${sourceBinary}`);
  }

  // Create bin directory
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Remove existing binary if it exists
  if (fs.existsSync(targetBinary)) {
    fs.unlinkSync(targetBinary);
  }

  // Always copy the binary to avoid symlink issues on macOS/Linux
  fs.copyFileSync(sourceBinary, targetBinary);
  if (!isWindows) {
    fs.chmodSync(targetBinary, 0o755);
  }
  console.log(`✓ Copied binary to ${path.relative(__dirname, targetBinary)}`);

  console.log(`✓ MediaGo Player is ready! Run 'npx ${PACKAGE_NAME}' to start.\n`);
}

// Main
try {
  setupBinary();
} catch (err) {
  console.error(`\n✗ Installation failed: ${err.message}\n`);
  process.exit(1);
}
