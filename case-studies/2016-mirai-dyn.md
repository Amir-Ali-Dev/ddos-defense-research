# Dyn DNS disruption 2016

- Occurrence: 2016-10-21.
- Publication: 2016-10-24.
- Primary source: [RIPE NCC / Massimo Candela and Emile Aben](https://labs.ripe.net/author/massimo_candela/a-quick-look-at-the-attack-on-dyn/).
- Reviewed: 2026-10-19.

## Reported observation

RIPE NCC analyzed its own BGP and RIPE Atlas DNS measurements around the disruption. This is primary measurement evidence, not the Dyn internal postmortem; its coverage of the first wave is partial. No bot count, exact peak rate or definitive attribution is asserted here.

## Defensive interpretation

Monitor resolution separately from application health; review DNS dependency concentration and failover.

These recommendations are repository analysis, not a quotation or a reproduction procedure.
See the [local lab](../lab/README.md) and [runbook](../docs/OPERATIONS.md).
