# Bounded matched-backend comparison

Run from the repository root with Node 24.22.0, npm, Docker Linux containers and
Compose >=2.24. The controller requires the fixed lab Redis exposed on loopback
16379 by the test override. Nothing accepts an arbitrary target URL or load rate.
The lab must be disposable: experiments stop/restart its persistence-disabled Redis.

```sh
npm ci
npm run build
docker compose -f lab/docker-compose.yml -f lab/compose.test.yml --profile all up -d --build --wait --wait-timeout 120
npm test
npm run test:redis
npm run test:lab
npm run experiment:run
python -m pip install -r experiments/requirements.txt
python experiments/plot.py
docker compose -f lab/docker-compose.yml -f lab/compose.test.yml --profile all down -v --remove-orphans
```

On failure, retain raw output before cleanup; CI performs cleanup with `if: always()`
and uploads actual files even on a failed experiment. Only complete runs can be
summarized/plotted. If Docker is unavailable, do not manufacture a replacement result.
`npm run experiment:summary` recomputes summaries without sending requests. To process
an archived run: `node experiments/summarize.cjs experiments/results/<recorded-run>` and
`python experiments/plot.py experiments/results/<recorded-run>` (replace the directory
with an actual archive listed in [results](../docs/EXPERIMENT-RESULTS.md)).

## Matched fixtures

| Mode | Independent processes | State | Logical budget |
|---|---:|---|---:|
| none | 1 | Disabled only in the forked lab fixture | Unlimited control |
| memory-one | 1 | One in-process map | 6 / 1200 ms |
| memory-two | 2 | Independent in-process maps | 6 / 1200 ms each |
| redis-two | 2 | One shared Redis namespace | 6 / 1200 ms total |

All use the exact same Express application, route, body and IP normalization. Two
additional Redis processes evaluate fail-open during outages; they are not included
as a fifth main comparison. NestJS and Nginx are evaluated by their functional tests,
not mixed into the matched count/latency charts. No public proxy/CDN is used.

Fixtures listen at fixed 127.0.0.1 ports 3410–3417. They cannot be launched by the
normal server CLI or without the controller's fork/IPC channel. Redis is fixed to
127.0.0.1:16379. A conflict causes failure; stop the conflicting local process.

## Protocol and hard bounds

Exactly 3 independent repetitions, each with new OS processes and a unique Redis
run namespace. Each process first receives 2 warm-up counted requests. Before each
scenario the controller changes the route namespace through private parent/child IPC;
warm-up counters cannot affect measured requests. Old Redis keys expire; memory maps
sweep expired entries and cap identities. No administrative reset HTTP endpoint exists.

Measured HTTP concurrency is exactly 1. Across the whole run there are at most 2400
HTTP requests including readiness probes and warm-up; each request has a 1000 ms
timeout. There is no request retry. Readiness has 40 attempts with 100 ms intervals,
Docker subprocesses time out at 15 s, IPC at 2 s. The soft run deadline is 150 s;
the hard watchdog exits at 180 s and kills fixture children. CI always removes the
Compose lab afterward. Each repetition normally records 228 measured + 16 warm-up
requests; actual totals including probes are stored rather than assumed.

1. Normal: 4 requests per mode, below budget.
2. Excess: 16 alternating requests per mode. Hypothesis: 16 control, 6 memory-one,
   12 memory-two, 6 Redis accepted. Assertions verify the observed counts.
3. NAT: 4 labelled regular users, 2 requests each, round-robin. Every request still
   has the same real IP. Per-user labels never enter the limiter key. Report both
   rejected requests and users with at least one rejected request.
4. Boundary: 2 anchor requests (one per replica), 10 before the earliest expiry,
   then 12 after it. The before batch starts at window−300 ms; the after batch at
   window+150 ms relative to the anchor. The recorded pre-expiry phase must finish
   with at least 80 ms guard. If scheduling crosses it, the run is invalid and fails,
   rather than reporting fictional burst evidence. No p50/p95 latency threshold is
   a pass/fail criterion. Within each phase all modes receive the same request count.
5. Outage: stop the real Compose Redis, wait for readiness=503, record two requests
   per mode and two for the separate fail-open group; restart the existing container,
   record readiness recovery per Redis process and two recovered requests per group.
   Both closed and open groups must resume counted 200 responses with no fail-policy header.

## Data and calculation

`results/latest/raw.json` contains every counted HTTP request (including warm-up),
monotonic completion time, complete-body elapsed milliseconds, status, phase, instance
slot and logical user; plus namespace/process/outage events, config, OS/CPU/memory,
Node/package versions, Docker server/image metadata, Redis version, source commit and
CI identifiers where applicable. No secrets or unrestricted environment dump is captured.

`requests.csv` is a direct export of those rows. `summary.json` excludes warm-up and
readiness probes, groups each repetition/scenario/mode/phase, and records status counts,
accepted/expected counts, effective versus logical budget, NAT users limited and latencies.
p50/p95 use nearest rank: sort n durations ascending and select index ceil(p*n)−1.
Timing starts immediately before fetch and ends after consuming the response body;
it includes local connection scheduling and HTTP overhead, not just limiter CPU time.
Normal n=4 makes p95 the maximum. Cross-trial spread is min/median/max, not confidence intervals.

Figures use Matplotlib 3.10.7 and only actual complete raw/summary files. Individual
trial dots remain visible even when acceptance counts coincide. They compare accepted
counts and normal-traffic p50/p95; do not interpret the latter as framework rankings.
Order is fixed, there is one host, and the sample is small. No capacity, significance
or production-readiness conclusion follows from these measurements.

See [design decisions](../docs/DECISIONS.md), [recorded evidence](../docs/EXPERIMENT-RESULTS.md)
and [validation](../docs/VALIDATION.md). CI artifacts are retained for 14 days; selected
raw data and figures are archived in Git for longer reproducibility.
