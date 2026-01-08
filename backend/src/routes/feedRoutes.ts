import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as FeedController from '../controllers/feedController';

const router = Router();

// Protect all feed routes
router.use(authenticateToken);

router.get('/', FeedController.getFeed);
router.post('/', FeedController.createPost);
router.post('/:id/comment', FeedController.addComment);
router.post('/:id/react', FeedController.toggleReaction);

export default router;
