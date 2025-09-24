export interface StoreOptions<T> {
  defaults: T;
}

export default class Store<T> {
  public readonly store: T;

  constructor(options: StoreOptions<T>) {
    this.store = options.defaults;
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.store[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    (this.store as Record<string, unknown>)[key as string] = value as unknown;
  }
}
