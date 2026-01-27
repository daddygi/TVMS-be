import { Router } from 'express';
import multer from 'multer';
import {
  importApprehensions,
  listApprehensions,
  getApprehension,
} from '../../controllers/apprehension.controller';
import { cacheMiddleware } from '../../middlewares/cache.middleware';
import { CACHE_KEYS, CACHE_TTL } from '../../types/cache.types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get(
  '/',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.APPREHENSION_LIST, ttl: CACHE_TTL.LIST }),
  listApprehensions
);

router.get(
  '/:id',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.APPREHENSION_DETAIL, ttl: CACHE_TTL.DETAIL }),
  getApprehension
);

router.post('/import', upload.single('file'), importApprehensions);

export default router;
