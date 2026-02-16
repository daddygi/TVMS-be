import { Router } from 'express';
import multer from 'multer';
import {
  importApprehensions,
  listApprehensions,
  getApprehension,
  getStatsController,
  createApprehensionController,
  bulkCreateController,
  updateApprehensionController,
  deleteApprehensionController,
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
  '/stats',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.APPREHENSION_STATS, ttl: CACHE_TTL.STATS }),
  getStatsController
);

router.get(
  '/:id',
  cacheMiddleware({ keyPrefix: CACHE_KEYS.APPREHENSION_DETAIL, ttl: CACHE_TTL.DETAIL }),
  getApprehension
);

router.post('/', createApprehensionController);
router.post('/bulk', bulkCreateController);
router.post('/import', upload.single('file'), importApprehensions);

router.patch('/:id', updateApprehensionController);

router.delete('/:id', deleteApprehensionController);

export default router;
