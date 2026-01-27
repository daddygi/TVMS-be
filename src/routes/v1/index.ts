import { Router } from 'express';
import authRoutes from './auth.routes';
import apprehensionRoutes from './apprehension.routes';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/apprehensions', authenticate, apprehensionRoutes);

export default router;
