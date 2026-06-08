import express from 'express';
import { connectLimiter, isAllowed } from './node-redis-example.js';

await connectLimiter();

const app = express();

function getIdentity(req) {
  return req.get('x-api-key') || req.ip || 'anonymous';
}

function defensiveLimiter({ route, limit, windowMs }) {
  return async (req, res, next) => {
    const result = await isAllowed({
      identity: getIdentity(req),
      route,
      limit,
      windowMs,
    });

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(limit - result.count, 0)));

    if (!result.allowed) {
      res.setHeader('Retry-After', String(result.retryAfterSeconds));
      return res.status(429).json({
        error: 'too_many_requests',
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    return next();
  };
}

app.get('/api/status', defensiveLimiter({ route: 'status', limit: 60, windowMs: 60_000 }), (_req, res) => {
  res.json({ ok: true, service: 'redis-rate-limiter-demo' });
});

app.post('/auth/login', defensiveLimiter({ route: 'login', limit: 5, windowMs: 60_000 }), (_req, res) => {
  res.json({ ok: true, note: 'placeholder login route' });
});

app.listen(3001, () => {
  console.log('Redis rate limiter demo listening on http://localhost:3001');
});
