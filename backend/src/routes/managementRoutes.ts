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

// Lightweight master verification
router.get('/master/verify', managementController.verifyMaster);

// Restricted actions - ADMIN division OR MASTER role
router.use((req, res, next) => {
    const user = (req as any).user;
    const userDivision = user?.division || user?.role;
    const userRole = user?.role;

    // Allow MASTER role/division OR ADMIN division/role
    const isSuperUser = userRole === 'MASTER' || userDivision === 'MASTER' || userDivision === 'ADMIN';

    if (isSuperUser) {
        return next();
    }

    return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
});

router.get('/kpis', managementController.getKPIs);
router.get('/reports', managementController.getReports);
// User Management
router.post('/users', managementController.createUser);
router.get('/users/:id', managementController.getUser);
router.put('/users/:id', managementController.updateUser); // Details + Role + Permissions
router.delete('/users/:id', managementController.deleteUser);
router.delete('/users/:id/permanent', managementController.permanentDeleteUser);
router.post('/users/:id/restore', managementController.restoreUser);
// Legacy individual role update kept if needed, but updateUser covers it
router.put('/users/:id/role', managementController.updateUserRole);

// Role Permissions - MASTER ONLY
router.get('/roles', (req, res, next) => {
    const user = (req as any).user;
    if (user?.email === 'oidemianf@gmail.com' || user?.role === 'MASTER' || user?.division === 'MASTER') return next();
    return res.status(403).json({ error: 'Apenas o Master pode configurar cargos.' });
}, managementController.getRoleConfigs);

router.put('/roles/:role', (req, res, next) => {
    const user = (req as any).user;
    if (user?.email === 'oidemianf@gmail.com' || user?.role === 'MASTER' || user?.division === 'MASTER') return next();
    return res.status(403).json({ error: 'Apenas o Master pode alterar cargos.' });
}, managementController.updateRoleConfig);

router.delete('/roles/:role', (req, res, next) => {
    const user = (req as any).user;
    if (user?.email === 'oidemianf@gmail.com' || user?.role === 'MASTER' || user?.division === 'MASTER') return next();
    return res.status(403).json({ error: 'Apenas o Master pode excluir cargos.' });
}, managementController.deleteRoleConfig);

// Audit Logs
router.get('/audit/:entityType/:entityId', auditController.getLogs);
router.post('/audit/:logId/rollback', auditController.rollback);

export default router;
