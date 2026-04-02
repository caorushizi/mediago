import { provide } from "@inversifyjs/binding-decorators";
import type { AppStore } from "@mediago/shared-common";
import { injectable } from "inversify";

type Listener = (newVal: unknown, oldVal: unknown) => void;

@injectable()
@provide()
export default class GoConfigCache {
  private config = {} as AppStore;
  private listeners = new Map<string, Set<Listener>>();

  seed(config: AppStore): void {
    this.config = { ...config };
  }

  get<K extends keyof AppStore>(key: K): AppStore[K] {
    return this.config[key];
  }

  get store(): AppStore {
    return this.config;
  }

  update(key: string, value: unknown): void {
    const oldVal = (this.config as unknown as Record<string, unknown>)[key];
    (this.config as unknown as Record<string, unknown>)[key] = value;

    const fns = this.listeners.get(key);
    if (fns) {
      for (const fn of fns) {
        fn(value, oldVal);
      }
    }
  }

  onDidChange(key: string, fn: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(fn);
    return () => {
      this.listeners.get(key)?.delete(fn);
    };
  }
}
