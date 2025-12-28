import { Router } from 'express';
import * as managementController from '../controllers/managementController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Only GESTAO and ADMIN roles can access these routes
router.use(authenticate);
router.use(authorize(['GESTAO', 'ADMIN']));

router.get('/kpis', managementController.getKPIs);
router.get('/reports', managementController.getReports);
// User Management
router.get('/users', managementController.listUsers);
router.post('/users', managementController.createUser);
router.get('/users/:id', managementController.getUser);
router.put('/users/:id', managementController.updateUser); // Details + Role + Permissions
router.delete('/users/:id', managementController.deleteUser);
// Legacy individual role update kept if needed, but updateUser covers it
router.put('/users/:id/role', managementController.updateUserRole);

export default router;
