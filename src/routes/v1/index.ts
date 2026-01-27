import { Router } from 'express';
import apprehensionRoutes from './apprehension.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/apprehensions', apprehensionRoutes);

export default router;
