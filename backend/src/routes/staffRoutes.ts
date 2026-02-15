import { Router } from 'express';
import { staffController } from '../controllers/staffController';
import * as payrollController from '../controllers/payrollController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'COMERCIAL', 'SPA', 'LOGISTICA']));

router.get('/metrics', staffController.getDashboardMetrics);
router.get('/me/profile', staffController.getMyProfile);
router.get('/widgets', staffController.getFeedWidgets);
router.get('/transports', staffController.listTransports);
router.get('/transports/:id', staffController.getTransportDetails);
router.patch('/transports/:id/status', staffController.updateTransportStatus);
router.post('/transports/:id/occurrences', staffController.logTransportOccurrence);

// Payroll Routes
router.get('/:staffId/payroll/preview', payrollController.getPayrollPreview);
router.get('/:staffId/payroll/history', payrollController.getHistory);
router.post('/payroll/close', payrollController.closePayrollPeriod);

export default router;
