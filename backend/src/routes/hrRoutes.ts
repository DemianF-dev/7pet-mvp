import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import hrController from '../controllers/hrController';

const router = Router();

// All HR routes require authentication
router.use(authenticate);

// ============================================
// STAFF PROFILES - Gestão/Admin only
// ============================================
router.post('/staff-profiles', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.createStaffProfile);
router.put('/staff-profiles/:id', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.updateStaffProfile);
router.get('/staff-profiles', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.getStaffProfiles);
router.get('/staff-profiles/me', hrController.getMyStaffProfile);

// ============================================
// ATTENDANCE - Self check-in/out + Gestão corrections
// ============================================
router.post('/attendance/check-in', hrController.checkIn);
router.post('/attendance/check-out', hrController.checkOut);
router.get('/attendance/today', hrController.getTodayAttendance);
router.get('/attendance/me', hrController.getMyAttendance);
router.get('/attendance', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.getAttendanceRecords);
router.put('/attendance/:id', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.updateAttendance);

// ============================================
// SERVICE EXECUTIONS (SPA Production)
// ============================================
router.get('/service-executions', authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'COMERCIAL', 'SPA']), hrController.getServiceExecutions);
router.post('/service-executions', authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'COMERCIAL', 'SPA']), hrController.createServiceExecution);

// ============================================
// TRANSPORT LEG EXECUTIONS
// ============================================
router.get('/transport-legs', authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'COMERCIAL', 'SPA']), hrController.getTransportLegExecutions);
router.post('/transport-legs', authorize(['OPERACIONAL', 'GESTAO', 'ADMIN', 'MASTER', 'COMERCIAL', 'SPA']), hrController.createTransportLegExecution);

// ============================================
// PAY PERIODS - Gestão/Admin only
// ============================================
router.post('/pay-periods', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.createPayPeriod);
router.get('/pay-periods', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.getPayPeriods);
router.post('/pay-periods/:id/generate', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.generatePayStatements);
router.post('/pay-periods/:id/close', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.closePayPeriod);
router.post('/pay-periods/:id/reopen', authorize(['ADMIN', 'MASTER']), hrController.reopenPayPeriod);

// ============================================
// PAY ADJUSTMENTS - Gestão/Admin only
// ============================================
router.post('/pay-adjustments', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.createPayAdjustment);
router.get('/pay-adjustments', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.getPayAdjustments);

// ============================================
// PAY STATEMENTS - Self view + Gestão full access
// ============================================
router.get('/pay-statements', authorize(['GESTAO', 'ADMIN', 'MASTER']), hrController.getPayStatements);
router.get('/pay-statements/me', hrController.getMyPayStatements);
router.get('/pay-statements/:id', hrController.getPayStatement);
router.get('/pay-statements/:id/receipt', hrController.getReceiptHtml);

export default router;
