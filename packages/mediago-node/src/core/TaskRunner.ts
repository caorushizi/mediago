import EventEmitter from "events";
import { Task } from "./Task";
import { throttle } from "lodash";

interface TaskOptions {
  limit?: number;
  debug?: boolean;
}

type RunnerStatus = "initial" | "running" | "suspended" | "terminated";

export class TaskRunner extends EventEmitter {
  // 下载状态
  private status: RunnerStatus = "initial";

  // 暂停时的队列
  private staging: Task[] = [];

  // 全部的任务列表
  private queue: Task[] = [];

  // 当前正在处理的任务
  private active: Task[] = [];

  // 最大处理的任务数
  private readonly limit: number;

  private readonly debug: boolean;

  private runTaskThrottle;

  constructor(options?: TaskOptions) {
    super();

    const { limit = 5, debug = false } = options || {};
    this.limit = limit;
    this.debug = debug;
    this.runTaskThrottle = throttle(this.runTask, 200);
  }

  pauseTask(): void {
    if (this.status === "running") {
      this.staging = this.queue.slice();
      this.queue = [];
      this.status = "suspended";
    }
  }

  resumeTask(): void {
    if (this.status === "suspended") {
      this.queue = this.staging;
      this.staging = [];
      this.runTaskThrottle();
    }
  }

  stopTask(): void {
    if (this.status === "running") {
      this.queue = [];
      this.status = "terminated";
    }
  }

  public addTask(task: Task, immediate?: boolean): void {
    this.queue.push(task);
    if (immediate) {
      this.status = "running";
      this.runTaskThrottle();
    }
  }

  public run(): void {
    this.status = "running";
    this.runTaskThrottle();
  }

  private async execute(task: Task) {
    try {
      await task.runner();
      // 任务执行成功
      this.log(
        `执行 ${task.id} 任务成功，目前队列中有 ${
          this.queue.length + this.active.length - 1
        } 条任务。`
      );
    } catch (err) {
      // 任务执行失败
      task.status = "retry";
      task.retryCount += 1;
      task.lastFailedTime = Date.now();
      if (this.status === "running") {
        this.queue.push(task);
      } else if (this.status === "suspended") {
        this.staging.push(task);
      }
      this.log(`开始执行 ${task.id} 执行失败，失败 ${task.retryCount} 次。`);
      this.log("错误信息是：", (err as any).message);
    } finally {
      // 处理当前正在活动的任务
      const doneId = this.active.findIndex((i) => i.id === task.id);
      this.active.splice(doneId, 1);
      // 处理完成的任务
      this.runTaskThrottle();
      // 传输完成
      if (this.queue.length === 0 && this.active.length === 0) {
        this.emit("done");
      }
    }
  }

  private runTask() {
    if (this.status === "suspended" || this.status === "terminated") {
      return;
    }

    while (this.active.length < this.limit && this.queue.length > 0) {
      const task = this.queue.shift();
      // 如果任务队列中没有任务，进行下一次循环
      if (!task) continue;

      if (task.status === "pending") {
        // 如果任务是 pending 状态直接执行任务
        this.active.push(task);
        this.execute(task);
      } else if (task.status === "retry" && task.lastFailedTime) {
        // 如果当前的任务是已经失败过
        // 1. 判断重试的次数是不是大于15次
        // 2. 判断当前执行的时间是否超过5s
        if (task.lastFailedTime - Date.now() / 1000 <= 5) {
          // fixme: 失败后重试
          this.queue.push(task);
        } else if (task.retryCount < 15) {
          this.active.push(task);
          this.execute(task);
        }
      }
    }
  }

  private log(...args: unknown[]) {
    if (this.debug) {
      console.log(...args);
    }
  }
}
