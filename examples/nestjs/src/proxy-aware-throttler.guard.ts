import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const http = context.switchToHttp();
    return {
      req: http.getRequest(),
      res: http.getResponse(),
    };
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const cfConnectingIp = req.headers?.['cf-connecting-ip'];
    const realIp = req.headers?.['x-real-ip'];
    const forwardedFor = req.headers?.['x-forwarded-for'];

    const raw =
      cfConnectingIp ??
      realIp ??
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ??
      req.ip ??
      req.socket?.remoteAddress ??
      'unknown';

    return String(raw).split(',')[0].trim();
  }
}

