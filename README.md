# DDoS Defense Research

<p align="center">
  <img src="assets/hero.svg" alt="DDoS Defense Research banner" width="100%">
</p>


> A practical, defensive research repository about Distributed Denial of Service
> attacks: how they work at a high level, how to detect them, and how to design
> systems that keep serving real users under pressure.

Persian version: [README.fa.md](README.fa.md)

## Visual Overview

<p align="center">
  <img src="assets/cards/architecture.svg" alt="Architecture card" width="31%">
  <img src="assets/cards/detection.svg" alt="Detection card" width="31%">
  <img src="assets/cards/mitigation.svg" alt="Mitigation card" width="31%">
</p>

<p align="center">
  <img src="assets/cards/examples.svg" alt="Examples card" width="31%">
  <img src="assets/cards/case-studies.svg" alt="Case studies card" width="31%">
  <img src="assets/cards/lab.svg" alt="Defensive lab card" width="31%">
</p>

<p align="center">
  <img src="assets/icons/cdn.svg" alt="CDN icon" width="56">
  <img src="assets/icons/waf.svg" alt="WAF icon" width="56">
  <img src="assets/icons/rate-limit.svg" alt="Rate limit icon" width="56">
  <img src="assets/icons/cache.svg" alt="Cache icon" width="56">
  <img src="assets/icons/autoscaling.svg" alt="Autoscaling icon" width="56">
  <img src="assets/icons/logging.svg" alt="Logging icon" width="56">
  <img src="assets/icons/nginx.svg" alt="Nginx icon" width="56">
  <img src="assets/icons/nestjs.svg" alt="NestJS icon" width="56">
  <img src="assets/icons/redis.svg" alt="Redis icon" width="56">
  <img src="assets/icons/cloudflare.svg" alt="Cloudflare icon" width="56">
</p>


## Educational v1.0 candidate

A bilingual defensive reference with runnable local Nginx, NestJS and Redis examples.
This branch prepares v1.0; no release has been published. See [validation](docs/VALIDATION.md).

| Component | Implemented | Boundary |
|---|---|---|
| Nginx | Per-IP leaky bucket, stricter login, 429 | Local edge only; no CDN or bandwidth scrubbing |
| NestJS | Per-route request counts, explicit proxy trust, IPv6 /64 identity | In-memory state belongs to one process |
| Redis + Express | Atomic shared fixed windows, TTL, timeout, error policies | Two replicas share Redis; no authentication service |
| Route cost metadata | Conceptual, unregistered middleware | Does not debit weighted budgets |
| Cloudflare | Reviewed rule templates | Not deployed or account-tested; plan dependent |

Application limits reduce application work. They cannot stop saturation of your internet link;
that requires upstream ISP, CDN or scrubbing capacity. This lab does not reproduce DDoS traffic.

## Quick start

Prerequisites: Git, Docker Engine/Desktop with Linux containers, Docker Compose v2.24+
and available ports 8080, 3000, 3001, 3002. Allow roughly 1 GB memory and network access
to official images/npm for the first build. No keys, passwords or paid services are required.
Node.js 24.22.0 + npm are needed for host-side tests; containers include Node for the apps.


~~~sh
git clone https://github.com/Amir-Ali-Dev/ddos-defense-research.git
cd ddos-defense-research
git switch prepare-educational-v1
docker compose -f lab/docker-compose.yml --profile all up -d --build --wait --wait-timeout 120
curl -i http://127.0.0.1:8080/api/status
curl -i http://127.0.0.1:3000/api/status
curl -i http://127.0.0.1:3001/api/status
~~~

Expected: HTTP 200 and JSON with `ok: true`. POST `/auth/login` returns 200 (Nginx/Redis)
or 201 (NestJS); it demonstrates a stricter budget and performs **no login/authentication**.
After the documented budget is exhausted, expect 429 and integer `Retry-After` seconds.
The tests exercise this with small bounded request counts. All published ports bind
to **127.0.0.1**. Redis and the Nginx backend have no host ports.

| Profile | Services / local URLs | Demo limits |
|---|---|---|
| `nginx` | edge :8080 → backend | Public 2 r/s + burst 2; login 1 r/s + burst 1 |
| `nestjs` | NestJS :3000 | Public 6 / 2 s; login 2 / 2 s |
| `redis` | app A :3001, app B :3002 → Redis | Shared public 6 / 2 s; shared login 2 / 2 s |
| `all` | All of the above | Independent Nginx, NestJS and Redis scenarios |

Run one profile by replacing `all` in the command. A Nginx burst is extra capacity
beyond the first request; it drains continuously, unlike the Redis fixed window.
NestJS throttler blocks for its TTL starting when the budget is exceeded; Redis's
window is anchored to the first request and rejected requests do not extend it.

## Tests and validation

Run from the repository root, before starting smoke tests on a fresh lab:

~~~sh
npm ci
npm run build
npm test
npm run check
docker compose -f lab/docker-compose.yml --profile all config -q
docker compose -f lab/docker-compose.yml --profile all exec -T edge nginx -t
npm run test:lab
~~~




Smoke tests accept only fixed loopback URLs, make fewer than 100 requests sequentially,
and stop/restart the lab Redis service to verify fail-closed behavior. Do not run them
against a lab with data you need: this Redis is ephemeral and has persistence disabled.
For Lua concurrency/TTL and two-instance integration tests, temporarily expose only a loopback Redis port:

~~~sh
docker compose -f lab/docker-compose.yml -f lab/compose.test.yml --profile redis up -d --build --wait
npm run test:redis
docker compose -f lab/docker-compose.yml -f lab/compose.test.yml --profile all down -v --remove-orphans
~~~


The integration test uses `redis://127.0.0.1:16379` by default; it fails rather than silently
skipping when Redis is absent. HTTP policy tests inject a failed dependency; they do
not replace the real Redis integration or outage smoke test. [CI](.github/workflows/ci.yml)
builds, tests, validates configurations/links and cleans up even after failures.
No badge implies a CI pass; actual results are recorded in the PR and [validation report](docs/VALIDATION.md).

## Shutdown and troubleshooting

~~~sh
docker compose -f lab/docker-compose.yml --profile all logs --tail 80
docker compose -f lab/docker-compose.yml --profile all ps
docker compose -f lab/docker-compose.yml --profile all down -v --remove-orphans
~~~


If a port is occupied, stop the conflicting service or change the loopback host port
and update the fixed smoke-test URL. On Windows, enable Linux containers in Docker Desktop.
If image/npm downloads fail, check registry connectivity and retry the build; do not
disable TLS verification. For 503, inspect Redis readiness and logs; 429 is an exhausted
budget, not a Redis failure. Wait at least 3 seconds before manually retrying lab limits.
Health probes are exempt from rate limits; `/readyz` on Redis apps reports 503 during an outage.

## Operational guidance and reference

- [Proxy trust and failure policies](docs/OPERATIONS.md): IP extraction, IPv6, headers, timeouts and runbook.
- [Defensive background](docs/reference.en.md) · [Persian article and instructions](README.fa.md).
- [Nginx](examples/nginx/README.md) · [NestJS](examples/nestjs/README.md) · [Redis](examples/redis/README.md) · [Cloudflare](examples/cloudflare/README.md).
- [Lab](lab/README.md) · [Architecture](diagrams/ddos-resilient-architecture.svg) · [Asset gallery](assets/README.md).
- [Case studies](case-studies/README.md) · [Sources](references/README.md) · [Dependency review](docs/DEPENDENCIES.md).
- [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [License status](docs/LICENSE-STATUS.md).
- [Changelog](CHANGELOG.md) · [Draft release notes](docs/RELEASE-v1.0.md) · [About/Topics suggestions](.github/REPOSITORY_SETUP.md).

Fixed windows permit boundary bursts; shared NATs and IPv6 /64s share budgets.
This is an educational configuration, not a production capacity or availability guarantee.
