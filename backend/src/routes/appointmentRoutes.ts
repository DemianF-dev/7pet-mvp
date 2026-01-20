import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Specific paths first
router.get('/trash', appointmentController.listTrash);
router.get('/', appointmentController.list);
router.post('/', appointmentController.create);
router.post('/bulk-delete', appointmentController.bulkDelete);
router.post('/bulk-restore', appointmentController.bulkRestore);
router.post('/bulk-permanent', appointmentController.bulkPermanentRemove);


// ID paths
router.get('/:id', appointmentController.get);
router.post('/:id/duplicate', appointmentController.duplicate);
router.patch('/:id/status', appointmentController.updateStatus);
router.patch('/:id/restore', appointmentController.restore);
router.delete('/:id/permanent', appointmentController.permanentRemove);
router.delete('/:id', appointmentController.remove);
router.patch('/:id', appointmentController.update);

export default router;
