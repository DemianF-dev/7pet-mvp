import { Router, Request, Response } from 'express';
import { customerController } from '../controllers/customerController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/me', customerController.getMe);

// Restrict these routes to staff only
const staffOnly = authorize(['OPERACIONAL', 'GESTAO', 'ADMIN']);

router.get('/', staffOnly, customerController.list);
router.get('/:id', staffOnly, customerController.get);
router.post('/', staffOnly, customerController.create);
router.patch('/:id', staffOnly, customerController.update);
router.delete('/:id', staffOnly, customerController.delete);
router.post('/bulk-delete', staffOnly, customerController.bulkDelete);
router.post('/:id/pets', staffOnly, customerController.createPet);

export default router;
