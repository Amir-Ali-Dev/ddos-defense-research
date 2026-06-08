import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const EXPENSIVE_PATHS = [
  '/auth/login',
  '/reports/export',
  '/search',
  '/upload',
];

@Injectable()
export class RouteCostMiddleware implements NestMiddleware {
  use(req: Request & { ddosCost?: number }, _res: Response, next: NextFunction) {
    req.ddosCost = EXPENSIVE_PATHS.some((path) => req.path.startsWith(path)) ? 5 : 1;
    next();
  }
}
