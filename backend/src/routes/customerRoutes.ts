import { Router, Request, Response } from 'express';
import { customerController } from '../controllers/customerController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/me', customerController.getMe);
router.post('/request-recurrence', customerController.requestRecurrence);

// Restrict these routes to staff only
const staffOnly = authorize(['OPERACIONAL', 'GESTAO', 'ADMIN']);

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
router.post('/:id/pets', staffOnly, customerController.createPet)

    ;

export default router;
