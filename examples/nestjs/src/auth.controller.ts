import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  login(@Body() body: { email?: string }) {
    return {
      ok: true,
      message: 'Login handler placeholder',
      subject: body.email ?? 'anonymous',
    };
  }
}

