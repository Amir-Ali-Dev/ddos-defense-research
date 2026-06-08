# NestJS Rate Limiting Example

This example demonstrates API-side throttling with `@nestjs/throttler`.

Files:

- [package.json](package.json): minimal dependencies.
- [src/app.module.ts](src/app.module.ts): global throttler guard.
- [src/auth.controller.ts](src/auth.controller.ts): stricter login limit.
- [src/proxy-aware-throttler.guard.ts](src/proxy-aware-throttler.guard.ts):
  trusted-proxy-aware client tracking.

Notes:

- The in-memory throttler is acceptable for a small single-instance demo.
- For horizontally scaled services, store limiter state in Redis or another
  shared backend.
- Do not trust `X-Forwarded-For` unless requests come from your own reverse
  proxy, CDN, or load balancer.

