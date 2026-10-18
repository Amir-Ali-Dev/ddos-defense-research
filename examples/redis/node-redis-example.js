import { readFile } from "node:fs/promises";
import { createClient } from "redis";
import { createHash } from "node:crypto";
const script = await readFile(
  new URL("./fixed-window.lua", import.meta.url),
  "utf8",
);

export function createLimiter({
  url = "redis://127.0.0.1:6379",
  timeoutMs = 500,
  prefix = "rl:v1",
} = {}) {
  const client = createClient({
    url,
    disableOfflineQueue: true,
    commandsQueueMaxLength: 128,
    socket: {
      connectTimeout: timeoutMs,
      reconnectStrategy: (retries) => Math.min(100 * (retries + 1), 1000),
    },
  });
  client.on("error", () => {}); // Readiness + HTTP error path report dependency state; no credentials in logs.
  let connecting;
  const start = () => {
    if (!connecting)
      connecting = client
        .connect()
        .catch(() => {})
        .finally(() => {
          connecting = undefined;
        });
  };
  const close = () => {
    if (client.isOpen) client.destroy();
  };

  async function isAllowed({ identity, route, limit, windowMs }) {
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      !Number.isSafeInteger(windowMs) ||
      windowMs < 1
    )
      throw new Error("Invalid limiter arguments");
    if (!client.isReady) throw new Error("Redis unavailable");
    const hash = createHash("sha256").update(identity).digest("hex");
    const key = prefix + ":" + route + ":" + hash;
    let timer;
    try {
      const result = await Promise.race([
        client.eval(script, {
          keys: [key],
          arguments: [String(windowMs), String(limit)],
        }),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Redis command timed out")),
            timeoutMs,
          );
        }),
      ]);
      if (!Array.isArray(result) || result.length !== 3)
        throw new Error("Invalid Redis response");
      const [allowed, count, ttlMs] = result.map(Number);
      if (
        ![0, 1].includes(allowed) ||
        !Number.isSafeInteger(count) ||
        count < 1 ||
        !Number.isSafeInteger(ttlMs) ||
        ttlMs < 0
      )
        throw new Error("Invalid limiter state");
      return {
        allowed: allowed === 1,
        count,
        ttlMs,
        retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
      };
    } catch (error) {
      // A timed-out write might have committed. Never retry it for this request.
      // Destroying the socket drops queued work; reconnect in the background.
      close();
      start();
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    start,
    close,
    isAllowed,
    get ready() {
      return client.isReady;
    },
    client,
  };
}
