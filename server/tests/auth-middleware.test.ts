import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../src/auth/middleware.ts";

function mockReq(cookies: Record<string, string> = {}): Request {
  return { cookies } as unknown as Request;
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe("requireAuth", () => {
  it("calls next when github_token cookie exists", () => {
    const req = mockReq({ github_token: "gho_abc123" });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when no github_token cookie", () => {
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authenticated" });
  });
});
