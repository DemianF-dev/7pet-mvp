import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as ChatController from '../controllers/chatController';

const router = Router();

// Protect all chat routes
router.use(authenticateToken);

router.get('/conversations', ChatController.getConversations);
router.post('/conversations', ChatController.createConversation);
router.get('/:id/messages', ChatController.getMessages);
router.post('/:id/messages', ChatController.sendMessage);

export default router;
