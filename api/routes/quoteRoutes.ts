import { Router } from 'express';
import { quoteLimiter, transportLimiter } from '../utils/rateLimiters';
import { quoteController } from '../controllers/quoteController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', quoteLimiter, quoteController.create);
router.get('/', quoteController.list);
router.get('/trash', quoteController.listTrash);
router.post('/bulk-delete', quoteController.bulkDelete);
router.get('/:id', quoteController.get);
router.post('/:id/duplicate', quoteController.duplicate);
router.patch('/:id', quoteController.update);
router.put('/:id', quoteController.update); // Alias for PATCH
router.patch('/:id/status', quoteController.updateStatus);
router.delete('/:id', quoteController.remove);
router.post('/:id/restore', quoteController.restore);
router.delete('/:id/permanent', quoteController.permanentRemove);

// Cascading delete routes
router.get('/:id/dependencies', quoteController.checkDependencies);
router.post('/:id/cascade-delete', quoteController.cascadeDelete);
router.post('/:id/calculate-transport', transportLimiter, quoteController.calculateTransport);
router.post('/transport/calculate', transportLimiter, quoteController.calculateTransportDetailed); // Dedicated transport pricing
router.post('/manual', quoteController.createManual);
router.post('/:id/approve-and-schedule', quoteController.approveAndSchedule);

export default router;
