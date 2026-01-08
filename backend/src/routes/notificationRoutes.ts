import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import * as notificationController from '../controllers/notificationController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Gerenciar subscriptions
router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);
router.get('/subscriptions', notificationController.listSubscriptions);

// Notification Management
router.get('/', notificationController.list);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllRead);

// Enviar notificação de teste
router.post('/test', notificationController.sendTestNotification);

export default router;
