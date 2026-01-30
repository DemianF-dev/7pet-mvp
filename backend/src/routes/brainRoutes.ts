
import { Router } from 'express';
import { handleChat } from '../controllers/BrainController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Only authorized users can access the brain
router.post('/chat', authenticate, authorize(['GESTAO', 'ADMIN', 'MASTER']), handleChat);

export default router;
