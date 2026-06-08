import { readFile } from 'node:fs/promises';
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

const script = await readFile(new URL('./fixed-window.lua', import.meta.url), 'utf8');

export async function isAllowed({ identity, route, limit = 60, windowMs = 60_000 }) {
  const safeRoute = route.replace(/[^a-zA-Z0-9:_-]/g, '_');
  const key = `rl:${safeRoute}:${identity}`;

  const result = await redis.eval(script, {
    keys: [key],
    arguments: [String(windowMs), String(limit)],
  });

  const [allowed, count, ttlMs] = result.map(Number);

  return {
    allowed: allowed === 1,
    count,
    ttlMs,
    retryAfterSeconds: allowed === 1 ? 0 : Math.ceil(ttlMs / 1000),
  };
}

export async function connectLimiter() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

