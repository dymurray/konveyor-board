import { describe, it, expect } from "vitest";
import { normaliseProxyUrl } from "./token";

describe("normaliseProxyUrl", () => {
  it("adds https:// to a bare host", () => {
    expect(normaliseProxyUrl("my-proxy.workers.dev")).toBe("https://my-proxy.workers.dev");
  });

  it("strips a trailing slash and lowercases the host", () => {
    expect(normaliseProxyUrl("HTTPS://Proxy.Example.com/x/")).toBe("https://proxy.example.com/x");
  });

  it("keeps an explicit scheme and port", () => {
    expect(normaliseProxyUrl("https://192.168.1.5:8787")).toBe("https://192.168.1.5:8787");
  });

  it("allows localhost over http", () => {
    expect(normaliseProxyUrl("localhost:8787")).toBe("http://localhost:8787");
    expect(normaliseProxyUrl("http://localhost:8787")).toBe("http://localhost:8787");
  });

  it("rejects a value that is not a hostname", () => {
    expect(normaliseProxyUrl("not a url")).toBeNull();
    expect(normaliseProxyUrl("")).toBeNull();
    expect(normaliseProxyUrl("nodots")).toBeNull();
  });
});
