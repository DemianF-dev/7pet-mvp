import { Router, Request, Response } from 'express';
import { customerController } from '../controllers/customerController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/me', customerController.getMe);
router.post('/request-recurrence', customerController.requestRecurrence);

// Restrict these routes to staff only
const staffOnly = authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'COMERCIAL']);

router.get('/search', staffOnly, customerController.search);
router.get('/', staffOnly, customerController.list);
router.get('/:id', staffOnly, customerController.get);
router.post('/', staffOnly, customerController.create);
router.patch('/:id', staffOnly, customerController.update);
router.delete('/:id', staffOnly, customerController.delete);
router.post('/bulk-delete', staffOnly, customerController.bulkDelete);
// Trash system routes
router.get('/trash', staffOnly, customerController.listTrash);
router.post('/bulk-restore', staffOnly, customerController.bulkRestore);
router.patch('/:id/restore', staffOnly, customerController.restore);
router.delete('/:id/permanent', staffOnly, customerController.permanentRemove);
router.post('/:id/pets', staffOnly, customerController.createPet);
router.patch('/pets/:petId', staffOnly, customerController.updatePet);
router.delete('/pets/:petId', staffOnly, customerController.deletePet);

// Financial Transactions Routes
router.post('/:id/transactions', staffOnly, customerController.createTransaction);
router.get('/:id/transactions', staffOnly, customerController.listTransactions);
router.post('/:id/sync-balance', staffOnly, customerController.syncBalance);

// Customer Alerts Routes
router.post('/:id/alerts', staffOnly, customerController.createAlert);
router.get('/:id/alerts', staffOnly, customerController.listAlerts);
router.patch('/alerts/:alertId/resolve', staffOnly, customerController.resolveAlert);
router.delete('/alerts/:alertId', staffOnly, customerController.deleteAlert);

export default router;
