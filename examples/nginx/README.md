# Nginx Rate Limiting Example

This example shows defensive Nginx controls that are commonly used in front of
web applications and APIs.

Files:

- [rate-limit.conf](rate-limit.conf): request and connection limits for public,
  API, login, and admin paths.

Design notes:

- Use tighter limits for expensive or sensitive endpoints.
- Prefer route-specific limits over one global rule.
- Return `429 Too Many Requests` for rate-limited traffic.
- Keep the real origin reachable only from trusted proxy/CDN networks.

Production checklist:

- Tune rates using real traffic baselines.
- Log limited requests separately.
- Test false positives with real user journeys.
- Coordinate edge limits with CDN/WAF rules.

