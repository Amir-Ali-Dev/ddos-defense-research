# Changelog

## 1.0.0 — unreleased candidate

### Independent review and measured comparison — 2026-10-19

- Fix Redis shutdown/reconnect races with terminal close and connection generations;
  avoid resetting a healthy connection for command errors. Validate Lua bounds before
  mutation so invalid expiry arguments cannot leave persistent counters.
- Add real HTTP trust-boundary regressions and deterministic memory boundary tests.
  Bound readiness by elapsed time, retain failure diagnostics and widen Nest test windows.
- Add the same Express fixed-window application with bounded local memory versus shared
  Redis, independent processes, warm-up and 3 measured repetitions, NAT/boundary/outage
  scenarios, hard request/runtime caps, raw JSON/CSV and Matplotlib figures.
- Archive actual CI data and report small-sample limitations. Shorten both entrypoint
  READMEs and move protocol, troubleshooting, theory and design decisions into docs.
- CI runs the real comparison and publishes actual artifacts with always-run cleanup.

- Replace header-trusting IP identity with explicit proxy CIDRs, socket-first extraction,
  IPv4 canonicalization and IPv6 /64 grouping. Ignore unverified API keys and Authorization identities.
- Provide runnable Nest/Express routes, atomic Redis windows/TTL repair, bounded Redis
  commands, explicit fail-closed/open behavior and documented 429/503 headers.
- Add loopback-only Compose profiles, health/readiness checks, two Redis app replicas,
  bounded functional tests and CI cleanup. Pin compatible versions and workspace lockfile.
- Synchronize bilingual run instructions, operational boundaries, case sources/dates,
  Cloudflare templates, security/contribution guidance and license status.
- Preserve visual identity and original image frames; align the architecture with real lab services.

No release/tag, merge, About/Topics change or project license selection is included.
