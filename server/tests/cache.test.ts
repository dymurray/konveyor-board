import { describe, it, expect, beforeEach } from "vitest";
import { AppCache } from "../src/cache.ts";

describe("AppCache", () => {
  let cache: AppCache;

  beforeEach(() => {
    cache = new AppCache({ stdTTL: 60 });
  });

  it("stores and retrieves a value", () => {
    cache.set("key1", { data: "hello" });
    expect(cache.get("key1")).toEqual({ data: "hello" });
  });

  it("returns undefined for missing keys", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("invalidates a key", () => {
    cache.set("key1", { data: "hello" });
    cache.invalidate("key1");
    expect(cache.get("key1")).toBeUndefined();
  });

  it("invalidates keys by prefix", () => {
    cache.set("project:67:items", [1, 2, 3]);
    cache.set("project:67:fields", ["a", "b"]);
    cache.set("repo:konveyor/hub:labels", ["bug"]);
    cache.invalidateByPrefix("project:67");
    expect(cache.get("project:67:items")).toBeUndefined();
    expect(cache.get("project:67:fields")).toBeUndefined();
    expect(cache.get("repo:konveyor/hub:labels")).toEqual(["bug"]);
  });

  it("respects custom TTL per key", () => {
    cache.set("short", "value", 0);
    expect(cache.get("short")).toBeUndefined();
  });
});
