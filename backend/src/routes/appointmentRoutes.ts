import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Anyone with basic staff access can view appointments
router.use(authenticate);

// Specific paths first
router.get('/trash', appointmentController.listTrash);
router.get('/', appointmentController.list);
router.post('/', appointmentController.create);
router.post('/bulk-delete', appointmentController.bulkDelete);
router.post('/bulk-restore', appointmentController.bulkRestore);
router.post('/bulk-permanent', appointmentController.bulkPermanentRemove);

// New Agenda Routes
router.get('/day', appointmentController.getDay);
router.get('/week', appointmentController.getWeek);
router.get('/conflicts', appointmentController.getConflicts);
router.get('/search', appointmentController.search);


// ID paths
router.get('/:id', appointmentController.get);
router.post('/:id/duplicate', appointmentController.duplicate);
router.patch('/:id/status', appointmentController.updateStatus);
router.patch('/:id/services/add', appointmentController.addService); // Novo
router.patch('/:id/services/remove', appointmentController.removeService); // Novo
router.patch('/:id/restore', appointmentController.restore);
router.delete('/:id/permanent', appointmentController.permanentRemove);
router.delete('/:id', appointmentController.remove);
router.patch('/:id', appointmentController.update);

export default router;
