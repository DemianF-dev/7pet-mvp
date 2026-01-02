
import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead, resolveNotification } from '../controllers/notificationController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.put('/:id/resolve', resolveNotification);

export default router;
