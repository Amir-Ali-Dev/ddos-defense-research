import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { ProxyAwareThrottlerGuard } from "./proxy-aware-throttler.guard";
const { integerEnv } = require("../../shared/network.cjs");
const ttl = integerEnv("WINDOW_MS", 10000, 100, 60000);

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl,
        blockDuration: ttl,
        limit: integerEnv("PUBLIC_LIMIT", 6, 1, 1000),
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [{ provide: APP_GUARD, useClass: ProxyAwareThrottlerGuard }],
})
export class AppModule {}
