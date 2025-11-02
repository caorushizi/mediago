# 跨平台二进制文件打包解决方案

## 问题描述

在 Electron 应用构建过程中，我们遇到了跨平台二进制文件打包的问题：

### 依赖包
项目依赖以下三个包，它们都包含平台特定的二进制文件：
- `@mediago/core` - 核心功能二进制文件
- `@mediago/player` - 播放器二进制文件
- `@mediago/deps` - 辅助依赖二进制文件（如 ffmpeg）

### 问题
每个包都使用 `optionalDependencies` 来安装对应平台的二进制文件：
```json
{
  "optionalDependencies": {
    "@mediago/core-linux-x64": "0.0.13",
    "@mediago/core-linux-arm64": "0.0.13",
    "@mediago/core-darwin-x64": "0.0.13",
    "@mediago/core-darwin-arm64": "0.0.13",
    "@mediago/core-win32-x64": "0.0.13",
    "@mediago/core-win32-arm64": "0.0.13"
  }
}
```

**问题现象：**
- 在 Windows x64 上构建时，只会安装 `@mediago/xxx-win32-x64` 包
- 打包后的应用无法在 Windows ARM64 上运行
- 同样的问题也存在于其他平台组合

## 解决方案

### 1. 安装所有平台的二进制文件

创建了 `apps/electron/scripts/install-all-binaries.ts` 脚本，该脚本：
- 自动检测并安装所有平台的二进制包
- 将平台特定包添加到 `app/package.json` 的 `dependencies` 中
- 支持以下平台和架构组合：
  - Windows: x64, ARM64
  - macOS (darwin): x64, ARM64
  - Linux: x64, ARM64

**使用方法：**
```bash
pnpm -F @mediago/electron run install:binaries
```

### 2. 运行时动态选择正确的二进制文件

更新了 `packages/shared/node/src/utils/index.ts` 中的 `loadModule` 函数：

**原理：**
- 检测当前运行的平台 (`process.platform`) 和架构 (`process.arch`)
- 优先尝试加载平台特定的包（如 `@mediago/core-win32-x64`）
- 如果找不到，则回退到基础包名（保持向后兼容）

**示例：**
```typescript
// 在 Windows x64 上运行
loadModule("@mediago/core")  // 实际加载: @mediago/core-win32-x64

// 在 macOS ARM64 上运行
loadModule("@mediago/core")  // 实际加载: @mediago/core-darwin-arm64
```

### 3. 配置 Electron Builder

在 `apps/electron/scripts/build.ts` 中添加了 `asarUnpack` 配置：

```typescript
asarUnpack: [
  "**/node_modules/@mediago/core-*/**/*",
  "**/node_modules/@mediago/player-*/**/*",
  "**/node_modules/@mediago/deps-*/**/*",
],
```

**作用：**
- 确保所有平台的二进制文件从 ASAR 归档中解压
- 二进制文件需要在文件系统中可执行，不能留在 ASAR 归档内

### 4. 更新构建脚本

更新了 `apps/electron/package.json` 中的构建命令：

```json
{
  "scripts": {
    "install:binaries": "tsx scripts/install-all-binaries.ts",
    "pack": "pnpm run install:binaries && ...",
    "release": "pnpm run install:binaries && ..."
  }
}
```

**效果：**
- 在打包和发布前自动安装所有平台的二进制文件
- 确保最终产物包含所有必要的文件

## 构建流程

### 开发环境
```bash
# 正常开发，只安装当前平台的二进制文件
pnpm dev:electron
```

### 生产构建
```bash
# 构建测试包（不生成安装程序）
pnpm pack:electron

# 构建发布包（生成安装程序）
pnpm release:electron
```

构建流程会自动：
1. 运行 `install:binaries` 安装所有平台的二进制文件
2. 构建应用代码
3. 使用 Electron Builder 打包
4. 从 ASAR 解压所有平台的二进制文件

## 验证

构建完成后，你可以验证：

1. **检查包大小**
   - 包含所有平台二进制文件后，包体积会增加
   - 这是正常的，因为包含了 6 个平台的二进制文件

2. **测试不同平台**
   - 在 Windows x64 上构建的包应该能在 Windows ARM64 上运行
   - 应用会自动选择正确的二进制文件

3. **检查解压的文件**
   ```bash
   # 在应用安装后
   ls app.asar.unpacked/node_modules/@mediago/
   ```
   应该能看到所有平台的包：
   - core-win32-x64
   - core-win32-arm64
   - core-darwin-x64
   - ... 等等

## 注意事项

1. **包体积增加**
   - 包含所有平台的二进制文件会显著增加最终包的大小
   - 如果需要优化，可以考虑为每个平台单独构建

2. **版本更新**
   - 当 `@mediago/core`、`@mediago/player` 或 `@mediago/deps` 更新时
   - 需要更新 `scripts/install-all-binaries.ts` 中的版本号

3. **兼容性**
   - 解决方案向后兼容
   - 如果某个平台的二进制文件不存在，会回退到原有逻辑

## 故障排除

### 问题：构建后应用无法运行

**检查步骤：**
1. 确认 `install:binaries` 脚本已执行
2. 检查 `app/package.json` 是否包含所有平台的依赖
3. 验证 `app.asar.unpacked` 中是否有对应的二进制文件

### 问题：找不到二进制文件

**解决方法：**
```bash
# 清理并重新安装
pnpm clean
pnpm install
pnpm -F @mediago/electron run install:binaries
```

### 问题：版本不匹配

**解决方法：**
- 检查 `scripts/install-all-binaries.ts` 中的版本号
- 确保与 `package.json` 中的基础包版本一致

## 技术细节

### 为什么使用 optionalDependencies？

`optionalDependencies` 允许包在某些依赖项安装失败时继续安装。对于平台特定的二进制文件，这是理想的选择：
- 在 Windows 上安装时，macOS 和 Linux 的包会安装失败，但不会阻止整体安装
- 在 macOS 上安装时，Windows 和 Linux 的包会安装失败，但不会阻止整体安装

### 为什么需要 asarUnpack？

ASAR 是 Electron 的归档格式：
- 可以提高文件读取性能
- 但二进制可执行文件必须在文件系统中才能运行
- `asarUnpack` 确保特定文件在打包时被解压到 `app.asar.unpacked` 目录

### 运行时如何选择正确的二进制文件？

通过 Node.js 的 `process.platform` 和 `process.arch`：
- `process.platform`: 'win32', 'darwin', 'linux'
- `process.arch`: 'x64', 'arm64', 等
- 组合这两个值来构造平台特定的包名

## 贡献者

如果你需要添加新的平台支持或修改此解决方案，请更新：
1. `apps/electron/scripts/install-all-binaries.ts` - 添加新平台
2. `packages/shared/node/src/utils/index.ts` - 如有需要，更新逻辑
3. 本文档 - 说明新的变更
