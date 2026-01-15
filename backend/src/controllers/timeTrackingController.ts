import { Request, Response } from 'express';
import timeTrackingService from '../services/timeTrackingService';

// ============================================
// ATTENDANCE / TIME TRACKING
// ============================================

export async function checkIn(req: Request, res: Response) {
    try {
        const { staffId } = req.body;
        const userId = (req as any).user.id;

        if (!staffId) {
            return res.status(400).json({ error: 'staffId é obrigatório' });
        }

        const attendance = await timeTrackingService.checkIn(staffId, userId);

        res.json({
            attendance,
            message: 'Check-in registrado com sucesso!'
        });
    } catch (error: any) {
        console.error('Error in checkIn:', error);
        res.status(400).json({ error: error.message || 'Erro ao fazer check-in' });
    }
}

export async function checkOut(req: Request, res: Response) {
    try {
        const { staffId } = req.body;
        const userId = (req as any).user.id;

        if (!staffId) {
            return res.status(400).json({ error: 'staffId é obrigatório' });
        }

        const result = await timeTrackingService.checkOut(staffId, userId);

        res.json(result);
    } catch (error: any) {
        console.error('Error in checkOut:', error);
        res.status(400).json({ error: error.message || 'Erro ao fazer check-out' });
    }
}

export async function getTodayAttendance(req: Request, res: Response) {
    try {
        const { staffId } = req.query;

        if (!staffId) {
            return res.status(400).json({ error: 'staffId é obrigatório' });
        }

        const attendance = await timeTrackingService.getTodayAttendance(staffId as string);

        res.json(attendance);
    } catch (error: any) {
        console.error('Error in getTodayAttendance:', error);
        res.status(500).json({ error: error.message || 'Erro ao buscar presença de hoje' });
    }
}

export async function getAttendanceHistory(req: Request, res: Response) {
    try {
        const { staffId, startDate, endDate, limit } = req.query;

        if (!staffId) {
            return res.status(400).json({ error: 'staffId é obrigatório' });
        }

        const start = startDate ? new Date(startDate as string) : undefined;
        const end = endDate ? new Date(endDate as string) : undefined;
        const limitNum = limit ? parseInt(limit as string) : undefined;

        const result = await timeTrackingService.getAttendanceHistory(
            staffId as string,
            start,
            end,
            limitNum
        );

        res.json(result);
    } catch (error: any) {
        console.error('Error in getAttendanceHistory:', error);
        res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
    }
}

export async function adjustAttendance(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const adminUserId = (req as any).user.id;
        const adjustments = req.body;

        if (!adjustments.adjustmentReason) {
            return res.status(400).json({ error: 'adjustmentReason é obrigatório' });
        }

        const updated = await timeTrackingService.adjustAttendance(id, adminUserId, adjustments);

        res.json(updated);
    } catch (error: any) {
        console.error('Error in adjustAttendance:', error);
        res.status(400).json({ error: error.message || 'Erro ao ajustar presença' });
    }
}

// ============================================
// HOUR BANK
// ============================================

export async function getHourBankBalance(req: Request, res: Response) {
    try {
        const { staffId } = req.query;

        if (!staffId) {
            return res.status(400).json({ error: 'staffId é obrigatório' });
        }

        const balance = await timeTrackingService.getHourBankBalance(staffId as string);

        res.json(balance);
    } catch (error: any) {
        console.error('Error in getHourBankBalance:', error);
        res.status(500).json({ error: error.message || 'Erro ao buscar saldo' });
    }
}

export async function getHourBankTransactions(req: Request, res: Response) {
    try {
        const { staffId, limit } = req.query;

        if (!staffId) {
            return res.status(400).json({ error: 'staffId é obrigatório' });
        }

        const limitNum = limit ? parseInt(limit as string) : undefined;

        const transactions = await timeTrackingService.getHourBankTransactions(
            staffId as string,
            limitNum
        );

        res.json(transactions);
    } catch (error: any) {
        console.error('Error in getHourBankTransactions:', error);
        res.status(500).json({ error: error.message || 'Erro ao buscar transações' });
    }
}

export async function adminAdjustHourBank(req: Request, res: Response) {
    try {
        const { staffId, minutes, reason } = req.body;
        const adminUserId = (req as any).user.id;

        if (!staffId || minutes === undefined || !reason) {
            return res.status(400).json({ error: 'staffId, minutes e reason são obrigatórios' });
        }

        const result = await timeTrackingService.adminAdjustHourBank(
            staffId,
            minutes,
            reason,
            adminUserId
        );

        res.json(result);
    } catch (error: any) {
        console.error('Error in adminAdjustHourBank:', error);
        res.status(400).json({ error: error.message || 'Erro ao ajustar banco de horas' });
    }
}

export async function processHourBankInPeriod(req: Request, res: Response) {
    try {
        const { staffId, payPeriodId, action, bonusMultiplier } = req.body;
        const adminUserId = (req as any).user.id;

        if (!staffId || !payPeriodId || !action) {
            return res.status(400).json({ error: 'staffId, payPeriodId e action são obrigatórios' });
        }

        if (!['pay', 'discount', 'bonus', 'accumulate'].includes(action)) {
            return res.status(400).json({ error: 'action inválida' });
        }

        const result = await timeTrackingService.processHourBankInPeriod(
            staffId,
            payPeriodId,
            action,
            adminUserId,
            bonusMultiplier
        );

        res.json(result);
    } catch (error: any) {
        console.error('Error in processHourBankInPeriod:', error);
        res.status(400).json({ error: error.message || 'Erro ao processar banco de horas' });
    }
}

export default {
    // Attendance
    checkIn,
    checkOut,
    getTodayAttendance,
    getAttendanceHistory,
    adjustAttendance,

    // Hour Bank
    getHourBankBalance,
    getHourBankTransactions,
    adminAdjustHourBank,
    processHourBankInPeriod
};
