const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request } = require("./helpers.cjs");
test(
  "actual Express HTTP resolves trusted/untrusted peers and canonical identities",
  { timeout: 10000 },
  async (t) => {
    const { createApp } = await import("../examples/redis/server.js");
    const groups = [];
    for (const trustedProxies of ["", "192.0.2.99/32", "127.0.0.1/32"]) {
      const seen = [];
      const limiter = {
        ready: true,
        async isAllowed({ identity }) {
          seen.push(identity);
          return { allowed: true, count: 1, ttlMs: 1000, retryAfterSeconds: 1 };
        },
      };
      const server = createApp(limiter, { trustedProxies }).listen(
        0,
        "127.0.0.1",
      );
      await new Promise((r) => server.once("listening", r));
      t.after(() => new Promise((r) => server.close(r)));
      const base = "http://127.0.0.1:" + server.address().port;
      for (const ip of [
        "::ffff:192.0.2.7",
        "2001:db8:1:2::1",
        "2001:0db8:0001:0002::abcd",
      ]) {
        assert.equal(
          (
            await request(base, "/api/status", {
              headers: {
                "x-forwarded-for": ip,
                "x-real-ip": "203.0.113.1",
                "cf-connecting-ip": "203.0.113.2",
                "x-api-key": ip,
              },
            })
          ).status,
          200,
        );
      }
      groups.push(seen);
    }
    assert.deepEqual(groups[0], ["127.0.0.1", "127.0.0.1", "127.0.0.1"]);
    assert.deepEqual(groups[1], groups[0]);
    assert.equal(groups[2][0], "192.0.2.7");
    assert.equal(groups[2][1], groups[2][2]);
    assert.notEqual(groups[2][0], groups[0][0]);
  },
);
