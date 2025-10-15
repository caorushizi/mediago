import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import path from "node:path";
import kill from "tree-kill";

/**
 * ServiceRunner 配置选项
 */
export interface ServiceRunnerOptions {
  /** 二进制文件名（例如："bin/mediago-core"，Windows 会自动添加 .exe） */
  binName: string;
  /** 二进制文件所在目录 */
  devDir: string;
  /** 服务端口号 */
  port: number;
  /** 监听地址（默认 127.0.0.1） */
  host?: string;
  /** 传递给子进程的命令行参数 */
  extraArgs?: string[];
  /** 传递给子进程的环境变量 */
  extraEnv?: Record<string, string | undefined>;
}

/**
 * ServiceRunner 状态
 */
export interface ServiceRunnerState {
  pid?: number;
  port: number;
  url: string;
  started: boolean;
}

/**
 * ServiceRunner 事件
 */
export interface ServiceRunnerEvents {
  exit: (code: number | null, signal: NodeJS.Signals | null) => void;
  error: (err: Error) => void;
  stdout: (chunk: Buffer) => void;
  stderr: (chunk: Buffer) => void;
}

/**
 * 服务进程管理器
 * 负责启动、停止和管理子进程服务
 */
export class ServiceRunner extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private state: ServiceRunnerState;
  private readonly binPath: string;
  private readonly host: string;
  private readonly port: number;
  private readonly args: string[];
  private readonly env: Record<string, string>;

  constructor(options: ServiceRunnerOptions) {
    super();

    // 解析二进制文件路径
    const binName = process.platform === "win32" ? `${options.binName}.exe` : options.binName;
    this.binPath = path.resolve(options.devDir, binName);

    // 初始化配置
    this.host = options.host ?? "127.0.0.1";
    this.port = options.port;
    this.args = options.extraArgs ?? [];
    this.env = {
      ...process.env,
      ...options.extraEnv,
    } as Record<string, string>;

    // 初始化状态
    this.state = {
      port: this.port,
      url: `http://${this.host}:${this.port}`,
      started: false,
    };
  }

  /**
   * 启动服务
   */
  async start(): Promise<ServiceRunnerState> {
    if (this.child) {
      return this.getState();
    }

    this.child = spawn(this.binPath, this.args, {
      env: this.env,
      stdio: "pipe",
      windowsHide: true,
    });

    this.state.pid = this.child.pid;
    this.state.started = true;

    // 监听标准输出
    this.child.stdout?.on("data", (data) => {
      this.emit("stdout", data);
    });

    // 监听错误输出
    this.child.stderr?.on("data", (data) => {
      this.emit("stderr", data);
    });

    // 监听进程退出
    this.child.on("exit", (code, signal) => {
      this.emit("exit", code, signal);
      this.child = null;
      this.state.started = false;
      this.state.pid = undefined;
    });

    // 监听进程错误
    this.child.on("error", (err) => {
      this.emit("error", err);
    });

    return this.getState();
  }

  /**
   * 停止服务（优雅关闭进程树）
   */
  async stop(): Promise<void> {
    if (!this.child?.pid) {
      return;
    }

    const pid = this.child.pid;
    return new Promise<void>((resolve) => {
      kill(pid, () => {
        this.child = null;
        this.state.started = false;
        this.state.pid = undefined;
        resolve();
      });
    });
  }

  /**
   * 获取当前状态
   */
  getState(): ServiceRunnerState {
    return { ...this.state };
  }

  /**
   * 获取服务 URL
   */
  getURL(): string {
    return this.state.url;
  }

  /**
   * 获取进程 PID
   */
  getPID(): number | undefined {
    return this.state.pid;
  }
}
