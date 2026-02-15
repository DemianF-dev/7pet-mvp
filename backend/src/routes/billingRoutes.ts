
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import * as billingController from '../controllers/billingController';

const router = Router();

router.use(authenticate);

// Permission Sets
const staffOnly = authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER']);
const adminOnly = authorize(['ADMIN', 'MASTER']);

// Invoice Management
router.post('/invoices/draft', staffOnly, billingController.createDraftInvoice);
router.get('/invoices', staffOnly, billingController.getInvoices);
router.get('/invoices/:id', staffOnly, billingController.getInvoiceById);

// Invoice Lifecycle
router.post('/invoices/:id/issue', staffOnly, billingController.issueInvoice);
router.post('/invoices/:id/void', adminOnly, billingController.voidInvoice);
router.post('/invoices/:id/credit-note', adminOnly, billingController.createCreditNote);

// Financial / Ledger
router.post('/payments', staffOnly, billingController.createPayment);
router.get('/ledger', adminOnly, billingController.getLedger);

export default router;
