import { Request, Response, NextFunction } from 'express';
import packageService from '../services/packageService';
import Logger from '../lib/logger';

/**
 * Package Controller - API endpoints for recurring packages
 */

// ================================
// PACKAGE CRUD
// ================================

/**
 * GET /api/packages/calculate
 * Calculate package price with discounts
 */
export const calculatePrice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { petId, frequency, items } = req.body;

        if (!petId || !frequency || !items?.length) {
            return res.status(400).json({ error: 'petId, frequency e items são obrigatórios' });
        }

        const calculation = await packageService.calculatePackagePrice(petId, frequency, items);
        res.json(calculation);
    } catch (error: any) {
        Logger.error('[PackageController] calculatePrice error:', error);
        next(error);
    }
};

/**
 * POST /api/packages
 * Create a new recurring package
 */
export const createPackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId, petId, frequency, items, startDate, notes } = req.body;
        const user = (req as any).user;

        if (!customerId || !petId || !frequency || !items?.length) {
            return res.status(400).json({ error: 'customerId, petId, frequency e items são obrigatórios' });
        }

        const pkg = await packageService.createPackage({
            customerId,
            petId,
            frequency,
            items,
            startDate: new Date(startDate),
            notes,
            createdBy: user?.id || 'SYSTEM'
        });

        res.status(201).json(pkg);
    } catch (error: any) {
        Logger.error('[PackageController] createPackage error:', error);
        next(error);
    }
};

/**
 * GET /api/packages/:id
 * Get package by ID
 */
export const getPackage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const pkg = await packageService.getPackageById(id);

        if (!pkg) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        res.json(pkg);
    } catch (error: any) {
        Logger.error('[PackageController] getPackage error:', error);
        next(error);
    }
};

/**
 * GET /api/packages/customer/:customerId
 * List packages for a customer
 */
export const listByCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId } = req.params;
        const { status } = req.query;

        const packages = await packageService.listPackagesByCustomer(
            customerId,
            status as string | undefined
        );

        res.json(packages);
    } catch (error: any) {
        Logger.error('[PackageController] listByCustomer error:', error);
        next(error);
    }
};

/**
 * PATCH /api/packages/:id/status
 * Update package status
 */
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        const user = (req as any).user;

        if (!status || !reason) {
            return res.status(400).json({ error: 'status e reason são obrigatórios' });
        }

        const updated = await packageService.updatePackageStatus(
            id,
            status,
            reason,
            user?.id || 'SYSTEM'
        );

        res.json(updated);
    } catch (error: any) {
        Logger.error('[PackageController] updateStatus error:', error);
        next(error);
    }
};

// ================================
// SCHEDULING
// ================================

/**
 * POST /api/packages/:id/schedule
 * Schedule all appointments for a package month
 */
export const scheduleMonth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { appointments } = req.body;
        const user = (req as any).user;

        if (!appointments?.length) {
            return res.status(400).json({ error: 'appointments são obrigatórios' });
        }

        const result = await packageService.schedulePackageMonth({
            packageId: id,
            appointments: appointments.map((a: any) => ({
                ...a,
                startAt: new Date(a.startAt)
            })),
            createdBy: user?.id || 'SYSTEM'
        });

        if (!result.success) {
            return res.status(409).json(result);
        }

        res.status(201).json(result);
    } catch (error: any) {
        Logger.error('[PackageController] scheduleMonth error:', error);
        next(error);
    }
};

/**
 * POST /api/packages/check-availability
 * Check availability for multiple dates
 */
export const checkAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { dates } = req.body;

        if (!dates?.length) {
            return res.status(400).json({ error: 'dates são obrigatórios' });
        }

        const conflicts = await packageService.checkAvailability(
            dates.map((d: string) => new Date(d))
        );

        res.json({
            available: conflicts.length === 0,
            conflicts
        });
    } catch (error: any) {
        Logger.error('[PackageController] checkAvailability error:', error);
        next(error);
    }
};

// ================================
// DEBIT/CREDIT NOTES
// ================================

/**
 * POST /api/packages/add-service
 * Add a service to an existing appointment with billing options
 */
export const addServiceToAppointment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { appointmentId, serviceId, description, price, billingAction } = req.body;
        const user = (req as any).user;

        if (!appointmentId || !description || !price || !billingAction) {
            return res.status(400).json({
                error: 'appointmentId, description, price e billingAction são obrigatórios'
            });
        }

        const note = await packageService.addServiceToAppointment({
            appointmentId,
            serviceId,
            description,
            price,
            billingAction,
            createdBy: user?.id || 'SYSTEM'
        });

        res.status(201).json(note);
    } catch (error: any) {
        Logger.error('[PackageController] addServiceToAppointment error:', error);
        next(error);
    }
};

/**
 * GET /api/packages/notes/:customerId
 * Get pending debit/credit notes for a customer
 */
export const getPendingNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId } = req.params;
        const notes = await packageService.getPendingNotes(customerId);
        res.json(notes);
    } catch (error: any) {
        Logger.error('[PackageController] getPendingNotes error:', error);
        next(error);
    }
};

/**
 * PATCH /api/packages/notes/:noteId/settle
 * Settle a pending note
 */
export const settleNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { noteId } = req.params;
        const { action } = req.body;
        const user = (req as any).user;

        if (!action || !['QUITADO', 'ABATIDO'].includes(action)) {
            return res.status(400).json({ error: 'action deve ser QUITADO ou ABATIDO' });
        }

        const updated = await packageService.settleNote(noteId, action, user?.id || 'SYSTEM');
        res.json(updated);
    } catch (error: any) {
        Logger.error('[PackageController] settleNote error:', error);
        next(error);
    }
};

// ================================
// RECURRING QUOTE
// ================================

/**
 * POST /api/packages/quote
 * Create a recurring quote with package calculation
 */
export const createRecurringQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId, petId, frequency, items, cardFeePercent, taxPercent, notes } = req.body;
        const user = (req as any).user;

        if (!customerId || !petId || !frequency || !items?.length) {
            return res.status(400).json({ error: 'customerId, petId, frequency e items são obrigatórios' });
        }

        const result = await packageService.createRecurringQuote(
            customerId,
            petId,
            frequency,
            items,
            {
                cardFeePercent,
                taxPercent,
                notes,
                createdBy: user?.id || 'SYSTEM'
            }
        );

        res.status(201).json(result);
    } catch (error: any) {
        Logger.error('[PackageController] createRecurringQuote error:', error);
        next(error);
    }
};

/**
 * GET /api/packages/config
 * Get package frequency configuration
 */
export const getFrequencyConfig = async (req: Request, res: Response) => {
    res.json({
        frequencies: packageService.FREQUENCY_CONFIG,
        transportDiscount: packageService.TRANSPORT_DISCOUNT
    });
};

export default {
    calculatePrice,
    createPackage,
    getPackage,
    listByCustomer,
    updateStatus,
    scheduleMonth,
    checkAvailability,
    addServiceToAppointment,
    getPendingNotes,
    settleNote,
    createRecurringQuote,
    getFrequencyConfig
};
