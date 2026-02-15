
import { Router } from 'express';
import { schedulingController } from '../controllers/schedulingController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();
const staffOnly = authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER']);

router.use(authenticate);

router.post('/plans/from-quote/:quoteId', staffOnly, schedulingController.createPlanFromQuote);
router.get('/plans/:planId', staffOnly, schedulingController.getPlanDetails);
router.patch('/plans/:planId/appointments/bulk', staffOnly, schedulingController.bulkUpdateAppointments);
router.post('/plans/:planId/confirm', staffOnly, schedulingController.confirmPlan);

export default router;
