import { Router } from 'express';
import packageController from '../controllers/packageController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ================================
// CONFIGURATION
// ================================

// Get package frequency configuration
router.get('/config', packageController.getFrequencyConfig);

// ================================
// PACKAGE CRUD
// ================================

// Calculate package price
router.post('/calculate', packageController.calculatePrice);

// Create a new package
router.post('/', packageController.createPackage);

// Get package by ID
router.get('/:id', packageController.getPackage);

// List packages by customer
router.get('/customer/:customerId', packageController.listByCustomer);

// Update package status
router.patch('/:id/status', packageController.updateStatus);

// ================================
// SCHEDULING
// ================================

// Schedule appointments for a package month
router.post('/:id/schedule', packageController.scheduleMonth);

// Check availability for multiple dates
router.post('/check-availability', packageController.checkAvailability);

// ================================
// RECURRING QUOTE
// ================================

// Create a recurring quote
router.post('/quote', packageController.createRecurringQuote);

// ================================
// DEBIT/CREDIT NOTES
// ================================

// Add service to appointment with billing options
router.post('/add-service', packageController.addServiceToAppointment);

// Get pending notes for a customer
router.get('/notes/:customerId', packageController.getPendingNotes);

// Settle a note
router.patch('/notes/:noteId/settle', packageController.settleNote);

export default router;
