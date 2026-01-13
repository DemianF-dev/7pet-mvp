import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as ChatController from '../controllers/chatController';

const router = Router();

// Protect all chat routes
router.use(authenticate);

router.get('/conversations', ChatController.getConversations);
router.post('/conversations', ChatController.createConversation);
router.get('/:id/messages', ChatController.getMessages);
router.post('/:id/messages', ChatController.sendMessage);
router.post('/:id/attention', ChatController.sendAttention);
router.post('/:id/read', ChatController.markAsRead);
router.delete('/:id', ChatController.deleteConversation);
router.post('/:id/participants', ChatController.addParticipant);
router.post('/:id/transfer', ChatController.transferConversation);
router.get('/agents', ChatController.getSupportAgents);
router.get('/users', ChatController.searchUsers);

export default router;
