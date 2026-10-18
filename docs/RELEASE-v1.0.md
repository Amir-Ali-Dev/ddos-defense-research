# v1.0.0 release notes — DRAFT, not published

Educational bilingual DDoS defense reference with three repeatable local scenarios:
Nginx request/connection limits, NestJS process-local throttling, and two Express apps
sharing an atomic Redis fixed-window counter. Includes explicit proxy trust, documented
failure policies, health checks, lockfiles, tests and CI.

Independent review additionally fixed Redis close/timeout races and Lua pre-mutation
argument validation. The matched memory/Redis comparison now runs three bounded,
warmed independent trials and retains raw requests, config, environment, percentiles
and real-data figures. See [measured results](EXPERIMENT-RESULTS.md) and
[design decisions](DECISIONS.md). It demonstrates state-sharing semantics and NAT
tradeoffs; it does not establish capacity or production readiness. NestJS remains separate.

Start with the [English](../README.md) or [Persian](../README.fa.md) instructions.
This is not an attack toolkit, load benchmark, production authentication system or
bandwidth-scrubbing service. Cloudflare examples are templates and are not deployed.

Before any publication, the maintainer must review the PR and actual CI run, reproduce
the fresh-clone commands on Docker, choose a license after verifying rights, and decide
whether to merge/tag/publish. Consult [validation](VALIDATION.md) for checks actually run.
No release publication or merge has been performed by this change.
