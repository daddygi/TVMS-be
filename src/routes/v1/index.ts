import { Router } from 'express';
import authRoutes from './auth.routes';
import apprehensionRoutes from './apprehension.routes';
import analyticsRoutes from './analytics.routes';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/apprehensions', authenticate, apprehensionRoutes);
router.use('/analytics', authenticate, analyticsRoutes);

export default router;
