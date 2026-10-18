# Spamhaus 2013

- Occurrence: March 2013; provider contacted on 2013-03-18.
- Publication: 2013-03-27.
- Primary source: [Cloudflare incident operator](https://blog.cloudflare.com/the-ddos-that-almost-broke-the-internet/).
- Reviewed: 2026-10-19.

## Reported observation

Cloudflare describes changing DNS amplification traffic and escalation toward upstream connectivity. Reported rates describe particular stages of its observation, not the health of the entire internet.

## Defensive interpretation

Upstream coordination and source-address validation matter; an origin firewall cannot recover a saturated provider link.

These recommendations are repository analysis, not a quotation or a reproduction procedure.
See the [local lab](../lab/README.md) and [runbook](../docs/OPERATIONS.md).
