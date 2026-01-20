import { Router } from 'express';
import { staffController } from '../controllers/staffController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'COMERCIAL', 'SPA']));

router.get('/metrics', staffController.getDashboardMetrics);
router.get('/widgets', staffController.getFeedWidgets);
router.get('/transports', staffController.listTransports);
router.get('/transports/:id', staffController.getTransportDetails);
router.patch('/transports/:id/status', staffController.updateTransportStatus);
router.post('/transports/:id/occurrences', staffController.logTransportOccurrence);

export default router;
