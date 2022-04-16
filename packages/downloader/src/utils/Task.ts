import EventEmitter from "events";
import { nanoid } from "nanoid";

async function sleep(duration = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export class Task {
  id: string;
  timestamp: number;
  status: "pending" | "retry" = "pending";
  retryCount = 0;
  lastFailedTime?: number;
  runner: () => Promise<void>;

  constructor(runner: () => Promise<void>) {
    this.id = nanoid();
    this.timestamp = Date.now();
    this.runner = runner;
  }
}

interface TaskOptions {
  limit?: number;
  debug?: boolean;
}

export class TaskRunner extends EventEmitter {
  // 全部的任务列表
  private queue: Task[] = [];

  // 当前正在处理的任务
  private active: Task[] = [];

  // 最大处理的任务数
  private readonly limit: number;

  private readonly debug: boolean;

  constructor(options?: TaskOptions) {
    super();

    const { limit = 5, debug = false } = options || {};
    this.limit = limit;
    this.debug = debug;
  }

  public addTask(task: Task, immediate?: boolean): void {
    this.queue.push(task);
    if (immediate) {
      this.runTask();
    }
  }

  public run(): void {
    this.runTask();
  }

  private async execute(task: Task) {
    try {
      await task.runner();
      // 任务执行成功
      this.log(
        `执行 ${task.id} 任务成功，目前队列中有 ${this.queue.length} 条任务。`
      );
    } catch (err) {
      // 任务执行失败
      task.status = "retry";
      task.retryCount += 1;
      task.lastFailedTime = Date.now();
      this.queue.push(task);
      this.log(`开始执行 ${task.id} 执行失败，失败 ${task.retryCount} 次。`);
    } finally {
      // 处理当前正在活动的任务
      const doneId = this.active.findIndex((i) => i.id === task.id);
      this.active.splice(doneId, 1);
      // 处理完成的任务
      this.runTask();
      // 传输完成
      if (this.queue.length === 0 && this.active.length === 0) {
        this.emit("done");
      }
    }
  }

  private async runTask() {
    while (this.active.length < this.limit && this.queue.length > 0) {
      const task = this.queue.shift();
      // 如果任务队列中没有任务，进行下一次循环
      if (!task) continue;

      if (task.status === "pending") {
        // 如果任务是 pending 状态直接执行任务
        this.active.push(task);
        this.execute(task);
      }

      if (task.status === "retry" && task.lastFailedTime) {
        // 如果当前的任务是已经失败过
        // 1. 判断重试的次数是不是大于15次
        // 2. 判断当前执行的时间是否超过5s
        if (task.lastFailedTime - Date.now() / 1000 <= 5) {
          this.queue.push(task);
          await sleep(3000);
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
