import { nanoid } from "nanoid";

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
