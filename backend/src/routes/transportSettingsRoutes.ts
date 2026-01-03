
import { Router } from 'express';
import { transportSettingsController } from '../controllers/transportSettingsController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Only admin/staff can manage settings
router.get('/', authenticate, authorize(['ADMIN', 'GERENTE']), transportSettingsController.get);
router.put('/', authenticate, authorize(['ADMIN', 'GERENTE']), transportSettingsController.update);

export default router;
