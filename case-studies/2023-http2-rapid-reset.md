# HTTP/2 Rapid Reset 2023

## Why It Matters

The HTTP/2 Rapid Reset event showed that application-layer DDoS can reach
extreme request-per-second scale. It also highlighted how protocol behavior,
edge infrastructure, and fast patching all matter.

## Defensive Lessons

- Application-layer attacks can be massive even when bandwidth is not the only
  bottleneck.
- HTTP protocol implementations and proxies must be patched quickly.
- Edge telemetry should include protocol-level signals, not only aggregate RPS.
- WAF and CDN providers are important parts of the patch and mitigation path.

## Architecture Takeaway

Layer 7 defense must be treated as a capacity and protocol-resilience problem,
not only as a rule-matching problem.

