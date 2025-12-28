import { Router } from 'express';
import * as petController from '../controllers/petController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', petController.list);
router.post('/', petController.create);
router.get('/:id', petController.get);
router.patch('/:id', petController.update);
router.delete('/:id', petController.remove);

export default router;
