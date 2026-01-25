import { Router } from 'express';
import { authLimiter } from '../utils/rateLimiters';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateLogin } from '../middlewares/validationMiddleware';

const router = Router();

// Security: Using centralized auth limiter from utils/rateLimiters.ts

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, authController.updateMe);

export default router;
