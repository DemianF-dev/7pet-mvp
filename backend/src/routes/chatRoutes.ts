import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as ChatController from '../controllers/chatController';
import * as UploadController from '../controllers/uploadController';
import { debugChatUsers } from '../debug/debugChatUsers';

const router = Router();

// Protect all chat routes
router.use(authenticate);

router.get('/conversations', ChatController.getConversations);
router.post('/conversations', ChatController.createConversation);
router.get('/:id', ChatController.getConversation);
router.get('/:id/messages', ChatController.getMessages);
router.post('/:id/messages', ChatController.sendMessage);
router.post('/:id/attention', ChatController.sendAttention);
router.post('/:id/read', ChatController.markAsRead);
router.post('/upload', UploadController.uploadMiddleware, UploadController.uploadFile);
router.delete('/:id', ChatController.deleteConversation);
router.post('/:id/participants', ChatController.addParticipant);
router.post('/:id/transfer', ChatController.transferConversation);
router.get('/agents', ChatController.getSupportAgents);
router.get('/users', ChatController.searchUsers);
router.get('/debug/users', debugChatUsers);

export default router;
