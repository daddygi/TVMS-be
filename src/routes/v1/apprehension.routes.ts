import { Router } from 'express';
import multer from 'multer';
import { importApprehensions } from '../../controllers/apprehension.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/import', upload.single('file'), importApprehensions);

export default router;
