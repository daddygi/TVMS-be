import { Router } from 'express';
import {
  loginUser,
  refreshToken,
  logoutUser,
} from '../../controllers/auth.controller';

const router = Router();

router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);

export default router;
