import { Router } from 'express';
import { quoteLimiter, transportLimiter } from '../utils/rateLimiters';
import { quoteController } from '../controllers/quoteController';
import { quoteTransportController } from '../controllers/quoteTransportController';
import { quoteTrashController } from '../controllers/quoteTrashController';
import { quotePresetController } from '../controllers/quotePresetController';
import { quoteWorkflowController } from '../controllers/quoteWorkflowController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Core CRUD
router.post('/', quoteLimiter, quoteController.create);
router.get('/', quoteController.list);
router.get('/recurring', quoteController.listRecurring);
router.get('/:id', quoteController.get);
router.post('/:id/duplicate', quoteController.duplicate);
router.patch('/:id', quoteController.update);
router.put('/:id', quoteController.update); // Alias for PATCH
router.patch('/:id/status', quoteController.updateStatus);
router.post('/manual', quoteController.createManual);

// Trash & Lifecycle
router.get('/trash', quoteTrashController.listTrash);
router.post('/bulk-delete', quoteTrashController.bulkDelete);
router.delete('/:id', quoteTrashController.remove);
router.post('/:id/restore', quoteTrashController.restore);
router.delete('/:id/permanent', quoteTrashController.permanentRemove);
router.get('/:id/dependencies', quoteTrashController.checkDependencies);
router.post('/:id/cascade-delete', quoteTrashController.cascadeDelete);

// Transport
router.post('/:id/calculate-transport', transportLimiter, quoteTransportController.calculateTransport);
router.post('/transport/calculate', transportLimiter, quoteTransportController.calculateTransportDetailed);
router.post('/transport/estimate', quoteTransportController.calculateTransportEstimate);

// Transport Presets
router.post('/transport/presets', quotePresetController.createPreset);
router.get('/transport/presets', quotePresetController.listPresets);
router.delete('/transport/presets/:id', quotePresetController.deletePreset);

// Workflow (Scheduling)
router.post('/:id/schedule', quoteWorkflowController.schedule);
router.post('/:id/approve-and-schedule', quoteWorkflowController.approveAndSchedule);
router.post('/:id/undo-schedule', quoteWorkflowController.undoSchedule);

export default router;
