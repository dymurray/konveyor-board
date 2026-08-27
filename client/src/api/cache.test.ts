import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCached, getStale, setCache, invalidateCache } from "./cache";

// Minimal localStorage for the node test env.
class MemStorage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).localStorage = new MemStorage();
});

afterEach(() => {
  invalidateCache(""); // empty the module-level in-memory tier between tests
});

describe("cache", () => {
  it("returns fresh entries from getCached", () => {
    setCache("project:fresh", { a: 1 }, 10_000);
    expect(getCached("project:fresh")).toEqual({ a: 1 });
  });

  it("expires from getCached but getStale keeps the value", () => {
    setCache("project:stale", { a: 2 }, -1);
    expect(getCached("project:stale")).toBeUndefined();
    expect(getStale("project:stale")).toEqual({ a: 2 });
  });

  it("persists to localStorage under a cache: prefix", () => {
    setCache("project:persist", { a: 3 }, 10_000);
    expect(localStorage.getItem("cache:project:persist")).toContain('"a":3');
  });

  it("invalidateCache clears matching keys from both tiers, leaves others", () => {
    setCache("project:gone", { a: 1 }, 10_000);
    setCache("other:kept", { b: 2 }, 10_000);
    invalidateCache("project:");
    expect(getCached("project:gone")).toBeUndefined();
    expect(localStorage.getItem("cache:project:gone")).toBeNull();
    expect(getCached("other:kept")).toEqual({ b: 2 });
  });
});
