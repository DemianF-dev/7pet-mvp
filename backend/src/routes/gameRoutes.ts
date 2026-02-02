import { Router } from 'express';
import * as gameController from '../controllers/gameController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Public routes (none for now, games require auth)

// Protected routes
router.use(authenticate);

router.get('/', gameController.listGames);
router.post('/session/start', gameController.startGameSession);
router.post('/session/end', gameController.endGameSession);
router.get('/leaderboard', gameController.getLeaderboard);
router.get('/stats', gameController.getUserStats);

export default router;
