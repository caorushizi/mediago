import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import path from "node:path";
import kill from "tree-kill";
import waitOn from "wait-on";

export type ResolveBinaryFn = (
  ctx: {
    isDev: boolean;
    resourcesPath: string;
    platform: NodeJS.Platform;
    arch: string;
  },
  binName?: string,
  devDir?: string,
  prodRel?: string,
) => string;

export interface ServiceRunnerOptions {
  /** 二进制的基础文件名（自动拼 .exe）或你自己写 resolveBinary */
  binName?: string;
  /** 开发态二进制所在目录（与 binName 组合） */
  devDir?: string;
  /** 生产态 resourcesPath 下的相对路径（默认放根目录） */
  prodRel?: string;
  /** 自定义二进制路径解析（优先级最高） */
  resolveBinary?: ResolveBinaryFn;

  /** 初始端口 */
  port?: number;
  /** 健康检查路径（会拼到 http://host:port/healthz ） */
  healthPath?: string;
  /** 监听 host（默认 127.0.0.1） */
  host?: string;
  /** 健康检查超时（ms），默认 15000 */
  healthTimeoutMs?: number;

  /** 传给子进程的额外环境变量 */
  extraEnv?: Record<string, string | undefined>;
  /** 追加给子进程的 argv（极少用，Gin 通常不需要） */
  extraArgs?: string[];
  /** 是否把 stdout/stderr 打印到主进程控制台 */
  pipeOutput?: boolean;

  /** 是否自动生成并注入 APP_TOKEN（推荐 true） */
  injectToken?: boolean;
  /** 是否注入 PORT 环境变量（推荐 true） */
  injectPort?: boolean;
  /** 健康检查之前是否等待固定延迟（ms），可掩护慢启动日志 */
  preHealthDelayMs?: number;

  /** 判定是否是开发态（默认根据 ELECTRON_IS_DEV 或 NODE_ENV） */
  isDev?: boolean;
  /** Electron 的 resourcesPath（生产态必传；开发态可忽略） */
  resourcesPath?: string;
}

export interface ServiceRunnerState {
  pid?: number;
  port?: number;
  token?: string;
  url?: string; // http://host:port
  started?: boolean;
  ready?: boolean;
}

export interface ServiceRunnerEvents {
  ready: (state: ServiceRunnerState) => void;
  exit: (code: number | null, signal: NodeJS.Signals | null) => void;
  error: (err: Error) => void;
  stdout: (chunk: Buffer) => void;
  stderr: (chunk: Buffer) => void;
}

export class ServiceRunner extends EventEmitter {
  private opts: Required<ServiceRunnerOptions>;
  private child: ChildProcessWithoutNullStreams | null = null;
  private state: ServiceRunnerState = {};

  constructor(options: ServiceRunnerOptions) {
    super();
    const isDev = options.isDev ?? (process.env.ELECTRON_IS_DEV === "1" || process.env.NODE_ENV === "development");

    this.opts = {
      binName: options.binName ?? "gin-server",
      devDir: options.devDir ?? path.resolve(process.cwd(), "backend", "dist"),
      prodRel: options.prodRel ?? ".", // 放在 resources 根
      resolveBinary: options.resolveBinary ?? defaultResolveBinary,
      port: options.port ?? 3789,
      healthPath: options.healthPath ?? "/healthz",
      host: options.host ?? "127.0.0.1",
      healthTimeoutMs: options.healthTimeoutMs ?? 15000,
      extraEnv: options.extraEnv ?? {},
      extraArgs: options.extraArgs ?? [],
      pipeOutput: options.pipeOutput ?? true,
      injectToken: options.injectToken ?? true,
      injectPort: options.injectPort ?? true,
      preHealthDelayMs: options.preHealthDelayMs ?? 0,
      isDev,
      resourcesPath: options.resourcesPath ?? (process as any).resourcesPath ?? process.cwd(),
    };
  }

  /** 启动并等待健康检查通过 */
  async start(): Promise<ServiceRunnerState> {
    if (this.child) return this.getState();

    const token = this.opts.injectToken ? randomBytes(24).toString("hex") : undefined;

    const bin = this.opts.resolveBinary(
      {
        isDev: this.opts.isDev,
        resourcesPath: this.opts.resourcesPath,
        platform: process.platform,
        arch: process.arch,
      },
      this.opts.binName,
      this.opts.devDir,
      this.opts.prodRel,
    );

    const env: Record<string, string> = {
      ...process.env,
      ...this.opts.extraEnv,
    } as any;

    if (token) env.APP_TOKEN = token;

    const args = this.opts.extraArgs;

    this.child = spawn(bin, args, {
      env,
      stdio: "pipe",
      windowsHide: true,
    });

    const port = this.opts.port ?? 3378;
    this.state = {
      pid: this.child.pid ?? undefined,
      port,
      token,
      url: `http://${this.opts.host}:${port}`,
      started: true,
      ready: false,
    };

    if (this.opts.pipeOutput && this.child.stdout) {
      this.child.stdout.on("data", (d) => {
        this.emit("stdout", d);
      });
    } else if (this.child.stdout) {
      this.child.stdout.on("data", (d) => this.emit("stdout", d));
    }

    if (this.child.stderr) {
      this.child.stderr.on("data", (d) => {
        this.emit("stderr", d);
      });
    }

    this.child.on("exit", (code, signal) => {
      this.emit("exit", code, signal);
      this.child = null;
      this.state.ready = false;
      this.state.started = false;
    });

    this.child.on("error", (err) => {
      this.emit("error", err);
    });

    if (this.opts.preHealthDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.opts.preHealthDelayMs));
    }

    // 健康检查
    await waitOn({
      resources: [`${this.state.url}${this.opts.healthPath}`],
      timeout: this.opts.healthTimeoutMs,
      interval: 200,
      tcpTimeout: 2000,
      window: 100,
      headers: token ? { "X-App-Token": token } : undefined,
    });

    this.state.ready = true;
    this.emit("ready", this.getState());
    return this.getState();
  }

  /** 优雅关闭（kill 进程树） */
  async stop(): Promise<void> {
    if (!this.child || !this.child.pid) return;
    const pid = this.child.pid;
    await new Promise<void>((resolve) => {
      kill(pid, () => resolve());
    });
    this.child = null;
    this.state.ready = false;
    this.state.started = false;
  }

  /** 获取当前状态（浅拷贝） */
  getState(): ServiceRunnerState {
    return { ...this.state };
  }

  /** http://host:port */
  getURL(): string | undefined {
    return this.state.url;
  }

  /** token（用于前端 Header） */
  getToken(): string | undefined {
    return this.state.token;
  }

  /** 进程 pid */
  getPID(): number | undefined {
    return this.state.pid;
  }
}

/** 默认二进制解析逻辑 */
const defaultResolveBinary: ResolveBinaryFn = (
  ctx: { isDev: boolean; resourcesPath: string; platform: NodeJS.Platform; arch: string },
  binName?: string,
  devDir?: string,
  prodRel?: string,
) => {
  const name = ctx.platform === "win32" ? `${binName}.exe` : String(binName);
  if (ctx.isDev) {
    return path.resolve(devDir!, name);
  }
  return path.join(ctx.resourcesPath, prodRel!, name);
};
