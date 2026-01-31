import { Router } from 'express';
import {
  getTrendsController,
  getDistributionsController,
  getTimePatternsController,
  getSummaryController,
} from '../../controllers/analytics.controller';
import { cacheMiddleware } from '../../middlewares/cache.middleware';
import { CACHE_KEYS, CACHE_TTL } from '../../types/cache.types';

const router = Router();

router.get(
  '/trends',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.ANALYTICS_TRENDS, ttl: CACHE_TTL.STATS }),
  getTrendsController
);

router.get(
  '/distributions',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.ANALYTICS_DISTRIBUTIONS, ttl: CACHE_TTL.STATS }),
  getDistributionsController
);

router.get(
  '/time-patterns',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.ANALYTICS_TIME_PATTERNS, ttl: CACHE_TTL.STATS }),
  getTimePatternsController
);

router.get(
  '/summary',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.ANALYTICS_SUMMARY, ttl: CACHE_TTL.STATS }),
  getSummaryController
);

export default router;
