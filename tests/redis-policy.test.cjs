const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, retry } = require("./helpers.cjs");
test("Redis HTTP policy: errors are 503 closed or explicit fail-open, not 429", async (t) => {
  const { createApp } = await import("../examples/redis/server.js");
  for (const policy of ["closed", "open"]) {
    const limiter = {
      ready: false,
      isAllowed: async () => {
        throw new Error("dependency down");
      },
    };
    const server = createApp(limiter, { failurePolicy: policy }).listen(
      0,
      "127.0.0.1",
    );
    await new Promise((r) => server.once("listening", r));
    t.after(() => new Promise((r) => server.close(r)));
    const base = "http://127.0.0.1:" + server.address().port;
    const res = await request(base);
    assert.equal(res.status, policy === "closed" ? 503 : 200);
    assert.equal(res.headers.get("x-ratelimit-policy"), "fail-" + policy);
    assert.equal(res.headers.get("x-ratelimit-remaining"), null);
    if (policy === "closed") retry(res);
    assert.equal((await request(base, "/readyz")).status, 503);
  }
});
test("Redis identity and headers: arbitrary keys cannot supply authenticated identity", async (t) => {
  const { createApp } = await import("../examples/redis/server.js");
  const identities = [];
  const limiter = {
    ready: true,
    isAllowed: async (input) => {
      identities.push(input.identity);
      return {
        allowed: identities.length <= 1,
        count: identities.length,
        ttlMs: 900,
        retryAfterSeconds: 1,
      };
    },
  };
  const server = createApp(limiter, { publicLimit: 1 }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = "http://127.0.0.1:" + server.address().port;
  assert.equal(
    (await request(base, "/api/status", { headers: { "x-api-key": "a" } }))
      .status,
    200,
  );
  const res = await request(base, "/api/status", {
    headers: {
      "x-api-key": "b",
      "x-forwarded-for": "198.51.100.1",
      "cf-connecting-ip": "203.0.113.2",
      "x-real-ip": "192.0.2.1",
    },
  });
  assert.equal(res.status, 429);
  retry(res);
  assert.equal(res.headers.get("x-ratelimit-remaining"), "0");
  assert.equal(identities[0], identities[1]);
});
