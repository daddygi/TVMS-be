import { Router } from 'express';
import {
  listUsers,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser,
} from '../../controllers/user.controller';

const router = Router();

router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createNewUser);
router.patch('/:id', updateExistingUser);
router.delete('/:id', deleteExistingUser);

export default router;
