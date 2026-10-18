# Limiter decisions and evidence boundaries

## One algorithm, two state locations

The matched comparison uses the same Express `createApp`, identity function, routes,
budget (6) and first-request-anchored fixed window (1200 ms). Only the storage backend
changes. Each instance is an independent OS process. The unrestricted fixture is
fork-only, loopback-only and unavailable through the production server entrypoint.
NestJS remains a separate example: throttler v6 has different storage/block semantics,
so its timing/count results are not pooled with this comparison.

A first-request-anchored fixed window is small enough to audit. Memory increments are
synchronous within one process; Redis executes INCR/PTTL/PEXPIRE in one atomic Lua call.
Atomic execution does not imply rollback on a runtime error. Lua therefore validates
integer bounds before mutation, including non-finite/oversized arguments. The memory
implementation uses identical bounds and expiry semantics and refuses new identities
when its bounded identity map is full rather than evicting active budgets.

Independent memory replicas each own a budget; they cannot enforce one aggregate cap.
Redis replicas share one route/identity key. Restarting Redis in this ephemeral lab
loses those keys; shared state is not a durability/HA claim. No sliding-window or
weighted-cost enforcement is claimed. Route cost metadata remains conceptual.

## Fixed windows and time

Expiry is anchored to the first request, not a global clock bucket. Rejections increment
the count but do not extend expiry. A persistent counter is assigned a new TTL while
its existing count is retained. A client can spend nearly two budgets around expiry;
this is an algorithm property, not a measured capacity result. Redis uses its clock;
memory uses the process wall clock. Clock changes and Redis failover require separate
deployment analysis. Boundary tests use an injected clock for memory, TTL observations
and guard intervals for Redis; the experiment records actual request timestamps.

## Identity and topology

Default identity comes from the TCP peer. Express only walks XFF through exact trusted
IPs/CIDRs, right-to-left, stopping at the first untrusted hop. Vendor headers and
unvalidated keys are ignored. This is valid only when those addresses really are
controlled proxies, boundary proxies overwrite forwarded headers, and origin ingress
prevents direct bypass. A trusted local HTTP caller in the regression test represents
the proxy boundary; it is not proof of any external CDN deployment.

IPv4-mapped IPv6 is canonicalized; IPv6 interfaces in one /64 share a budget. Shared
NAT and /64 aggregation reduce address-rotation bypass at the cost of false positives.
The NAT experiment defines a regular user as one logical user making 2 requests in
one window, below the individual budget of 6. Four such users share the actual socket
IP; labels are measurement metadata, not authenticated identities. Production fairness
may need verified user budgets plus pre-authentication IP guards.

## Failure choices and connection lifecycle

Login/payment-like operations generally favor fail-closed: Redis failure yields 503,
not a dishonest 429. Low-risk public cached reads may justify explicit fail-open with
no remaining-budget headers; that is a policy recommendation requiring local review.
Both policies retain readiness=503 while Redis is unavailable. These are two separate
fixture groups, not an automatic policy switch. Recovery readiness and first counted
responses are measured for both policies.

Command deadlines do not establish whether a debit committed. Commands are not retried;
offline queues are disabled. A timeout may reset only its own connection generation;
stale failures must not destroy a newer socket. `close()` is terminal, even with pending
commands. WRONGTYPE and script validation errors do not restart a healthy connection.

## What the evidence cannot establish

The functional experiments test budget semantics, not DDoS absorption, throughput,
fairness at population scale, autoscaling, HA or production readiness. They do not
protect a saturated bandwidth link, expensive requests below a budget, distributed
identity rotation, or a vulnerable HTTP parser. Three repetitions and four normal
requests per trial are too few for latency ranking or statistical significance.
Measured observations are in [experiment results](EXPERIMENT-RESULTS.md); expected
counts in the protocol are hypotheses checked by assertions, not substituted data.

Official references reviewed 2026-10-19: [Express proxy trust](https://expressjs.com/en/guide/behind-proxies/),
[Redis Lua atomic execution](https://redis.io/docs/latest/develop/programmability/eval-intro/),
[PTTL semantics](https://redis.io/docs/latest/commands/pttl/),
[node-redis reconnect/offline behavior](https://redis.io/docs/latest/develop/clients/nodejs/produsage/),
[Nest throttling](https://docs.nestjs.com/security/rate-limiting).
