# Diagrams

The diagrams are SVG files so GitHub can render them directly without extra
build steps.

| Diagram | Purpose |
|---|---|
| [ddos-resilient-architecture.svg](ddos-resilient-architecture.svg) | Traffic path from users through DNS, CDN, WAF, rate limiting, load balancing, application, cache, queue, and database layers |
| [detection-and-response-flow.svg](detection-and-response-flow.svg) | How to classify pressure and choose the right mitigation layer |
| [mitigation-layers.svg](mitigation-layers.svg) | Stacked defense layers from upstream providers to data-tier protection |
| [defensive-controls.svg](defensive-controls.svg) | Core controls: rate limiting, cache, autoscaling, queues, graceful degradation, logging, metrics, and runbooks |

