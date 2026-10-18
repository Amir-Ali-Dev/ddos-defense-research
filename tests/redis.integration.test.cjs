const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, sleep, ready, retry } = require("./helpers.cjs");
test(
  "real Redis: Lua concurrency, TTL repair, shared apps, expiry and readiness",
  { timeout: 20000 },
  async (t) => {
    const url = process.env.REDIS_TEST_URL ?? "redis://127.0.0.1:16379";
    if (!["127.0.0.1", "[::1]"].includes(new URL(url).hostname))
      throw new Error("Only loopback Redis allowed");
    const { createLimiter } =
      await import("../examples/redis/node-redis-example.js");
    const { createApp } = await import("../examples/redis/server.js");
    const prefix = "test:" + process.pid + ":" + Date.now();
    const a = createLimiter({ url, prefix }),
      b = createLimiter({ url, prefix });
    a.start();
    b.start();
    t.after(() => {
      a.close();
      b.close();
    });
    for (let i = 0; i < 50 && !a.ready; i++) await sleep(100);
    assert.equal(
      a.ready,
      true,
      "Redis must be running; integration tests never silently skip",
    );
    for (let i = 0; i < 50 && !b.ready; i++) await sleep(100);
    assert.equal(b.ready, true);
    const input = {
      identity: "192.0.2.1",
      route: "concurrent",
      limit: 4,
      windowMs: 1500,
    };
    const results = await Promise.all(
      Array.from({ length: 16 }, (_, i) => (i % 2 ? a : b).isAllowed(input)),
    );
    assert.equal(results.filter((r) => r.allowed).length, 4);
    assert.deepEqual(
      results.map((r) => r.count).sort((x, y) => x - y),
      Array.from({ length: 16 }, (_, i) => i + 1),
    );
    assert(results.every((r) => r.ttlMs > 0 && r.ttlMs <= 1500));
    const keys = await a.client.keys(prefix + ":concurrent:*");
    assert.equal(keys.length, 1);
    await a.client.persist(keys[0]);
    const repaired = await a.isAllowed(input);
    assert(repaired.ttlMs > 0);
    assert.equal(repaired.allowed, false);
    const servers = [];
    for (const limiter of [a, b]) {
      const server = createApp(limiter, {
        windowMs: 1000,
        publicLimit: 4,
        loginLimit: 2,
      }).listen(0, "127.0.0.1");
      await new Promise((r) => server.once("listening", r));
      servers.push(server);
      t.after(() => new Promise((r) => server.close(r)));
    }
    const bases = servers.map((s) => "http://127.0.0.1:" + s.address().port);
    for (let i = 0; i < 4; i++)
      assert.equal((await request(bases[i % 2])).status, 200);
    const blocked = await request(bases[1]);
    assert.equal(blocked.status, 429);
    retry(blocked);
    const spoof = await request(bases[0], "/api/status", {
      headers: { "x-api-key": "new-key", "x-forwarded-for": "203.0.113.99" },
    });
    assert.equal(spoof.status, 429);
    assert.equal(
      (await request(bases[0], "/auth/login", { method: "POST" })).status,
      200,
    );
    assert.equal(
      (await request(bases[1], "/auth/login", { method: "POST" })).status,
      200,
    );
    assert.equal(
      (await request(bases[0], "/auth/login", { method: "POST" })).status,
      429,
    );
    await sleep(1150);
    assert.equal((await request(bases[1])).status, 200);
    // A wrong-type key becomes a controlled 503, not an unhandled rejection.
    const statusKeys = await a.client.keys(prefix + ":status:*");
    await a.client.del(statusKeys[0]);
    await a.client.lPush(statusKeys[0], "wrongtype");
    assert.equal((await request(bases[0])).status, 503);
    for (let i = 0; i < 30 && !a.ready; i++) await sleep(100);
    const leftovers = await a.client.keys(prefix + ":*");
    if (leftovers.length) await a.client.del(leftovers);
  },
);
