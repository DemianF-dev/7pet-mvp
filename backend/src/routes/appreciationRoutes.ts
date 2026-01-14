import { Router } from 'express';
import * as appreciationController from '../controllers/appreciationController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate as any, appreciationController.create);
router.get('/user/:userId', authenticate as any, appreciationController.getByUser);

export default router;
