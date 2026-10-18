// Deliberately no URL, host, rate or repetition CLI/environment override.
module.exports = Object.freeze({
  budget: 6,
  windowMs: 1200,
  repetitions: 3,
  maxRequests: 2400,
  concurrency: 1,
  requestTimeoutMs: 1000,
  softDeadlineMs: 150000,
  hardDeadlineMs: 180000,
  redisUrl: "redis://127.0.0.1:16379",
  slots: {
    none: { port: 3410, group: "none", storage: "none" },
    memory: { port: 3411, group: "memory-one", storage: "memory" },
    "memory-a": { port: 3412, group: "memory-two", storage: "memory" },
    "memory-b": { port: 3413, group: "memory-two", storage: "memory" },
    "redis-a": { port: 3414, group: "redis-two", storage: "redis" },
    "redis-b": { port: 3415, group: "redis-two", storage: "redis" },
    "open-a": {
      port: 3416,
      group: "redis-open",
      storage: "redis",
      failurePolicy: "open",
    },
    "open-b": {
      port: 3417,
      group: "redis-open",
      storage: "redis",
      failurePolicy: "open",
    },
  },
  modes: {
    none: ["none"],
    "memory-one": ["memory"],
    "memory-two": ["memory-a", "memory-b"],
    "redis-two": ["redis-a", "redis-b"],
  },
});
