# Redis shared fixed-window limiter

Use the [Redis Compose profile](../../lab/README.md). To run on the host with an existing
local Redis: from the root `npm ci`, then `npm start -w examples/redis`.
The host default is redis://127.0.0.1:6379 and HTTP 127.0.0.1:3001.

The [Lua script](fixed-window.lua) atomically increments and establishes a millisecond
TTL on the first request. It repairs persistent counters, validates integer arguments
and never extends expiry for denied requests. A Redis script is atomic on the Redis
server; it does not promise durability across restart/failover. Window boundaries can
permit bursts. The key hashes the canonical IP identity and includes a fixed route id;
query strings and unverified API keys never create new budgets.

Defaults: public 6, login 2, window 10000 ms. Compose uses 2000 ms.
REDIS_TIMEOUT_MS defaults 500 (range 50–5000) for connection and command deadlines.
Offline queuing is disabled and pending commands are capped at 128. A command timeout
destroys the connection and reconnects in the background; an ambiguous write is never
retried for the same HTTP request. It may already have consumed budget.

REDIS_FAILURE_POLICY=closed is the default: 503 + Retry-After: 1, not 429. The explicit
alternative open allows the request with X-RateLimit-Policy: fail-open and no budget
headers. Readiness stays 503 in both policies; healthz remains 200. Startup does not
wait indefinitely before listening: clients can see a controlled 503 until Redis is ready.
Use readiness to gate traffic; do not silently fail open for authentication routes.

For counted requests X-RateLimit-Limit/Remaining are request counts; X-RateLimit-Reset
is a Unix timestamp in seconds. 429 includes Retry-After=max(1,ceil(TTL/1000)). These
are documented custom diagnostics, not a standards-compliance claim. Responses use no-store.
The [NestJS example](../nestjs/README.md) uses different Reset semantics supplied by its library.

No real authentication is implemented. Apply user/key budgets only after verifying
credentials and retain an IP guard before authentication. Trust rules and IPv6 /64
aggregation: [operations](../../docs/OPERATIONS.md). Test commands and limits:
[root README](../../README.md#tests-and-validation).
