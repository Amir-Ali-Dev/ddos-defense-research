const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { request, ready, retry, sleep } = require("./helpers.cjs");
const composeArgs = [
  "compose",
  "-f",
  path.resolve(__dirname, "../lab/docker-compose.yml"),
  "--profile",
  "all",
];
function compose(...args) {
  const r = spawnSync("docker", [...composeArgs, ...args], {
    stdio: "inherit",
    timeout: 40000,
  });
  if (r.error || r.status !== 0)
    throw new Error("Compose failed: " + args.join(" "));
}
(async () => {
  for (const port of [8080, 3000, 3001, 3002])
    await ready(
      "http://127.0.0.1:" + port,
      port >= 3001 ? "/readyz" : "/healthz",
    );
  for (const port of [8080, 3000, 3001]) {
    const base = "http://127.0.0.1:" + port;
    assert.equal((await request(base)).status, 200);
    let blocked;
    for (let i = 0; i < 8; i++) {
      const r = await request(base);
      if (r.status === 429) {
        blocked = r;
        break;
      }
      assert.equal(r.status, 200);
    }
    assert(blocked, "Expected bounded budget to be exhausted on " + port);
    retry(blocked);
    const spoof = await request(base, "/api/status", {
      headers: {
        "x-forwarded-for": "198.51.100.1",
        "cf-connecting-ip": "203.0.113.1",
        "x-real-ip": "192.0.2.1",
        "x-api-key": "fresh",
        authorization: "Bearer fresh",
      },
    });
    assert.equal(spoof.status, 429);
    if (port === 3001)
      assert.equal(
        (await request("http://127.0.0.1:3002")).status,
        429,
        "shared Redis counter",
      );
    let loginBlocked = false;
    let loginSuccess = 0;
    for (let i = 0; i < 4; i++) {
      const r = await request(base, "/auth/login", { method: "POST" });
      if (r.status === 429) {
        loginBlocked = true;
        retry(r);
        break;
      }
      assert(r.ok);
      loginSuccess++;
    }
    assert(loginBlocked);
    assert(loginSuccess <= 2, "login has stricter budget");
    await sleep(2300);
    assert.equal((await request(base)).status, 200);
    assert((await request(base, "/auth/login", { method: "POST" })).ok);
  }
  // Actual dependency outage. Always restore it even if an assertion fails.
  try {
    compose("stop", "redis");
    for (const port of [3001, 3002]) {
      const r = await request("http://127.0.0.1:" + port);
      assert.equal(r.status, 503);
      retry(r);
      assert.equal(
        (await request("http://127.0.0.1:" + port, "/readyz")).status,
        503,
      );
    }
  } finally {
    compose("start", "redis");
  }
  for (const port of [3001, 3002])
    await ready("http://127.0.0.1:" + port, "/readyz");
  console.log(
    "PASS: bounded local smoke tests (success, 429, expiry, login, spoofing, shared Redis, real outage/recovery)",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
