# Core Package 目录结构

本目录包含 MediaGo 的核心下载功能实现。

## 目录结构

```
internal/core/
├── types.go              # 核心类型定义 (Runner, Downloader 接口等)
├── downloader.go         # 下载器服务实现
├── queue.go              # 任务队列管理
│
├── runner/               # 命令执行器模块
│   ├── exec.go           # 基础命令执行器 (ExecRunner)
│   ├── pty.go            # PTY 执行器 (支持进度条)
│   ├── pty_windows.go    # Windows ConPTY 实现
│   └── pty_unix.go       # Unix/Linux/Mac PTY 实现
│
├── parser/               # 输出解析模块
│   ├── parser.go         # 控制台输出解析器
│   └── tracker.go        # 进度节流追踪器
│
└── schema/               # 配置模块
    └── loader.go         # Schema 配置加载器
```

## 模块说明

### Runner 模块 (`runner/`)

命令执行器,负责启动下载程序并捕获输出。

- **ExecRunner**: 基础执行器,使用标准管道
- **PTYRunner**: 伪终端执行器,支持捕获进度条(使用 `\r` 更新)

**使用示例**:
```go
import "caorushizi.cn/mediago/internal/core/runner"

// 创建 PTY runner (推荐,支持进度条)
r := runner.NewPTYRunner()

// 或使用基础 runner
r := runner.NewExecRunner()
```

### Parser 模块 (`parser/`)

解析下载程序的控制台输出,提取进度信息。

- **LineParser**: 使用正则表达式解析输出行
- **ProgressTracker**: 进度节流,避免过于频繁的更新

**使用示例**:
```go
import (
    "caorushizi.cn/mediago/internal/core/parser"
    "caorushizi.cn/mediago/internal/core/schema"
)

// 创建解析器
lp, err := parser.NewLineParser(consoleReg)

// 解析一行输出
state := &parser.ParseState{}
event, errMsg := lp.Parse(line, state)
```

### Schema 模块 (`schema/`)

从 JSON 文件加载下载器配置。

**使用示例**:
```go
import "caorushizi.cn/mediago/internal/core/schema"

// 加载配置
schemas, err := schema.LoadSchemasFromJSON("configs/config.json")

// 获取特定类型的配置
s, ok := schemas.GetByType("m3u8")
```

### 核心服务

- **DownloaderSvc** (`downloader.go`): 下载器服务,协调各模块完成下载
- **TaskQueue** (`queue.go`): 任务队列,管理并发下载

## 依赖关系

```
cmd/server/main.go
    ↓
core.DownloaderSvc
    ↓
├── runner.PTYRunner     (执行命令)
├── parser.LineParser    (解析输出)
├── parser.ProgressTracker (节流进度)
└── schema.SchemaList    (配置)
```

## 重要变更

### 从旧结构迁移

如果你有代码引用了旧的类型,请按以下方式更新:

| 旧引用 | 新引用 |
|--------|--------|
| `core.NewExecRunner()` | `runner.NewExecRunner()` |
| `core.NewPTYRunner()` | `runner.NewPTYRunner()` |
| `core.newLineParser()` | `parser.NewLineParser()` |
| `core.parseState` | `parser.ParseState` |
| `core.LoadSchemasFromJSON()` | `schema.LoadSchemasFromJSON()` |
| `core.SchemaList` | `schema.SchemaList` |

### 导入示例

```go
import (
    "caorushizi.cn/mediago/internal/core"
    "caorushizi.cn/mediago/internal/core/runner"
    "caorushizi.cn/mediago/internal/core/parser"
    "caorushizi.cn/mediago/internal/core/schema"
)
```

## 设计原则

1. **职责分离**: 每个子模块专注于单一职责
2. **易于测试**: 模块边界清晰,便于单元测试
3. **便于扩展**: 添加新的 runner 或 parser 更容易
4. **符合 Go 惯例**: 包结构符合 Go 项目最佳实践
