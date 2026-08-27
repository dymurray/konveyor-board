// Two-tier cache: an in-memory Map for the hot path, backed by localStorage so
// a page reload starts from the last-known data instead of re-fetching
// everything before the UI can render. getCached returns only fresh entries;
// getStale returns the last value even when expired, for stale-while-revalidate.

interface Entry<T> {
  data: T;
  expires: number;
}

const mem = new Map<string, Entry<unknown>>();
const PERSIST_PREFIX = "cache:";
let warnedPersistFailure = false;

function persistKey(key: string): string {
  return PERSIST_PREFIX + key;
}

function readEntry<T>(key: string): Entry<T> | undefined {
  const hot = mem.get(key) as Entry<T> | undefined;
  if (hot) return hot;
  try {
    const raw = localStorage.getItem(persistKey(key));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as Entry<T>;
    mem.set(key, entry); // warm the hot tier so we JSON.parse at most once
    return entry;
  } catch {
    return undefined;
  }
}

export function getCached<T>(key: string): T | undefined {
  const entry = readEntry<T>(key);
  if (!entry || Date.now() > entry.expires) return undefined;
  return entry.data;
}

// Last known value regardless of expiry - for rendering instantly on load while
// a fresh fetch runs in the background.
export function getStale<T>(key: string): T | undefined {
  return readEntry<T>(key)?.data;
}

export function setCache(key: string, data: unknown, ttlMs: number): void {
  const entry: Entry<unknown> = { data, expires: Date.now() + ttlMs };
  mem.set(key, entry);
  try {
    localStorage.setItem(persistKey(key), JSON.stringify(entry));
  } catch {
    // Quota exceeded or unserialisable - the in-memory tier still works, but
    // instant-render-on-reload is now disabled, so say so once.
    if (!warnedPersistFailure) {
      warnedPersistFailure = true;
      console.warn("[cache] localStorage write failed (quota?); the board will re-fetch on reload instead of rendering instantly");
    }
  }
}

export function invalidateCache(prefix: string): void {
  for (const key of [...mem.keys()]) {
    if (key.startsWith(prefix)) mem.delete(key);
  }
  try {
    const persistPrefix = persistKey(prefix);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(persistPrefix)) localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable - in-memory eviction above is enough.
  }
}
