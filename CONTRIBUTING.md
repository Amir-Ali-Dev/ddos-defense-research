# Contributing

Use a branch and keep changes defensive, reproducible and sourced. Read the two root
READMEs and [operations](docs/OPERATIONS.md). No AGENTS.md existed at the reviewed base.
Preserve unrelated changes and the existing visual frames; change internal layout only
when needed. New tests must use loopback/container-local services, capped requests,
bounded concurrency and deadlines; never accept arbitrary public targets.

From the root use Node 24.22.0: npm ci, npm run build, npm test, npm run check.
Then run the documented Compose lab, npm run test:lab and npm run test:redis (with its
test override). Validate both Nginx configs. CI does the same and always cleans up.
If Docker is unavailable, state exactly which checks were not run; do not label mocks
as real Redis tests. No benchmark or passing-CI claim without the actual run URL.

Commit package-lock.json when changing dependencies; use exact direct versions and
review npm audit plus upstream release notes. Update both English/Persian instructions,
CHANGELOG, capability boundaries, source dates and tests when behavior changes.
For case-study numbers cite the primary operator/research source, occurrence date,
publication date and observation scope. Do not reproduce offensive procedures.

See [license status](docs/LICENSE-STATUS.md). No project license has been selected;
do not submit copied third-party code/art without provenance and permission. The owner
must choose a license after verifying rights; contributors must not guess ownership.
PRs should state the problem, implemented behavior, test commands/results and limitations.

For matched comparison changes run the protocol in experiments/README.md. Never edit
recorded request/latency values to fit expected counts. Preserve source/CI provenance,
separate warm-up from measured rows, and regenerate summaries/figures from raw data.
CI correctness checks must not depend on submillisecond latency thresholds.
