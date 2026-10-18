# Repeatable local lab / آزمایشگاه محلی

See the complete [English quick start](../README.md#quick-start) and [Persian instructions](../README.fa.md).
Run all commands from the repository root. Select `nginx`, `nestjs`, `redis`, or `all`:

~~~sh
docker compose -f lab/docker-compose.yml --profile all up -d --build --wait --wait-timeout 120
docker compose -f lab/docker-compose.yml --profile all exec -T edge nginx -t
npm ci
npm run build
npm run test:lab
docker compose -f lab/docker-compose.yml --profile all down -v --remove-orphans
~~~

The smoke test stops/restarts the ephemeral Redis. It is a bounded functional test,
not a load/attack tool. No target URL option is accepted. It uses fewer than 100
sequential HTTP requests and 2-second request deadlines, plus bounded readiness waits.
The CI job has a 15-minute hard deadline and always removes containers/volumes.

Node apps run as non-root with a read-only filesystem, dropped capabilities and
resource limits. Nginx and Redis use their official image defaults. The network is
a private Docker bridge; host ports are loopback only, not a production ingress.
Containers can reach the internet; this is not a sandbox for running untrusted code.
There is no TLS, authentication, CDN, bot management, scrubbing, queue, or database here.

Redis apps use liveness /healthz and readiness /readyz; Compose waits for readiness.
Restarting the apps loses NestJS state; restarting Redis loses shared budgets.
Use [compose.test.yml](compose.test.yml) only for host-side Lua integration tests.
