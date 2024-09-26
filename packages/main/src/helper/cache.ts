import { LRUCache } from "lru-cache";

const options: LRUCache.OptionsMaxLimit<string, boolean, unknown> = {
  max: 5000,

  // how long to live in ms
  ttl: 1000 * 60 * 5,
};

export const urlCache = new LRUCache(options);
