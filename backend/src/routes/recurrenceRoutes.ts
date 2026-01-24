import { Router } from 'express';
import recurrenceController from '../controllers/recurrenceController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// All recurrence routes are for staff only
const staffRoles = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'COMERCIAL'];

router.use(authenticate);
router.use(authorize(staffRoles));

// Contracts
router.get('/contracts', recurrenceController.listContracts);
router.post('/contracts', recurrenceController.createContract);
router.get('/contracts/:id', recurrenceController.getContract);

// Invoices / Packaging
router.get('/invoices/eligible-appointments', recurrenceController.listEligibleAppointments);
router.get('/invoices/:id', recurrenceController.getInvoice);
router.post('/invoices', recurrenceController.createInvoice);
router.post('/invoices/:id/copy', recurrenceController.copyInvoice);
router.patch('/invoices/:id/emit', recurrenceController.emitInvoice);

export default router;
