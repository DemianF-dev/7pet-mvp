import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { masterOnly } from '../middlewares/masterOnly';
import * as notificationSettingsController from '../controllers/notificationSettingsController';

const router = Router();

// All routes require authentication + MASTER role
router.use(authenticate, masterOnly);

// Global settings
router.get('/settings', notificationSettingsController.getGlobalSettings);
router.put('/settings/:type', notificationSettingsController.updateGlobalSettings);

// User preferences
router.get('/users/:userId/preferences', notificationSettingsController.getUserPreferences);
router.put('/users/:userId/preferences/:type', notificationSettingsController.updateUserPreference);
router.post('/users/preferences/bulk', notificationSettingsController.bulkUpdateUserPreferences);

// All users with their preferences
router.get('/users', notificationSettingsController.getAllUsersWithPreferences);

// Statistics
router.get('/stats', notificationSettingsController.getNotificationStats);

export default router;
