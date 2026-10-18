# Architecture and diagrams

- [Runnable local architecture](ddos-resilient-architecture.svg): exact Compose services/ports; original 1200 × 700 frame.
- [Conceptual production reference](production-reference.svg): broader edge/DNS/WAF design, not deployed by the lab. DNS is name resolution, not an inline HTTP hop; its arrows indicate dependency. Cache, queue and database links are conceptual and do not specify a runnable processing chain.
- [Detection and response](detection-and-response-flow.svg): operational decision aid.
- [Mitigation layers](mitigation-layers.svg): defense taxonomy, not a literal sequential packet path.
- [Defensive controls](defensive-controls.svg): conceptual controls, not implemented services.

Existing visual identity and image frames are retained. See [lab instructions](../lab/README.md).
