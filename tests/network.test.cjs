const { test } = require("node:test");
const assert = require("node:assert/strict");
const proxyaddr = require("proxy-addr");
const {
  trustProxy,
  clientIdentity,
} = require("../examples/shared/network.cjs");
function identity(socket, xff, trust = "") {
  const req = {
    socket: { remoteAddress: socket },
    headers: { "x-forwarded-for": xff },
  };
  req.ip = proxyaddr(req, trustProxy(trust) || (() => false));
  return clientIdentity(req);
}
test("untrusted direct socket ignores spoofed XFF", () => {
  assert.equal(identity("192.0.2.8", "203.0.113.8"), "192.0.2.8");
});
test("explicit proxy chain stops at first untrusted hop", () => {
  assert.equal(
    identity(
      "10.0.0.2",
      "198.51.100.5, 192.0.2.7, 10.0.0.3",
      "10.0.0.2/32,10.0.0.3/32",
    ),
    "192.0.2.7",
  );
  assert.equal(
    identity("192.0.2.8", "198.51.100.8", "10.0.0.0/24"),
    "192.0.2.8",
  );
});
test("IPv4 mapped IPv6 and IPv6 /64 are canonical identities", () => {
  assert.equal(identity("::ffff:192.0.2.8", ""), "192.0.2.8");
  assert.equal(
    identity("2001:db8:1:2::1", ""),
    identity("2001:0db8:0001:0002::abcd", ""),
  );
  assert.notEqual(
    identity("2001:db8:1:2::1", ""),
    identity("2001:db8:1:3::1", ""),
  );
  assert.equal(
    identity("::1", "2001:db8::5", "::1/128"),
    "2001:db8:0:0:0:0:0:0/64",
  );
});
test("malformed identity and ambiguous trust configurations fail", () => {
  assert.throws(() => clientIdentity({ ip: "not-an-ip" }));
  for (const value of [
    "true",
    "1",
    "loopback",
    ",",
    "10.0.0.0/99",
    "10.0.0.0/24junk",
    "10.0.0.0/24/8",
  ])
    assert.throws(() => trustProxy(value));
});
