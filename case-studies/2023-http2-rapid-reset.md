# HTTP/2 Rapid Reset 2023

## Why It Matters

The HTTP/2 Rapid Reset event showed that application-layer DDoS can reach
extreme request-per-second scale. It also highlighted how protocol behavior,
edge infrastructure, and fast patching all matter.

Sources:

- [Google: How HTTP/2 Rapid Reset works](https://cloud.google.com/blog/products/identity-security/how-it-works-the-novel-http2-rapid-reset-ddos-attack)
- [Google: Largest DDoS attack above 398 million rps](https://cloud.google.com/blog/products/identity-security/google-cloud-mitigated-largest-ddos-attack-peaking-above-398-million-rps/)

## What Made It Different

Traditional volumetric attacks try to overwhelm network capacity. Rapid Reset
was dangerous because it exploited application-layer and protocol-level cost
asymmetry: the client could create work for servers and proxies at very high
speed while avoiding the normal response path.

From a defensive perspective, the important lesson is that request count alone
is not enough. Operators also need protocol-level visibility, especially around
connection behavior, stream creation, cancellation patterns, and backend work
triggered by edge requests.

## Defensive Analysis

| Defensive question | Why it matters |
|---|---|
| Are HTTP/2-capable proxies patched? | Edge software is part of the security boundary |
| Can abusive connections be closed quickly? | Blocking individual requests may be too slow |
| Are stream resets and cancellation ratios visible? | Aggregate RPS can hide protocol abuse |
| Does the edge shield the backend from canceled work? | Reverse proxies may pass work downstream too early |
| Can Layer 7 mitigation happen globally? | Extreme RPS needs distributed edge capacity |

## Defensive Lessons

- Application-layer attacks can be massive even when bandwidth is not the only
  bottleneck.
- HTTP protocol implementations and proxies must be patched quickly.
- Edge telemetry should include protocol-level signals, not only aggregate RPS.
- WAF and CDN providers are important parts of the patch and mitigation path.
- Some mitigations need to operate at connection level, not only request level.
- Backend services should not be the first place that discovers protocol abuse.

## Recommended Defensive Controls

| Control | Defensive purpose |
|---|---|
| Patch HTTP/2 proxies and load balancers | Fix known protocol-handling weaknesses |
| Track per-connection behavior | Detect abnormal stream creation and cancellation |
| Close abusive connections | Stop repeated work creation on the same connection |
| Limit backend fan-out | Prevent edge parsing from becoming backend load |
| Use CDN/WAF edge capacity | Keep mitigation distributed and close to traffic source |
| Maintain emergency protocol toggles | Allow temporary policy changes while preserving core availability |

## Architecture Takeaway

Layer 7 defense must be treated as a capacity and protocol-resilience problem,
not only as a rule-matching problem.

## Repository Mapping

- Defensive controls diagram: [diagrams/defensive-controls.svg](../diagrams/defensive-controls.svg)
- Cloudflare edge rules: [examples/cloudflare](../examples/cloudflare/README.md)
- NestJS route-level throttling: [examples/nestjs](../examples/nestjs/README.md)
