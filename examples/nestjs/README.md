# NestJS request limiting

From the root: `npm ci && npm run build`, then `npm start -w examples/nestjs`.
Direct execution binds 127.0.0.1:3000. [Compose](../../lab/README.md) provides the repeatable lab.

GET /api/status: 6 requests / 10 s by default; POST /auth/login: 2 / 10 s.
Compose sets a 2 s window. Nest returns 201 for a successful POST, 429 plus Retry-After
for excess requests. Throttler v6 counts per handler; its block interval begins at the
first excess request. Retry-After is the remaining block time, rounded to seconds.
Success responses include the throttler's X-RateLimit-Limit, Remaining and Reset headers
(Reset is seconds until the tracking window expires, not an epoch timestamp).

State is in memory per process, not shared among Nest replicas. Redis is a separate
Express scenario. Health probes bypass throttling. The login route performs no authentication.
RouteCostMiddleware is unregistered conceptual metadata and has no enforcement effect;
the implemented limits count requests, not weighted costs.

TRUSTED_PROXIES defaults empty/false. Only explicit comma-separated IPs/CIDRs are
accepted; do not enable trust for the whole Docker/private network. See [operations](../../docs/OPERATIONS.md).
Other settings: HOST, PORT, WINDOW_MS (100–60000), PUBLIC_LIMIT and LOGIN_LIMIT (1–1000).
Invalid settings fail startup. Tests: `npm test` at the root.
