
import { Router } from 'express';
import { mapsController } from '../controllers/mapsController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Allow authenticated users (clients and staff) to calculate
router.post('/calculate', authenticate, mapsController.calculate);

export default router;
