const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const dir = path.resolve(
  process.argv[2] ?? path.join(__dirname, "results/latest"),
);
const data = JSON.parse(fs.readFileSync(path.join(dir, "raw.json"), "utf8"));
assert.equal(
  data.status,
  "complete",
  "Partial/failed runs are not publishable results",
);
const measured = data.raw.filter((row) => row.scenario !== "warmup");
function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)] ?? null;
}
const groups = new Map();
for (const row of measured) {
  const key = JSON.stringify([
    row.repetition,
    row.scenario,
    row.mode,
    row.phase,
  ]);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}
const summary = [];
for (const [key, rows] of groups) {
  const [repetition, scenario, mode, phase] = JSON.parse(key);
  const statuses = {};
  for (const row of rows)
    statuses[row.status] = (statuses[row.status] ?? 0) + 1;
  const users = new Set(rows.map((row) => row.user));
  let expectedAccepted;
  const double = mode === "memory-two";
  if (mode === "none") expectedAccepted = rows.length;
  else if (scenario === "boundary")
    expectedAccepted =
      phase === "anchor"
        ? 2
        : phase === "before"
          ? double
            ? 10
            : 4
          : double
            ? 12
            : 6;
  else if (scenario === "outage")
    expectedAccepted =
      phase === "down" && mode === "redis-two" ? 0 : rows.length;
  else expectedAccepted = Math.min(rows.length, double ? 12 : 6);
  assert.equal(
    statuses[200] ?? 0,
    expectedAccepted,
    "Scenario accepted count mismatch",
  );
  summary.push({
    repetition,
    scenario,
    mode,
    phase,
    count: rows.length,
    statuses,
    accepted: statuses[200] ?? 0,
    rejected: statuses[429] ?? 0,
    expectedAccepted,
    acceptedOverLogicalBudget:
      mode === "none" ? null : (statuses[200] ?? 0) / data.config.budget,
    logicalBudgetPerWindow: mode === "none" ? null : data.config.budget,
    effectiveBudgetPerWindow:
      mode === "none"
        ? null
        : mode === "memory-two"
          ? 2 * data.config.budget
          : data.config.budget,
    p50Ms: percentile(
      rows.map((row) => row.durationMs),
      0.5,
    ),
    p95Ms: percentile(
      rows.map((row) => row.durationMs),
      0.95,
    ),
    regularUsers: scenario === "nat" ? users.size : null,
    regularUsersLimited:
      scenario === "nat"
        ? new Set(
            rows.filter((row) => row.status === 429).map((row) => row.user),
          ).size
        : null,
  });
}
for (let rep = 1; rep <= 3; rep++)
  assert(
    summary.some((row) => row.repetition === rep),
    "Missing measured repetition",
  );
const spread = [];
const groupKeys = new Set(
  summary.map((row) => JSON.stringify([row.scenario, row.mode, row.phase])),
);
for (const key of groupKeys) {
  const [scenario, mode, phase] = JSON.parse(key);
  const rows = summary.filter(
    (row) =>
      row.scenario === scenario && row.mode === mode && row.phase === phase,
  );
  assert.equal(rows.length, 3, "Each group requires three trials");
  const range = (metric) => ({
    min: Math.min(...rows.map((row) => row[metric])),
    median: percentile(
      rows.map((row) => row[metric]),
      0.5,
    ),
    max: Math.max(...rows.map((row) => row[metric])),
  });
  spread.push({
    scenario,
    mode,
    phase,
    accepted: range("accepted"),
    p50Ms: range("p50Ms"),
    p95Ms: range("p95Ms"),
  });
}
const report = {
  schema: 1,
  runId: data.runId,
  environment: data.environment,
  config: data.config,
  method:
    "p50/p95: nearest-rank ceil(p*n), sorted complete response-body elapsed times in each repetition/scenario/mode/phase; no interpolation. Cross-trial spread is min/median/max, not a confidence interval. Warm-up and readiness probes excluded. HTTP status mixtures are not capacity measurements.",
  trials: summary,
  spread,
  recovery: data.events.filter((event) => event.type === "recovered"),
};
fs.writeFileSync(
  path.join(dir, "summary.json"),
  JSON.stringify(report, null, 2) + "\n",
);
const columns = [
  "repetition",
  "scenario",
  "mode",
  "phase",
  "request",
  "user",
  "slot",
  "atMs",
  "status",
  "durationMs",
  "policy",
];
const cell = (value) => JSON.stringify(String(value ?? ""));
fs.writeFileSync(
  path.join(dir, "requests.csv"),
  columns.join(",") +
    "\n" +
    data.raw
      .map((row) => columns.map((c) => cell(row[c])).join(","))
      .join("\n") +
    "\n",
);
console.log(
  "PASS: summarized " +
    measured.length +
    " measured requests from 3 independent repetitions",
);
module.exports = { percentile };
