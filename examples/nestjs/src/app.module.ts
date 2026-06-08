import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { ProxyAwareThrottlerGuard } from './proxy-aware-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ProxyAwareThrottlerGuard,
    },
  ],
})
export class AppModule {}

