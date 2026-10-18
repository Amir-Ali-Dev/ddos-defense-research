# Proxy trust, failure handling and incident runbook

## Trust boundary

By default Express trust proxy=false. The identity is req.ip derived from the TCP peer.
cf-connecting-ip and x-real-ip are never read by the application. XFF affects req.ip only
when the socket peer matches TRUSTED_PROXIES. Express walks from the socket right-to-left,
stopping at the nearest untrusted address. Never use the leftmost header blindly,
trust=true, a fixed hop count on variable paths, or all private networks.

For an actual dedicated proxy at 10.20.0.5, set TRUSTED_PROXIES=10.20.0.5/32. For a known
chain, list each proxy's exact IP/CIDR. Restrict origin ingress to those proxies and
make the boundary proxy overwrite forwarding headers. Trusting loopback means local
processes can assert forwarded IPs; do not enable it merely because the lab is local.
Docker gateway/NAT can make multiple host clients appear as the same peer. The default
lab tests therefore assert one socket identity; they do not simulate public IP diversity.

IPv4-mapped IPv6 is canonicalized to IPv4. IPv6 identities share a /64 budget; expanded
and compressed spellings match. This reduces interface-address rotation but does not
stop a client controlling multiple prefixes. Shared NATs/prefixes can cause false positives.
Malformed trusted forwarded IPs yield 400. TRUSTED_PROXIES accepts only explicit numeric
IPs/CIDRs; invalid values fail startup. See the socket/chain/IPv6 tests in tests/.

## Failure and headers

Redis defaults to fail-closed: 503 + Retry-After: 1, readiness 503, liveness 200.
Explicit fail-open allows uncounted requests with X-RateLimit-Policy: fail-open and no
remaining/reset headers. Both choices have a cost: outage availability versus bypass
of the budget. For sign-in paths prefer closed. There is no hidden fallback counter.
Connection and command timeout default to 500 ms; queues are bounded and offline
queuing is off. A timed-out command can already have committed; never retry the debit.
Reconnect is background with a capped delay; failures cannot hang an HTTP request indefinitely.

Redis's 429 Retry-After is remaining TTL rounded up (at least 1 s). Its custom Reset
header is epoch seconds; Nest throttler's Reset is relative seconds. Nginx exposes a
conservative 1 s Retry-After for the configured refill rates, with no fabricated remaining count.
Repeated denied Redis requests do not slide the window. Nest's blocking period starts
on first excess; wait for its Retry-After. Health probes are excluded from request budgets.

## Short runbook / راهنمای کوتاه پاسخ

1. Confirm user impact: latency, errors, availability. Compare RPS, PPS, bandwidth,
   connection/TLS state, worker/queue/DB pressure with a known baseline.
2. Classify the exhausted resource. Bandwidth/PPS saturation requires ISP/CDN/scrubbing
   escalation; application rate limits cannot recover a saturated upstream link.
3. Preserve origin isolation. Cache safe public responses and scope temporary limits
   to abused routes/identities; review false positives for shared NATs and real users.
4. Inspect 429 separately from 503. Check Redis readiness, memory/noeviction errors,
   command latency and connectivity before changing the failure policy.
5. Record UTC incident times, rule changes, expiry times and user impact. Avoid logging
   credentials or full API keys; minimize retained raw IPs and use restricted log access.
6. Validate recovery with service health and user traffic. Remove temporary rules,
   review provider escalation, patch causes and update thresholds/runbooks.

فارسی: ابتدا اثر واقعی و ظرفیت اشباع‌شده را مشخص کنید؛ اشباع لینک را به ارائه‌دهندهٔ بالادستی ارجاع دهید.
برای 429 سهمیه و برای 503 سلامت Redis را بررسی کنید. قانون موقت باید دامنه و زمان انقضا داشته باشد.
پس از بازیابی، اثر روی کاربران و خطاهای مثبت کاذب را بازبینی و قواعد اضطراری را پاک‌سازی کنید.

Sources: [Express proxy model](https://expressjs.com/en/guide/behind-proxies/),
[Nest throttling](https://docs.nestjs.com/security/rate-limiting),
[node-redis production behavior](https://redis.io/docs/latest/develop/clients/nodejs/produsage/),
[Nginx request limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html).
