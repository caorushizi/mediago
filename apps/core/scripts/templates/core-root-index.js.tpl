/**
 * Runtime resolver for {{npmScope}}/{{corePackageName}}
 * Resolves the platform-specific binary and config at runtime (no postinstall copy).
 */

const os = require('os');
const path = require('path');

const PLATFORM_MAP = {
  'darwin-x64': '{{npmScope}}/{{corePlatformPrefix}}darwin-x64',
  'darwin-arm64': '{{npmScope}}/{{corePlatformPrefix}}darwin-arm64',
  'linux-x64': '{{npmScope}}/{{corePlatformPrefix}}linux-x64',
  'linux-arm64': '{{npmScope}}/{{corePlatformPrefix}}linux-arm64',
  'win32-x64': '{{npmScope}}/{{corePlatformPrefix}}win32-x64',
  'win32-arm64': '{{npmScope}}/{{corePlatformPrefix}}win32-arm64',
};

function getPlatformPackageDir() {
  const key = `${os.platform()}-${os.arch()}`;
  const pkg = PLATFORM_MAP[key];
  if (!pkg) {
    throw new Error(`Unsupported platform: ${key}. Supported: ${Object.keys(PLATFORM_MAP).join(', ')}`);
  }
  return path.dirname(require.resolve(`${pkg}/package.json`));
}

function getBinaryPath() {
  const dir = getPlatformPackageDir();
  const ext = os.platform() === 'win32' ? '.exe' : '';
  return path.join(dir, `{{appName}}${ext}`);
}

function getConfigPath() {
  const dir = getPlatformPackageDir();
  return path.join(dir, '{{downloadSchemaFile}}');
}

module.exports = { getBinaryPath, getConfigPath, getPlatformPackageDir };
