const proxyaddr = require("proxy-addr");
const ipaddr = require("ipaddr.js");
const { isIP } = require("node:net");

function trustProxy(value = "") {
  if (!value.trim()) return false;
  const ranges = value.split(",").map((value) => value.trim());
  for (const range of ranges) {
    // No boolean, hop count, or implicit private-network trust.
    if (
      !range ||
      !(range.includes("/") ? validCidr(range) : isIP(range) !== 0)
    ) {
      throw new Error("TRUSTED_PROXIES must be explicit IPs or CIDRs");
    }
  }
  return proxyaddr.compile(ranges);
}
function validCidr(value) {
  try {
    const [address] = value.split("/");
    if (!isIP(address)) return false;
    ipaddr.parseCIDR(value);
    return true;
  } catch {
    return false;
  }
}
function clientIdentity(req) {
  // Express computes req.ip from the socket, walking XFF right-to-left only
  // through the explicitly trusted proxies. Never read vendor headers here.
  const address = req.ip || req.socket?.remoteAddress;
  if (!address || !isIP(address)) throw new Error("Invalid client IP");
  const parsed = ipaddr.process(address);
  if (parsed.kind() === "ipv4") return parsed.toString();
  // Aggregate IPv6 by /64 so rotating interface identifiers is not a new budget.
  const bytes = parsed.toByteArray();
  bytes.fill(0, 8);
  return ipaddr.fromByteArray(bytes).toNormalizedString() + "/64";
}
function integerEnv(name, fallback, min = 1, max = 3600000) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(name + " is out of range");
  }
  return value;
}
module.exports = { trustProxy, clientIdentity, integerEnv };
