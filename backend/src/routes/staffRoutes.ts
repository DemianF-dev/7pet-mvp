import { Router } from 'express';
import { staffController } from '../controllers/staffController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN']));

router.get('/metrics', staffController.getDashboardMetrics);
router.get('/transports', staffController.listTransports);

export default router;
