import { Router } from "express";
import { env, dashboardConfig } from "../config.ts";
import { getToken } from "./middleware.ts";

export const authRouter = Router();

authRouter.get("/github", (_req, res) => {
  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: dashboardConfig.oauth.callbackUrl,
    scope: "repo project read:org",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

authRouter.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ error: "Missing code parameter" });
    return;
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };

  if (!tokenData.access_token) {
    res.status(401).json({ error: tokenData.error ?? "Failed to get token" });
    return;
  }

  res.cookie("github_token", tokenData.access_token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.redirect("/");
});

authRouter.get("/me", async (req, res) => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}` },
  });

  if (!userRes.ok) {
    res.status(401).json({ error: "Token invalid" });
    return;
  }

  const user = (await userRes.json()) as { login: string; avatar_url: string; name: string };
  res.json({ login: user.login, avatarUrl: user.avatar_url, name: user.name });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("github_token");
  res.json({ ok: true });
});
