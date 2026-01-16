
import { Router } from 'express';
import { auditController } from '../controllers/auditController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Cliente Timeline - Access for all staff
router.get('/clients/:clientId/audit', authenticate, auditController.getClientAudit);

// Admin Console - Access for MASTER/ADMIN only
router.get('/admin/audit', authenticate, authorize(['MASTER', 'ADMIN']), auditController.getAdminAudit);

// Reversion - Access for MASTER/ADMIN only
router.post('/admin/audit/:eventId/revert', authenticate, authorize(['MASTER', 'ADMIN']), auditController.revert);

export default router;
