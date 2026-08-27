import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

class MemStorage {
  private store = new Map<string, string>();
  get length() { return this.store.size; }
  key(i: number) { return [...this.store.keys()][i] ?? null; }
  getItem(k: string) { return this.store.get(k) ?? null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

function projectResponse() {
  return {
    data: {
      organization: {
        projectV2: {
          id: "P1",
          title: "Board",
          fields: { nodes: [] },
          items: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] },
        },
      },
    },
  };
}

beforeEach(() => {
  vi.resetModules(); // fresh cache mem + inflight map per test, not shared state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).localStorage = new MemStorage();
  localStorage.setItem("github_pat", "test-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchProject", () => {
  it("collapses concurrent callers into a single request, then serves cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => projectResponse(), text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchProject } = await import("./github-graphql");

    // getItems + getColumns fire concurrently on mount.
    const [a, b] = await Promise.all([fetchProject("org", 4242), fetchProject("org", 4242)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);

    // A later call within TTL hits the cache, no new request.
    await fetchProject("org", 4242);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getPersistedProject returns the last result even after it goes stale", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => projectResponse(), text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchProject, getPersistedProject } = await import("./github-graphql");

    await fetchProject("org", 7777);
    const persisted = getPersistedProject("org", 7777);
    expect(persisted?.projectNodeId).toBe("P1");
  });
});
