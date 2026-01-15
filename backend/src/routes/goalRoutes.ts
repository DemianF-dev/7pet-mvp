import { Router } from 'express';
import * as goalController from '../controllers/goalController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.patch('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.patch('/:id/progress', goalController.updateProgress);

export default router;
