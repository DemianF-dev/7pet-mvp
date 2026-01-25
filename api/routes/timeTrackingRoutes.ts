import express from 'express';
import timeTrackingController from '../controllers/timeTrackingController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// ATTENDANCE / TIME TRACKING ROUTES
// ============================================

// Check-in (collaborator can check themselves in)
router.post('/attendance/check-in', timeTrackingController.checkIn);

// Check-out (collaborator can check themselves out)
router.post('/attendance/check-out', timeTrackingController.checkOut);

// Get today's attendance (any authenticated user)
router.get('/attendance/today', timeTrackingController.getTodayAttendance);

// Get attendance history (any authenticated user for own data, admin for others)
router.get('/attendance/history', timeTrackingController.getAttendanceHistory);

// Adjust attendance (admin only)
router.patch(
    '/attendance/:id/adjust',
    authorize(['ADMIN', 'GESTAO', 'MASTER']),
    timeTrackingController.adjustAttendance
);

// ============================================
// HOUR BANK ROUTES
// ============================================

// Get hour bank balance (any authenticated user)
router.get('/hour-bank/balance', timeTrackingController.getHourBankBalance);

// Get hour bank transactions (any authenticated user)
router.get('/hour-bank/transactions', timeTrackingController.getHourBankTransactions);

// Admin adjust hour bank (admin only)
router.post(
    '/hour-bank/adjust',
    authorize(['ADMIN', 'GESTAO', 'MASTER']),
    timeTrackingController.adminAdjustHourBank
);

// Process hour bank in pay period (admin only)
router.post(
    '/hour-bank/process-in-period',
    authorize(['ADMIN', 'GESTAO', 'MASTER']),
    timeTrackingController.processHourBankInPeriod
);

export default router;
