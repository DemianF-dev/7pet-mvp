import { Router } from 'express';
import { sendBulkNotification, getAvailableRoles } from '../controllers/marketingController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Protege todas as rotas
router.use(authenticate);

// Apenas ADMIN e MASTER podem enviar em massa
router.post('/send-bulk', authorize(['ADMIN', 'MASTER']), sendBulkNotification);
router.get('/roles', authorize(['ADMIN', 'MASTER']), getAvailableRoles);

export default router;
