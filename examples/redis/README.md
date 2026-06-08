# Redis-Based Rate Limiter

Use Redis when multiple application instances need shared limiter state.

Files:

- [fixed-window.lua](fixed-window.lua): atomic fixed-window limiter.
- [node-redis-example.js](node-redis-example.js): application-side usage with
  `node-redis`.

Pattern:

1. Build a key from a trusted identity: user id, API key, route, or IP.
2. Increment the key atomically.
3. Set a short expiry for the window.
4. Reject or challenge only when the counter exceeds the allowed limit.

For production systems, consider sliding-window or token-bucket algorithms when
you need smoother behavior than a fixed window.

