/**
 * Runtime resolver for {{npmScope}}/{{depsPackageName}}
 * Resolves the platform-specific helper binaries at runtime (no postinstall copy).
 */

const os = require('os');
const path = require('path');

const PLATFORM_MAP = {
  'darwin-x64': '{{npmScope}}/{{depsPlatformPrefix}}darwin-x64',
  'darwin-arm64': '{{npmScope}}/{{depsPlatformPrefix}}darwin-arm64',
  'linux-x64': '{{npmScope}}/{{depsPlatformPrefix}}linux-x64',
  'linux-arm64': '{{npmScope}}/{{depsPlatformPrefix}}linux-arm64',
  'win32-x64': '{{npmScope}}/{{depsPlatformPrefix}}win32-x64',
  'win32-arm64': '{{npmScope}}/{{depsPlatformPrefix}}win32-arm64',
};

function getPlatformPackageDir() {
  const key = `${os.platform()}-${os.arch()}`;
  const pkg = PLATFORM_MAP[key];
  if (!pkg) {
    throw new Error(`Unsupported platform: ${key}. Supported: ${Object.keys(PLATFORM_MAP).join(', ')}`);
  }
  return path.dirname(require.resolve(`${pkg}/package.json`));
}

function getBinDir() {
  return path.join(getPlatformPackageDir(), '{{packageBinDir}}');
}

module.exports = { getBinDir, getPlatformPackageDir };
