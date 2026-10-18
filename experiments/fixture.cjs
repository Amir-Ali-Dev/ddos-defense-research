// Fork-only, loopback-only laboratory fixture; never a production entrypoint.
const config = require("./config.cjs");
const slot = config.slots[process.argv[2]];
if (!process.send || !slot || process.env.LOCAL_COMPARISON !== "1")
  throw new Error("Use the bounded comparison controller");
(async () => {
  const { createApp } = await import("../examples/redis/server.js");
  const { createMemoryLimiter } =
    await import("../examples/redis/memory-limiter.js");
  const { createLimiter } =
    await import("../examples/redis/node-redis-example.js");
  const storage =
    slot.storage === "redis"
      ? createLimiter({
          url: config.redisUrl,
          prefix: "comparison:" + process.env.COMPARISON_RUN,
        })
      : createMemoryLimiter();
  if (storage.start) storage.start();
  let epoch = "warmup";
  const limiter = {
    get ready() {
      return storage.ready;
    },
    isAllowed(input) {
      return storage.isAllowed({
        ...input,
        route: epoch + ":" + slot.group + ":" + input.route,
      });
    },
  };
  const app = createApp(limiter, {
    windowMs: config.windowMs,
    publicLimit: config.budget,
    loginLimit: 2,
    failurePolicy: slot.failurePolicy ?? "closed",
    labUnrestricted: slot.storage === "none",
  });
  const server = app.listen(slot.port, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  process.send({ type: "started", pid: process.pid, port: slot.port });
  process.on("message", (message) => {
    if (message.type === "epoch" && typeof message.value === "string") {
      epoch = message.value;
      process.send({ type: "epoch", value: epoch });
    }
  });
  const close = () => {
    storage.close?.();
    server.close();
    process.disconnect?.();
  };
  process.once("SIGTERM", close);
  process.once("disconnect", () => {
    storage.close?.();
    server.close();
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
