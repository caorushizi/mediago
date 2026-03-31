import { provide } from "@inversifyjs/binding-decorators";
import type { AppStore } from "@mediago/shared-common";
import { injectable } from "inversify";

@injectable()
@provide()
export default class ServerConfigCache {
  private config = {} as AppStore;

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
    (this.config as unknown as Record<string, unknown>)[key] = value;
  }
}
