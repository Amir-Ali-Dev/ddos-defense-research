# Dyn DNS disruption 2016

- Occurrence: 2016-10-21.
- Publication: 2016-10-21.
- Primary source: [ThousandEyes network measurement operator](https://www.thousandeyes.com/blog/dyn-dns-ddos-attack).
- Reviewed: 2026-10-19.

## Reported observation

ThousandEyes published its own measurements of DNS disruption and related service reachability. This is primary measurement evidence, not the Dyn internal postmortem. No bot count, exact peak rate or definitive attribution is asserted here.

## Defensive interpretation

Monitor resolution separately from application health; review DNS dependency concentration and failover.

These recommendations are repository analysis, not a quotation or a reproduction procedure.
See the [local lab](../lab/README.md) and [runbook](../docs/OPERATIONS.md).
