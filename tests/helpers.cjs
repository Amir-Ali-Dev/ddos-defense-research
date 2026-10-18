const assert = require("node:assert/strict");
const net = require("node:net");
const { setTimeout: sleep } = require("node:timers/promises");
async function port() {
  const server = net.createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const value = server.address().port;
  await new Promise((r) => server.close(r));
  return value;
}
async function request(base, path = "/api/status", options = {}) {
  const url = new URL(path, base);
  if (!["127.0.0.1", "[::1]"].includes(url.hostname))
    throw new Error("Tests only allow loopback HTTP targets");
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(2000),
  });
  await response.arrayBuffer();
  return response;
}
async function ready(base, path = "/healthz", attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      if ((await request(base, path)).ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Readiness deadline exceeded: " + base + path);
}
function retry(response) {
  const value = response.headers.get("retry-after");
  assert.match(value ?? "", /^[1-9][0-9]*$/);
  return Number(value);
}
module.exports = { port, request, ready, retry, sleep };
