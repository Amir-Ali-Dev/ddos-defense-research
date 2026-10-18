const fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os");
const { fork, execFile } = require("node:child_process");
const { promisify } = require("node:util"),
  { performance } = require("node:perf_hooks");
const { setTimeout: sleep } = require("node:timers/promises");
const { randomUUID } = require("node:crypto");
const assert = require("node:assert/strict");
const config = require("./config.cjs"),
  exec = promisify(execFile);
if (process.argv.length !== 2)
  throw new Error("No target or runtime options are accepted");
const root = path.resolve(__dirname, "..");
const output = path.resolve(
  process.env.COMPARISON_OUTPUT ?? path.join(__dirname, "results/latest"),
);
const abort = new AbortController();
const children = [],
  raw = [],
  events = [];
let requests = 0,
  redisStopped = false;
const runId = randomUUID();
const epochSignals = new Map();
const begin = performance.now();
const softTimer = setTimeout(
  () => abort.abort(new Error("Comparison soft deadline")),
  config.softDeadlineMs,
);
const hardTimer = setTimeout(() => {
  for (const child of children) child.kill();
  console.error("Hard comparison deadline");
  process.exit(1);
}, config.hardDeadlineMs);
function elapsed() {
  return performance.now() - begin;
}
async function command(program, args, timeout = 15000, signal = abort.signal) {
  return (
    await exec(program, args, {
      cwd: root,
      timeout,
      signal,
      maxBuffer: 1024 * 1024,
    })
  ).stdout.trim();
}
async function compose(action, signal) {
  return command(
    "docker",
    [
      "compose",
      "-f",
      "lab/docker-compose.yml",
      "--profile",
      "all",
      action,
      "redis",
    ],
    15000,
    signal,
  );
}
async function pause(ms) {
  await sleep(Math.max(0, ms), undefined, { signal: abort.signal });
}
async function http(slotName, route, options = {}) {
  if (++requests > config.maxRequests)
    throw new Error("Hard HTTP request cap exceeded");
  const slot = config.slots[slotName];
  if (!slot || !["/api/status", "/readyz", "/healthz"].includes(route))
    throw new Error("Non-fixture target rejected");
  const start = performance.now();
  const response = await fetch("http://127.0.0.1:" + slot.port + route, {
    redirect: "error",
    ...options,
    signal: AbortSignal.any([
      abort.signal,
      AbortSignal.timeout(config.requestTimeoutMs),
    ]),
  });
  await response.arrayBuffer();
  return {
    status: response.status,
    durationMs: performance.now() - start,
    policy: response.headers.get("x-ratelimit-policy"),
  };
}
async function ready(name, expected = 200) {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await http(name, "/readyz")).status === expected) return;
    } catch (error) {
      if (abort.signal.aborted) throw error;
    }
    await pause(100);
  }
  throw new Error(
    "Fixture readiness deadline: " + name + " status " + expected,
  );
}
async function epoch(value) {
  await Promise.all(
    children.map(
      (child) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            epochSignals.delete(child.pid);
            reject(new Error("IPC deadline"));
          }, 2000);
          epochSignals.set(child.pid, () => {
            clearTimeout(timer);
            resolve();
          });
          child.send({ type: "epoch", value });
        }),
    ),
  );
  events.push({ type: "namespace", value, atMs: elapsed() });
}
async function send(
  repetition,
  scenario,
  mode,
  slots,
  count,
  phase = "main",
  userFor = () => "single-client",
) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const slot = slots[i % slots.length];
    const result = await http(slot, "/api/status");
    const row = {
      repetition,
      scenario,
      mode,
      phase,
      request: i + 1,
      user: userFor(i),
      slot,
      atMs: elapsed(),
      ...result,
    };
    raw.push(row);
    rows.push(row);
  }
  return rows;
}
function accepted(rows) {
  return rows.filter((row) => row.status === 200).length;
}
async function run() {
  await fs.mkdir(output, { recursive: true });
  const metadata = {
    schema: 1,
    status: "running",
    runId,
    startedAt: new Date().toISOString(),
    config,
    environment: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      osRelease: os.release(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      githubRun: process.env.GITHUB_RUN_ID ?? null,
      githubAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    },
    raw,
    events,
  };
  let failure;
  try {
    metadata.environment.sourceCommit = await command("git", [
      "rev-parse",
      "HEAD",
    ]);
    if (process.env.GITHUB_EVENT_PATH) {
      const event = JSON.parse(
        await fs.readFile(process.env.GITHUB_EVENT_PATH, "utf8"),
      );
      metadata.environment.prHead = event.pull_request?.head.sha ?? null;
    }
    metadata.environment.docker = JSON.parse(
      await command("docker", ["version", "--format", "{{json .Server}}"]),
    );
    metadata.environment.redis = await command("docker", [
      "compose",
      "-f",
      "lab/docker-compose.yml",
      "--profile",
      "all",
      "exec",
      "-T",
      "redis",
      "redis-server",
      "--version",
    ]);
    metadata.environment.images = JSON.parse(
      await command("docker", [
        "compose",
        "-f",
        "lab/docker-compose.yml",
        "--profile",
        "all",
        "images",
        "--format",
        "json",
      ]),
    );
    metadata.environment.packages = {
      express: require("express/package.json").version,
      redis: require("redis/package.json").version,
    };
    for (let rep = 1; rep <= config.repetitions; rep++) {
      // Independent OS processes each repetition; both storage backends use createApp.
      for (const name of Object.keys(config.slots)) {
        const child = fork(path.join(__dirname, "fixture.cjs"), [name], {
          cwd: root,
          env: {
            ...process.env,
            LOCAL_COMPARISON: "1",
            COMPARISON_RUN: runId + ":" + rep,
          },
          stdio: ["ignore", "pipe", "pipe", "ipc"],
        });
        child.stderr.on("data", (data) => process.stderr.write(data));
        child.stdout.resume();
        child.on("message", (message) => {
          if (message.type === "epoch") {
            epochSignals.get(child.pid)?.();
            epochSignals.delete(child.pid);
          }
        });
        children.push(child);
      }
      for (const name of Object.keys(config.slots)) await ready(name);
      events.push({
        repetition: rep,
        type: "processes",
        children: children.map((c) => c.pid),
      });
      // Warm the counted HTTP path, then namespace counters away without restarting.
      for (const name of Object.keys(config.slots))
        await send(rep, "warmup", config.slots[name].group, [name], 2);
      for (const [scenario, count] of [
        ["normal", 4],
        ["excess", 16],
        ["nat", 8],
      ]) {
        await epoch(rep + ":" + scenario);
        for (const [mode, slots] of Object.entries(config.modes)) {
          const rows = await send(
            rep,
            scenario,
            mode,
            slots,
            count,
            "main",
            scenario === "nat" ? (i) => "user-" + (i % 4) : undefined,
          );
          const expected =
            mode === "none"
              ? count
              : mode === "memory-two"
                ? Math.min(count, 12)
                : Math.min(count, 6);
          assert.equal(
            accepted(rows),
            expected,
            scenario + " " + mode + " accepted budget",
          );
        }
      }
      await epoch(rep + ":boundary");
      for (const [mode, slots] of Object.entries(config.modes)) {
        const anchor = performance.now();
        const initial = await send(rep, "boundary", mode, slots, 2, "anchor");
        await pause(config.windowMs - 300 - (performance.now() - anchor));
        const before = await send(rep, "boundary", mode, slots, 10, "before");
        // A delayed runner must fail measurement validity, not fabricate a boundary result.
        assert(
          performance.now() - anchor < config.windowMs - 80,
          "Pre-boundary phase crossed its window",
        );
        await pause(config.windowMs + 150 - (performance.now() - anchor));
        const after = await send(rep, "boundary", mode, slots, 12, "after");
        const expected = mode === "none" || mode === "memory-two" ? 12 : 6;
        assert.equal(accepted([...initial, ...before]), expected);
        assert.equal(accepted(after), expected);
      }
      await epoch(rep + ":outage");
      redisStopped = true;
      const stopStart = elapsed();
      await compose("stop");
      for (const name of ["redis-a", "redis-b", "open-a", "open-b"])
        await ready(name, 503);
      events.push({
        repetition: rep,
        type: "redis-stopped",
        atMs: elapsed(),
        commandMs: elapsed() - stopStart,
      });
      for (const [mode, slots] of Object.entries(config.modes)) {
        const rows = await send(rep, "outage", mode, slots, 2, "down");
        assert(
          rows.every(
            (row) => row.status === (mode === "redis-two" ? 503 : 200),
          ),
        );
      }
      const opened = await send(
        rep,
        "outage",
        "redis-open",
        ["open-a", "open-b"],
        2,
        "down",
      );
      assert(
        opened.every((row) => row.status === 200 && row.policy === "fail-open"),
      );
      const restartAt = elapsed();
      await compose("start");
      redisStopped = false;
      for (const name of ["redis-a", "redis-b", "open-a", "open-b"]) {
        await ready(name);
        events.push({
          repetition: rep,
          type: "recovered",
          slot: name,
          recoveryMs: elapsed() - restartAt,
        });
      }
      for (const [mode, slots] of [
        ...Object.entries(config.modes),
        ["redis-open", ["open-a", "open-b"]],
      ]) {
        const rows = await send(rep, "outage", mode, slots, 2, "recovered");
        assert(rows.every((row) => row.status === 200 && row.policy === null));
      }
      for (const child of [...children]) {
        if (child.connected) child.disconnect();
        await new Promise((resolve, reject) => {
          if (child.exitCode !== null) return resolve();
          const timer = setTimeout(() => {
            child.kill();
            reject(new Error("Fixture exit deadline"));
          }, 2000);
          child.once("exit", () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
      children.length = 0;
    }
    metadata.status = "complete";
  } catch (error) {
    failure = error;
    metadata.status = "failed";
    metadata.error = error.message;
  } finally {
    if (redisStopped) {
      try {
        await compose("start", AbortSignal.timeout(15000));
      } catch (error) {
        metadata.restoreError = error.message;
      }
    }
    for (const child of children) {
      if (child.connected) child.disconnect();
      child.kill();
    }
    metadata.totalHttpRequestsIncludingProbes = requests;
    metadata.elapsedMs = elapsed();
    metadata.finishedAt = new Date().toISOString();
    await fs.writeFile(
      path.join(output, "raw.json"),
      JSON.stringify(metadata, null, 2) + "\n",
    );
    clearTimeout(softTimer);
    clearTimeout(hardTimer);
  }
  if (failure) throw failure;
  console.log(
    "PASS: three warmed independent repetitions; raw data: " +
      path.join(output, "raw.json"),
  );
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
