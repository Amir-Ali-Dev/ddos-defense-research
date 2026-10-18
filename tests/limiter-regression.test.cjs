const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

function fakeClient() {
  const client = new EventEmitter();
  client.isOpen = client.isReady = false;
  client.connects = 0;
  client.connect = async () => {
    client.connects++;
    client.isOpen = client.isReady = true;
  };
  client.destroy = () => {
    client.isOpen = client.isReady = false;
  };
  return client;
}
const input = {
  identity: "127.0.0.1",
  route: "status",
  limit: 2,
  windowMs: 1000,
};
test("Redis close is terminal even when an in-flight command fails", async () => {
  const { createLimiter } =
    await import("../examples/redis/node-redis-example.js");
  const client = fakeClient();
  let reject;
  client.eval = () =>
    new Promise((_, fail) => {
      reject = fail;
    });
  const limiter = createLimiter({ clientFactory: () => client });
  limiter.start();
  await new Promise(setImmediate);
  const pending = limiter.isAllowed(input);
  limiter.close();
  reject(new Error("Socket closed"));
  await assert.rejects(pending);
  limiter.start();
  await new Promise(setImmediate);
  assert.equal(client.connects, 1);
  assert.equal(client.isOpen, false);
});
test("overlapping command timeouts reset only one connection generation", async () => {
  const { createLimiter } =
    await import("../examples/redis/node-redis-example.js");
  const client = fakeClient();
  client.eval = () => new Promise(() => {});
  const limiter = createLimiter({ timeoutMs: 30, clientFactory: () => client });
  limiter.start();
  await new Promise(setImmediate);
  const results = await Promise.allSettled([
    limiter.isAllowed(input),
    limiter.isAllowed(input),
  ]);
  assert(results.every((r) => r.status === "rejected"));
  await new Promise(setImmediate);
  assert.equal(client.connects, 2);
  limiter.close();
});
test("memory fixed window: exact boundary, no rejected-request extension and bounded identities", async () => {
  const { createMemoryLimiter } =
    await import("../examples/redis/memory-limiter.js");
  let time = 1000;
  const limiter = createMemoryLimiter({ now: () => time, maxKeys: 1 });
  assert.equal((await limiter.isAllowed(input)).allowed, true);
  time = 1999;
  assert.equal((await limiter.isAllowed(input)).allowed, true);
  const denied = await limiter.isAllowed(input);
  assert.equal(denied.allowed, false);
  assert.equal(denied.ttlMs, 1);
  await assert.rejects(
    limiter.isAllowed({ ...input, identity: "other" }),
    /capacity/,
  );
  time = 2000;
  const next = await limiter.isAllowed(input);
  assert.equal(next.count, 1);
  assert.equal(next.ttlMs, 1000);
});
