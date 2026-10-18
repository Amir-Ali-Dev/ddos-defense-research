# HTTP/2 Rapid Reset 2023

- Occurrence: Campaign began August 2023; publicly disclosed 2023-10-10.
- Publication: 2023-10-10.
- Primary source: [Google incident operator](https://cloud.google.com/blog/products/identity-security/google-cloud-mitigated-largest-ddos-attack-peaking-above-398-million-rps/).
- Reviewed: 2026-10-19.

## Reported observation

Google reports mitigating a campaign peaking at 398 million requests/s. This is its observation scope, not a general capacity promise. Protocol processing and edge patching are central to this incident class.

## Defensive interpretation

Patch HTTP/2 implementations, monitor stream/reset behavior and avoid unnecessary backend work.

These recommendations are repository analysis, not a quotation or a reproduction procedure.
See the [local lab](../lab/README.md) and [runbook](../docs/OPERATIONS.md).
