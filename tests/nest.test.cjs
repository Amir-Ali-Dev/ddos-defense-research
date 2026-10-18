const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const { port, request, ready, retry, sleep } = require("./helpers.cjs");
test(
  "Nest real HTTP: stricter login, 429, spoof resistance and recovery",
  { timeout: 15000 },
  async (t) => {
    const p = await port();
    const base = "http://127.0.0.1:" + p;
    const child = spawn(
      process.execPath,
      [path.resolve(__dirname, "../examples/nestjs/dist/main.js")],
      {
        env: {
          ...process.env,
          PORT: String(p),
          HOST: "127.0.0.1",
          WINDOW_MS: "2000",
          PUBLIC_LIMIT: "6",
          LOGIN_LIMIT: "2",
          TRUSTED_PROXIES: "",
        },
        stdio: "pipe",
      },
    );
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    t.after(async () => {
      child.kill();
      await new Promise((r) => {
        if (child.exitCode !== null) return r();
        child.once("exit", r);
      });
    });
    try {
      await ready(base);
    } catch (error) {
      throw new Error(error.message + " " + output);
    }
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await request(base, "/auth/login", { method: "POST" })).status,
        201,
      );
    const login = await request(base, "/auth/login", { method: "POST" });
    assert.equal(login.status, 429);
    retry(login);
    for (let i = 0; i < 6; i++) assert.equal((await request(base)).status, 200);
    for (let i = 0; i < 3; i++) {
      const response = await request(base, "/api/status", {
        headers: {
          "cf-connecting-ip": "198.51.100." + (i + 1),
          "x-real-ip": "203.0.113." + (i + 1),
          "x-forwarded-for": "192.0.2." + (i + 1),
          "x-api-key": "unverified-" + i,
        },
      });
      assert.equal(response.status, 429);
      retry(response);
    }
    await sleep(2150);
    assert.equal((await request(base)).status, 200);
    assert.equal(
      (await request(base, "/auth/login", { method: "POST" })).status,
      201,
    );
  },
);
