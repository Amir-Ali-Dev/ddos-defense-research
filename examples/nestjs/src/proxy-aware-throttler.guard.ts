import { BadRequestException, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
const { clientIdentity } = require("../../shared/network.cjs");

@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    try {
      return clientIdentity(req);
    } catch {
      throw new BadRequestException("Invalid client address");
    }
  }
}
