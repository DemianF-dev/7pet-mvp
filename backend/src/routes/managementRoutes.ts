import { Router } from 'express';
import * as managementController from '../controllers/managementController';
import { auditController } from '../controllers/auditController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Only ADMIN (and MASTER via bypass) can access most of these routes
// However, listing users is needed for appointment professional selection
router.use(authenticate);

// Publicly available to staff for selection (but still filtered in controller if needed)
router.get('/users', authorize(['ADMIN', 'GESTAO', 'OPERACIONAL', 'SPA', 'LOGISTICA', 'COMERCIAL']), managementController.listUsers);

// Restricted actions - ADMIN division OR MASTER role
router.use((req, res, next) => {
    const user = (req as any).user;
    const userDivision = user?.division || user?.role;
    const userRole = user?.role;

    // Allow MASTER role OR ADMIN division
    if (userRole === 'MASTER' || userDivision === 'ADMIN') {
        return next();
    }

    console.log('[Management Routes] Access denied - not MASTER or ADMIN');
    return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
});

router.get('/kpis', managementController.getKPIs);
router.get('/reports', managementController.getReports);
// User Management
router.post('/users', managementController.createUser);
router.get('/users/:id', managementController.getUser);
router.put('/users/:id', managementController.updateUser); // Details + Role + Permissions
router.delete('/users/:id', managementController.deleteUser);
router.post('/users/:id/restore', managementController.restoreUser);
// Legacy individual role update kept if needed, but updateUser covers it
router.put('/users/:id/role', managementController.updateUserRole);

// Role Permissions
// Role Permissions
router.get('/roles', managementController.getRoleConfigs);
router.put('/roles/:role', managementController.updateRoleConfig);
router.delete('/roles/:role', managementController.deleteRoleConfig);

// Audit Logs
router.get('/audit/:entityType/:entityId', auditController.getLogs);
router.post('/audit/:logId/rollback', auditController.rollback);

export default router;
