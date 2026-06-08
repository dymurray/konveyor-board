import NodeCache from "node-cache";

export class AppCache {
  private cache: NodeCache;

  constructor(opts: { stdTTL: number }) {
    this.cache = new NodeCache({ stdTTL: opts.stdTTL, checkperiod: 30 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (ttl !== undefined) {
      if (ttl === 0) {
        // TTL of 0 means don't store it (immediately expired)
        return;
      }
      this.cache.set(key, value, ttl);
    } else {
      this.cache.set(key, value);
    }
  }

  invalidate(key: string): void {
    this.cache.del(key);
  }

  invalidateByPrefix(prefix: string): void {
    const keys = this.cache.keys().filter((k) => k.startsWith(prefix));
    this.cache.del(keys);
  }

  keys(): string[] {
    return this.cache.keys();
  }
}
