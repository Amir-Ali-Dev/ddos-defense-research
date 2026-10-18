// Same first-request-anchored fixed window and response contract as fixed-window.lua.
// Process-local by design. No timers: expired identities are swept on each request.
export function createMemoryLimiter({ now = Date.now, maxKeys = 4096 } = {}) {
  const entries = new Map();
  return {
    ready: true,
    async isAllowed({ identity, route, limit, windowMs }) {
      if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 1000 ||
        !Number.isSafeInteger(windowMs) ||
        windowMs < 1 ||
        windowMs > 60000
      ) {
        throw new Error("Invalid limiter arguments");
      }
      const time = now();
      for (const [key, value] of entries)
        if (value.expiresAt <= time) entries.delete(key);
      const key = JSON.stringify([route, identity]);
      let entry = entries.get(key);
      if (!entry) {
        if (entries.size >= maxKeys)
          throw new Error("Memory limiter identity capacity reached");
        entry = { count: 0, expiresAt: time + windowMs };
        entries.set(key, entry);
      }
      entry.count++;
      const ttlMs = Math.max(0, entry.expiresAt - time);
      return {
        allowed: entry.count <= limit,
        count: entry.count,
        ttlMs,
        retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
      };
    },
  };
}
