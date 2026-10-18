# Validation record — v1.0 candidate

## Independent review and comparison — 2026-10-19

PR 1 was open/unmerged at the start. Its head was e2904a51d170492a3b0755e1031ad8d15baaaae2;
main was b42831203b62166d0b0196fcdd8fff0410eefb72. Work continued on the existing
prepare-educational-v1 branch, preserving earlier work. No AGENTS.md was present in
the repository or checked ancestors; CONTRIBUTING.md/SECURITY.md were read.

Independent findings and fixes:

- Closing Redis with a pending failed command could reopen it. Overlapping timeout
  failures could reset a newly opened socket. Terminal shutdown and generation checks
  now prevent both; tests deliberately exercise pending failures and concurrent timeouts.
- Redis command errors unnecessarily restarted connections. Only current-generation
  timeouts reset sockets; WRONGTYPE remains a controlled 503 without reconnect churn.
- Lua checked integrality but not upper/finite bounds before INCR/PEXPIRE. Scripts do
  not roll back runtime errors. Bounds now reject invalid values before mutation;
  real Redis tests assert that invalid arguments do not create a counter.
- Added actual HTTP trusted/untrusted peer and mapped/IPv6 /64 tests, plus bounded
  identity storage and deterministic injected-clock memory expiry tests.

Locally: Node 24.22.0 TypeScript build and 11 tests passed, 0 skipped. An initial
Windows Nest readiness timeout was observed; readiness now has an elapsed-time bound
and retained diagnostics, and its test uses a longer window/guard. The latest local
suite passed; the earlier failure is not silently presented as a pass. Docker was
still unavailable locally, so no local Redis/container comparison is claimed.

[Actual Linux CI run 39169760646](https://github.com/Amir-Ali-Dev/ddos-defense-research/actions/runs/39169760646)
passed build, 11 tests, real Redis integration (including Lua validation, concurrency,
TTL repair/shared apps), both Nginx validations, Compose startup/readiness, actual
outage smoke, all 3 comparison repetitions, Matplotlib figures, artifact upload and
resource cleanup. It tested PR head a6a22c71991c57ae0f02d9bab13c243558550bd4.
Latest PR checks identify subsequent tested revisions.

The downloaded [raw evidence and report](EXPERIMENT-RESULTS.md) contain 684 measured
and 48 warm-up rows; 810 total HTTP requests include readiness probes. The raw archive
was re-summarized locally with the same 684 measured rows. Figures were generated
in CI with Matplotlib, downloaded and visually inspected, not recreated from invented data.
No public-target tests or capacity/production-readiness benchmark was performed.

Remaining limits: shared-runner timing, fixed mode order, small sample, one host,
no actual CDN trust topology, no Redis HA/durability exercise. Project licensing still
requires the owner; no merge, tag, release or repository-setting change was made.

## Earlier v1 preparation record

Reviewed base: b42831203b62166d0b0196fcdd8fff0410eefb72. Review date: 2026-10-19.
No repository AGENTS.md was present. CONTRIBUTING.md and SECURITY.md were read before changes.
Work was prepared in an isolated directory and branch; unrelated workspace files were untouched.

## Actually executed locally

- Windows host, official Node.js 24.22.0.
- Workspace installation and NestJS TypeScript build succeeded.
- `npm test`: 7 tests passed, 0 failed, 0 skipped. Includes real Nest HTTP and Express
  HTTP failure-policy tests with an injected dependency. Those are not real Redis tests.
- `npm audit`: 0 known vulnerabilities after updating YAML to 2.9.1, at review time.
- Docker Compose 5.6.0: base plus test override passed `config -q` without a daemon.
- Official Nginx/Windows 1.30.6: the standalone examples/nginx/rate-limit.conf passed
  `nginx -t`. This does not substitute for validating the Linux container lab config.
- SVG sources parsed successfully with .NET XML parsing.

- A clean `npm ci`, rebuild and the 7 tests also passed with official Node 24.22.0.
- Repository checks passed for 167 internal links/anchors, JSON/YAML and loopback ports.
- 45 external URLs were fetched separately: 35 succeeded, 8 returned HTTP 403 and
  2 ThousandEyes URLs timed out. No HTTP 404 was returned, but blocked/time-limited
  fetches are not a blanket assertion that every external link is healthy. Critical
  source documents were additionally reviewed through browser access.

No performance benchmark or public-target functional test was run.

## Environment limits and separate integration checks

Docker Engine/Desktop was not installed and WSL was not installed on this host.
No local container build, Redis server, Lua/concurrency integration, Linux Nginx lab,
multi-app shared counter or actual Redis-outage smoke test was executed here.
## Actually executed in GitHub Actions

The [successful Linux container run](https://github.com/Amir-Ali-Dev/ddos-defense-research/actions/runs/39167981993)
tested implementation commit 39e0d2f00160acc2a99e8c60bc1346478a6e2942. Its steps passed:
clean install, build, 7 local tests, repository checks, audit, Compose validation,
standalone Linux Nginx validation, container builds and readiness, running Nginx validation,
real Redis Lua/concurrency/TTL repair and two-app integration, bounded loopback smoke,
real Redis stop/restart/recovery, and final container/volume cleanup. The integration
test did not skip for unavailable Redis. The [PR](https://github.com/Amir-Ali-Dev/ddos-defense-research/pull/1)
shows the latest commit's check; follow-up changes must pass that check as well.

Cloudflare templates were compared with official documentation but not deployed or
validated against a real account/plan. They are conceptual examples.

## Manual steps before release

Review PR/CI, repeat the documented fresh-clone Docker commands on a supported machine,
choose a project license after checking content rights, and decide whether to merge/tag
and publish. No license, merge, release, About/Topics or repository-settings change was made.
