import express from "express";
import { pathToFileURL } from "node:url";
import { createLimiter } from "./node-redis-example.js";
import network from "../shared/network.cjs";
const { trustProxy, clientIdentity, integerEnv } = network;

export function createApp(
  limiter,
  {
    windowMs = 10000,
    publicLimit = 6,
    loginLimit = 2,
    failurePolicy = "closed",
    trustedProxies = "",
  } = {},
) {
  if (!["open", "closed"].includes(failurePolicy))
    throw new Error("REDIS_FAILURE_POLICY must be open or closed");
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", trustProxy(trustedProxies));
  app.get("/healthz", (_req, res) => res.json({ ok: true }));
  app.get("/readyz", (_req, res) =>
    res.status(limiter.ready ? 200 : 503).json({ ready: limiter.ready }),
  );
  const limit = (route, budget) => async (req, res, next) => {
    let identity;
    try {
      identity = clientIdentity(req);
    } catch {
      return res.status(400).json({ error: "invalid_client_address" });
    }
    res.set("Cache-Control", "no-store");
    let result;
    try {
      result = await limiter.isAllowed({
        identity,
        route,
        limit: budget,
        windowMs,
      });
    } catch {
      res.set("X-RateLimit-Policy", "fail-" + failurePolicy);
      if (failurePolicy === "open") return next();
      return res
        .status(503)
        .set("Retry-After", "1")
        .json({ error: "limiter_unavailable" });
    }
    // Custom diagnostic headers, not a claim of compliance with a draft standard.
    res.set("X-RateLimit-Limit", String(budget));
    res.set(
      "X-RateLimit-Remaining",
      String(Math.max(0, budget - result.count)),
    );
    res.set(
      "X-RateLimit-Reset",
      String(Math.ceil((Date.now() + result.ttlMs) / 1000)),
    );
    if (!result.allowed)
      return res
        .status(429)
        .set("Retry-After", String(result.retryAfterSeconds))
        .json({
          error: "too_many_requests",
          retryAfterSeconds: result.retryAfterSeconds,
        });
    next();
  };
  app.get("/api/status", limit("status", publicLimit), (_req, res) =>
    res.json({ ok: true, service: "redis-limiter" }),
  );
  app.post("/auth/login", limit("login", loginLimit), (_req, res) =>
    res.json({ ok: true, note: "No authentication is performed" }),
  );
  return app;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const limiter = createLimiter({
    url: process.env.REDIS_URL,
    timeoutMs: integerEnv("REDIS_TIMEOUT_MS", 500, 50, 5000),
    prefix: process.env.LIMITER_PREFIX ?? "rl:v1",
  });
  const app = createApp(limiter, {
    windowMs: integerEnv("WINDOW_MS", 10000, 100, 60000),
    publicLimit: integerEnv("PUBLIC_LIMIT", 6, 1, 1000),
    loginLimit: integerEnv("LOGIN_LIMIT", 2, 1, 1000),
    failurePolicy: process.env.REDIS_FAILURE_POLICY ?? "closed",
    trustedProxies: process.env.TRUSTED_PROXIES,
  });
  limiter.start();
  const server = app.listen(
    integerEnv("PORT", 3001, 1, 65535),
    process.env.HOST ?? "127.0.0.1",
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      limiter.close();
      server.close();
    });
}
