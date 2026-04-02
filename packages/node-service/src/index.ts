import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { networkInterfaces } from "node:os";
import path from "node:path";
import portfinder from "portfinder";
import kill from "tree-kill";
import { isPrivateIPv4, looksVirtual } from "./utils";

/**
 * ServiceRunner 配置选项
 */
export interface ServiceRunnerOptions {
  /** 可执行文件名（例如："bin/mediago-core"，Windows 会自动添加 .exe） */
  executableName: string;
  /** 可执行文件所在目录 */
  executableDir: string;
  /** 首选服务端口号（实际启动时会选择系统可用端口） */
  preferredPort?: number;
  /** 是否仅监听本机；false 时自动选择内网 IPv4，默认 true */
  internal?: boolean;
  /** 健康检查路径（默认 "/healthy"） */
  healthPath?: string;
  /** 等待健康检查通过的最长时间（毫秒，默认 15000） */
  healthCheckTimeoutMs?: number;
  /** 健康检查轮询间隔（毫秒，默认 500） */
  healthCheckIntervalMs?: number;
  /** 单次健康检查请求超时（毫秒，默认 2000） */
  healthRequestTimeoutMs?: number;
  /** 传递给子进程的命令行参数 */
  extraArgs?: string[];
  /** 传递给子进程的环境变量 */
  extraEnv?: Record<string, string | undefined>;
}

/**
 * ServiceRunner 重启时可更新的配置
 */
export interface ServiceRunnerRestartOptions {
  preferredPort?: number;
  internal?: boolean;
  healthPath?: string;
  healthCheckTimeoutMs?: number;
  healthCheckIntervalMs?: number;
  healthRequestTimeoutMs?: number;
  extraArgs?: string[];
  extraEnv?: Record<string, string | undefined>;
}

/**
 * ServiceRunner 状态
 */
export interface ServiceRunnerState {
  pid?: number;
  /** 当前监听地址 */
  host: string;
  /** 当前监听端口号（未启动时为 0） */
  port: number;
  url: string;
  started: boolean;
}

/**
 * ServiceRunner 事件
 */
export interface ServiceRunnerEvents {
  exit: [code: number | null, signal: NodeJS.Signals | null];
  error: [err: Error];
  stdout: [chunk: Buffer];
  stderr: [chunk: Buffer];
}

/**
 * 服务进程管理器
 * 负责启动、停止和管理子进程服务
 */
export class ServiceRunner extends EventEmitter<ServiceRunnerEvents> {
  private childProcess: ChildProcessWithoutNullStreams | null = null;
  private readonly runtimeState: ServiceRunnerState;
  private readonly binaryPath: string;
  private preferredPort?: number;
  private internalOnly: boolean;
  private spawnArguments: readonly string[];
  private baseEnvironment: Record<string, string>;
  private environmentOverrides: Record<string, string | undefined>;
  private healthPath: string;
  private healthCheckTimeoutMs: number;
  private healthCheckIntervalMs: number;
  private healthRequestTimeoutMs: number;
  private currentHost: string;

  constructor(options: ServiceRunnerOptions) {
    super();

    // 解析二进制文件路径
    const executableName =
      process.platform === "win32"
        ? `${options.executableName}.exe`
        : options.executableName;
    this.binaryPath = path.resolve(options.executableDir, executableName);

    // 初始化配置
    this.preferredPort = options.preferredPort;
    this.internalOnly = options.internal ?? true;
    this.spawnArguments = Object.freeze([...(options.extraArgs ?? [])]);
    this.environmentOverrides = { ...options.extraEnv };
    this.baseEnvironment = ServiceRunner.mergeEnvironmentVariables(
      this.environmentOverrides,
    );
    this.healthPath = options.healthPath ?? "/healthy";
    this.healthCheckTimeoutMs = options.healthCheckTimeoutMs ?? 15_000;
    this.healthCheckIntervalMs = options.healthCheckIntervalMs ?? 500;
    const requestTimeout = options.healthRequestTimeoutMs ?? 2_000;
    this.healthRequestTimeoutMs = Math.min(
      requestTimeout,
      this.healthCheckTimeoutMs,
    );
    this.currentHost = this.computeHost();

    // 初始化状态
    this.runtimeState = {
      host: this.currentHost,
      port: this.preferredPort ?? 0,
      url: ServiceRunner.buildURL(
        this.currentHost,
        this.preferredPort ?? Number.NaN,
      ),
      started: false,
    };
  }

  /**
   * 启动服务
   */
  async start(): Promise<ServiceRunnerState> {
    if (this.isRunning()) {
      return this.getState();
    }

    if (this.childProcess) {
      // 清理遗留的子进程句柄（例如异常退出后）
      this.resetRuntimeState(false);
    }

    await this.ensureBinaryAccessible();
    this.refreshBaseEnvironment();

    const host = this.computeHost();
    this.currentHost = host;
    const resolvedPort = await portfinder.getPortPromise(
      this.preferredPort !== undefined
        ? { port: this.preferredPort }
        : undefined,
    );
    const childEnv: Record<string, string> = {
      ...this.baseEnvironment,
      PORT: String(resolvedPort),
      HOST: host,
    };

    if (!Object.prototype.hasOwnProperty.call(childEnv, "HOST")) {
      childEnv.HOST = host;
    }

    try {
      const child = spawn(this.binaryPath, this.spawnArguments, {
        env: childEnv,
        stdio: "pipe",
        windowsHide: process.platform === "win32",
      }) as ChildProcessWithoutNullStreams;

      this.childProcess = child;
      this.runtimeState.pid = child.pid ?? undefined;
      this.runtimeState.started = false;
      this.runtimeState.host = host;
      this.runtimeState.port = resolvedPort;
      this.runtimeState.url = ServiceRunner.buildURL(host, resolvedPort);

      this.attachChildProcessListeners(child);
      await this.waitForHealthy(host, resolvedPort);
      this.runtimeState.started = true;
    } catch (error) {
      if (this.childProcess) {
        try {
          await this.stop();
        } catch {
          this.resetRuntimeState();
        }
      } else {
        this.resetRuntimeState();
      }

      throw error instanceof Error ? error : new Error(String(error));
    }

    return this.getState();
  }

  /**
   * 停止服务（优雅关闭进程树）
   */
  async stop(): Promise<void> {
    const child = this.childProcess;
    if (!child?.pid) {
      this.resetRuntimeState();
      return;
    }

    const pid = child.pid;

    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        child.removeListener("exit", handleExit);
      };

      const handleExit = () => {
        cleanup();
        resolve();
      };

      child.once("exit", handleExit);

      kill(pid, "SIGTERM", (killError) => {
        if (!killError) {
          return;
        }

        if ((killError as NodeJS.ErrnoException).code === "ESRCH") {
          cleanup();
          this.resetRuntimeState();
          resolve();
          return;
        }

        cleanup();
        reject(killError);
      });
    });
  }

  /**
   * 重启服务，可在重启前更新配置
   */
  async restart(
    updates?: ServiceRunnerRestartOptions,
  ): Promise<ServiceRunnerState> {
    if (updates) {
      this.applyConfigurationUpdates(updates);
    } else {
      this.refreshBaseEnvironment();
    }

    await this.stop();
    this.resetRuntimeState(false);
    return this.start();
  }

  /**
   * 获取当前状态
   */
  getState(): ServiceRunnerState {
    return { ...this.runtimeState };
  }

  /**
   * 获取服务 URL
   */
  getURL(): string {
    return this.runtimeState.url;
  }

  /**
   * 获取进程 PID
   */
  getPID(): number | undefined {
    return this.runtimeState.pid;
  }

  /**
   * 判断服务是否正在运行
   */
  isRunning(): boolean {
    return Boolean(this.runtimeState.pid) && this.runtimeState.started;
  }

  /**
   * 主动触发健康检查，判断服务当前是否存活
   */
  async checkHealth(): Promise<boolean> {
    if (
      !this.runtimeState.started ||
      !this.runtimeState.port ||
      this.runtimeState.port <= 0
    ) {
      return false;
    }

    try {
      await this.probeHealth(this.runtimeState.host, this.runtimeState.port);
      return true;
    } catch {
      return false;
    }
  }

  private applyConfigurationUpdates(
    updates: ServiceRunnerRestartOptions,
  ): void {
    if (updates.preferredPort !== undefined) {
      this.preferredPort = updates.preferredPort;
    }

    if (updates.internal !== undefined) {
      this.internalOnly = updates.internal;
    }

    if (updates.extraArgs !== undefined) {
      this.spawnArguments = Object.freeze([...updates.extraArgs]);
    }

    if (updates.extraEnv) {
      this.updateEnvironmentOverrides(updates.extraEnv);
    }

    if (updates.healthPath !== undefined) {
      this.healthPath = updates.healthPath;
    }

    if (updates.healthCheckTimeoutMs !== undefined) {
      this.healthCheckTimeoutMs = updates.healthCheckTimeoutMs;
    }

    if (updates.healthCheckIntervalMs !== undefined) {
      this.healthCheckIntervalMs = updates.healthCheckIntervalMs;
    }

    if (updates.healthRequestTimeoutMs !== undefined) {
      this.healthRequestTimeoutMs = updates.healthRequestTimeoutMs;
    }

    this.healthRequestTimeoutMs = Math.min(
      this.healthRequestTimeoutMs,
      this.healthCheckTimeoutMs,
    );
    this.refreshBaseEnvironment();
  }

  private updateEnvironmentOverrides(
    overrides: Record<string, string | undefined>,
  ): void {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete this.environmentOverrides[key];
      } else {
        this.environmentOverrides[key] = value;
      }
    }
  }

  private refreshBaseEnvironment(): void {
    this.baseEnvironment = ServiceRunner.mergeEnvironmentVariables(
      this.environmentOverrides,
    );
  }

  private computeHost(): string {
    if (this.internalOnly) {
      return "127.0.0.1";
    }

    return ServiceRunner.findLanIPv4Address() ?? "127.0.0.1";
  }

  private static mergeEnvironmentVariables(
    extraEnv?: Record<string, string | undefined>,
  ): Record<string, string> {
    const merged = { ...(process.env as Record<string, string>) };

    if (!extraEnv) {
      return merged;
    }

    for (const [key, value] of Object.entries(extraEnv)) {
      if (value === undefined) {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  private static findLanIPv4Address(): string | undefined {
    const ifaces = networkInterfaces();
    const result = [];

    for (const [name, infos] of Object.entries(ifaces)) {
      if (!infos) continue;

      for (const info of infos) {
        if (info.internal) continue;
        if (info.family !== "IPv4") continue;
        if (looksVirtual(name, info.mac)) continue;
        if (!isPrivateIPv4(info.address)) continue;
        result.push({ name, ...info });
      }
    }

    if (result.length > 0) {
      return result[0].address;
    }

    return undefined;
  }

  private static buildURL(host: string, port: number): string {
    if (Number.isFinite(port) && port > 0) {
      return `http://${host}:${port}`;
    }

    return `http://${host}`;
  }

  private async waitForHealthy(host: string, port: number): Promise<void> {
    const deadline = Date.now() + this.healthCheckTimeoutMs;
    let lastError: Error | undefined;

    while (Date.now() < deadline) {
      try {
        await this.probeHealth(host, port);
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!this.childProcess) {
          break;
        }
      }

      await ServiceRunner.delay(this.healthCheckIntervalMs);
    }

    const reason = lastError ? `: ${lastError.message}` : "";
    throw new Error(
      `Service failed health check (${this.healthPath}) within ${this.healthCheckTimeoutMs} ms${reason}`,
    );
  }

  private async probeHealth(host: string, port: number): Promise<void> {
    const healthURL = this.buildHealthURL(host, port);
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.healthRequestTimeoutMs,
    );

    try {
      const response = await fetch(healthURL, {
        signal: controller.signal,
        redirect: "manual",
      });

      if (!response.ok) {
        throw new Error(
          `Health endpoint responded with status ${response.status}`,
        );
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildHealthURL(host: string, port: number): URL {
    if (/^https?:\/\//i.test(this.healthPath)) {
      return new URL(this.healthPath);
    }

    const normalizedPath = this.healthPath.startsWith("/")
      ? this.healthPath
      : `/${this.healthPath}`;
    const baseHref = `${ServiceRunner.buildURL(host, port)}/`;

    return new URL(normalizedPath, baseHref);
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async ensureBinaryAccessible(): Promise<void> {
    try {
      await access(this.binaryPath, fsConstants.F_OK);
    } catch {
      throw new Error(
        `Executable not found or not accessible: ${this.binaryPath}`,
      );
    }
  }

  private attachChildProcessListeners(
    child: ChildProcessWithoutNullStreams,
  ): void {
    child.stdout.on("data", (chunk) => {
      this.emit("stdout", chunk);
    });

    child.stderr.on("data", (chunk) => {
      this.emit("stderr", chunk);
    });

    child.once("exit", (code, signal) => {
      this.resetRuntimeState();
      this.emit("exit", code, signal);
    });

    child.once("error", (error) => {
      this.emit("error", error);
    });
  }

  private resetRuntimeState(preserveBoundPort = true): void {
    this.childProcess = null;
    if (!preserveBoundPort) {
      this.currentHost = this.computeHost();
    }
    this.runtimeState.started = false;
    this.runtimeState.pid = undefined;
    this.runtimeState.host = this.currentHost;

    if (!preserveBoundPort) {
      this.runtimeState.port = this.preferredPort ?? 0;
    }

    this.runtimeState.url = ServiceRunner.buildURL(
      this.runtimeState.host,
      this.runtimeState.port,
    );
  }
}
