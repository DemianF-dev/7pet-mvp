import { Router } from 'express';
import { cronNotifications } from '../controllers/cronController';

const router = Router();

// Vercel Cron Job endpoint (no auth middleware - uses Bearer token)
router.post('/notifications', cronNotifications);

export default router;
