# Validation record — v1.0 candidate

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
