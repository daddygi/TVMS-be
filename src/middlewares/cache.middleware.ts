import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../services/cache.service';

interface CacheMiddlewareOptions {
  keyPrefix: string;
  ttl: number;
}

export const cacheMiddleware = (options: CacheMiddlewareOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const cacheKey = `${options.keyPrefix}:${req.originalUrl}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      cacheSet(cacheKey, body, options.ttl);
      return originalJson(body);
    };

    next();
  };
};
