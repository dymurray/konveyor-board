const store = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
