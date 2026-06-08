import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.github_token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function getToken(req: Request): string {
  return req.cookies.github_token as string;
}
