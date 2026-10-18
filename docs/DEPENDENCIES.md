# Dependency review — 2026-10-19

Exact direct versions and a root workspace package-lock.json are committed. npm ci is
the supported installation path; do not run independent installs in the examples.
The official Node dist index provided 24.22.0 (24.x LTS). Nest 11.2.7 is paired with
its Express 5 adapter and Express 5.3.0; the previous Express 4/adapter 5 mismatch is removed.
Throttler 6.7.1, redis client 6.3.0, TypeScript 5.9.3, types/express 5.0.6,
types/node 24.10.1, proxy-addr 2.0.8, ipaddr.js 2.5.0, RxJS 7.8.2 and reflect-metadata
0.2.2 resolved from the official npm registry. YAML 2.9.1 replaces a version flagged by audit.

Containers pin Node 24.22.0-alpine, Nginx stable 1.30.6-alpine and Redis extended 8.2.10-alpine.
Those tags were verified in the Docker Official Images manifests; tags can be rebuilt,
so these are version pins, not immutable digest pins. Refresh deliberately after advisories.
Redis 8.2 is an extended supported series according to the official version policy.
The lockfile fixes transitive npm versions/integrities; container OS rebuilds remain possible.

Primary references checked:

- [Node releases](https://nodejs.org/en/about/previous-releases) and [official dist index](https://nodejs.org/dist/index.json).
- [Nest 11 migration](https://docs.nestjs.com/migration-guide) and [throttler](https://github.com/nestjs/throttler).
- [node-redis](https://github.com/redis/node-redis) and [production options](https://redis.io/docs/latest/develop/clients/nodejs/produsage/).
- [Nginx stable downloads](https://nginx.org/en/download.html).
- [Redis supported series](https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/).
- [Official node image](https://github.com/docker-library/official-images/blob/master/library/node),
  [nginx image](https://github.com/docker-library/official-images/blob/master/library/nginx),
  [redis image](https://github.com/docker-library/official-images/blob/master/library/redis).

No permanent vulnerability-free/support guarantee is made. Review new advisories before deployment.
