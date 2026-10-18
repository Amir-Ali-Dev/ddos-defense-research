import { Controller, Get, Post } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
const { integerEnv } = require("../../shared/network.cjs");
const ttl = integerEnv("WINDOW_MS", 10000, 100, 60000);

@Controller()
export class AuthController {
  @Get("healthz")
  @SkipThrottle()
  health() {
    return { ok: true };
  }

  @Get("api/status")
  status() {
    return { ok: true, service: "nestjs", storage: "process-local" };
  }

  @Post("auth/login")
  @Throttle({
    default: {
      ttl,
      limit: integerEnv("LOGIN_LIMIT", 2, 1, 1000),
      blockDuration: ttl,
    },
  })
  login() {
    return {
      ok: true,
      note: "Rate-limit demonstration; no authentication is performed",
    };
  }
}
