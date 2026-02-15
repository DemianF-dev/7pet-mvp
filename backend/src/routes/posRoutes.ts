import { Router } from 'express';
import * as posController from '../controllers/posController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// EXPOSTO TEMPORARIAMENTE PARA DEBUG - MOVER DE VOLTA DEPOIS
router.get('/ping', (req, res) => res.send('pos-pong'));

// All POS routes require authentication and staff roles
router.use(authenticate);
router.use(authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'SPA', 'ATENDIMENTO', 'COMERCIAL']));

// Cash Session
router.get('/session/active', posController.getActiveSession);
router.post('/session/open', posController.openSession);
router.post('/session/close/:id', posController.closeSession);

// Orders
router.get('/orders', posController.listRecentOrders);
router.get('/orders/:id', posController.getOrder);
router.post('/orders', posController.createOrder);
router.post('/orders/:id/payments', posController.addPayment);
router.post('/orders/:id/cancel', posController.cancelOrder);

// Search
router.get('/search', posController.searchItems);

// Checkout from Appointment
router.get('/checkout-appointment/:id', posController.getAppointmentCheckout);

export default router;
