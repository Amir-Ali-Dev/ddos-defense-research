# Security policy

The v1.0 candidate is educational, with no production support/SLA. It contains no traffic
generator or public-target testing. Run tests only in the local lab with documented bounds.

For a vulnerability, use the repository Security → Advisories → Report a vulnerability
if private reporting is enabled. If unavailable, open an issue asking the maintainer to
enable private reporting without posting exploit details, secrets, personal data or targets.
No private email address or response-time promise is designated by this repository.

Provide affected commit/version, file path, expected versus actual trust boundary,
minimal loopback-only reproduction, dependency versions and a proposed mitigation.
Report credential leaks through GitHub's private channel where available; revoke exposed
credentials immediately. Ordinary documentation inaccuracies can be public issues.

Known boundaries: no authentication/TLS/CDN, process-local Nest state, fixed-window bursts,
IPv6 /64 and NAT shared budgets, ephemeral single Redis with no failover, and no protection
against bandwidth exhaustion. See [operations](docs/OPERATIONS.md) and [validation](docs/VALIDATION.md).
Pinning versions does not eliminate future vulnerabilities; review official advisories and lockfile diffs.
