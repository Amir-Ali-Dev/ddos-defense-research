# GitHub 2018

## Why It Matters

On February 28, 2018, GitHub reported a major DDoS event that peaked around
1.35 Tbps and 126.9 million packets per second. GitHub routed traffic through
its DDoS mitigation provider and recovered quickly.

Source: [GitHub February 28th DDoS Incident Report](https://github.blog/news-insights/company-news/ddos-incident-report/)

## Timeline

| Time, UTC | Event | Defensive meaning |
|---|---|---|
| 17:21 | Monitoring detected an ingress/egress anomaly and alerted responders | Baseline-aware monitoring found the event quickly |
| 17:21-17:26 | GitHub.com was unavailable | Even large platforms can have short user-visible impact |
| 17:26 | Traffic shift toward Akamai was initiated through operational tooling | Prepared provider escalation reduced reaction time |
| 17:30 | Monitoring showed recovery | Recovery was validated with traffic and load balancer signals |
| After 18:00 | A second, smaller spike appeared | DDoS response must continue after first recovery |

## Attack Class

This was a volumetric amplification event. The defensive problem was not an
application bug or a database bottleneck. The immediate risk was upstream and
edge capacity: too much unwanted traffic was arriving before normal application
logic could matter.

That distinction is important. Autoscaling application servers would not be the
primary answer to this class of event. The useful controls live earlier:

- transit capacity and peering diversity,
- ability to shift BGP announcements,
- scrubbing or mitigation provider capacity,
- edge ACLs and filtering,
- network telemetry that detects ingress anomalies quickly.

## Defensive Lessons

- Very large volumetric attacks require upstream absorption.
- Fast mitigation depends on prepared escalation paths.
- Incident timelines help teams understand impact and response quality.
- Public postmortems can build trust when they are clear and factual.
- Human response should eventually be backed by automation where risk allows it.
- Monitoring should track both traffic volume and service health, because a
  traffic spike is only part of the incident story.

## Architecture Analysis

The incident is a clean example of why DDoS defense is an architecture decision,
not a single device. GitHub had already increased transit capacity, but still
needed a partner with a larger edge network to absorb and filter the event.

The key architectural pattern is controlled traffic evacuation:

```text
normal edge path -> anomaly detected -> provider shift -> filtering at larger edge -> recovery validation
```

The design goal is not to make an origin infinitely large. It is to move hostile
traffic to a place where it can be absorbed and filtered before it reaches
fragile capacity.

## What To Monitor

| Signal | Why it matters |
|---|---|
| Ingress vs egress ratio | Amplification often creates abnormal inbound volume |
| Transit bandwidth per facility | Shows where the network is being saturated |
| Packets per second | Captures pressure that bandwidth alone may miss |
| Load balancer response codes | Confirms user-visible recovery |
| Route changes and provider status | Explains whether mitigation is actually active |
| Post-recovery spikes | Prevents declaring success too early |

## Architecture Takeaway

Even mature platforms need external DDoS mitigation capacity. The win is not
pretending attacks will never happen; the win is making the response fast,
practiced, and observable.

## Repository Mapping

- Nginx limits: [examples/nginx](../examples/nginx/README.md)
- Mitigation layers diagram: [diagrams/mitigation-layers.svg](../diagrams/mitigation-layers.svg)
- Detection flow: [diagrams/detection-and-response-flow.svg](../diagrams/detection-and-response-flow.svg)
