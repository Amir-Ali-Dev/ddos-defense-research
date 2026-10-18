/** Conceptual metadata example only. Not installed in AppModule and never used
 * by ThrottlerGuard. v1 enforces request counts per route, not weighted costs.
 * A real cost limiter must atomically debit a validated server-side budget.
 */
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
@Injectable()
export class RouteCostMiddleware implements NestMiddleware {
  use(
    req: Request & { ddosCost?: number },
    _res: Response,
    next: NextFunction,
  ) {
    req.ddosCost = [
      "/auth/login",
      "/reports/export",
      "/search",
      "/upload",
    ].includes(req.path)
      ? 5
      : 1;
    next();
  }
}
