import { Request, Response } from 'express';
import { payrollService } from '../services/payrollService';

export const getPayrollPreview = async (req: Request, res: Response) => {
    try {
        const { staffId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const preview = await payrollService.getStaffPayrollPreview(
            staffId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        return res.json(preview);
    } catch (error: any) {
        console.error('Error fetching payroll preview:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const closePayrollPeriod = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, staffIds } = req.body;
        // Assume user is authenticated and attached to req (e.g. req.user)
        // For now taking from body or using a default if not present
        const closedByUserId = (req as any).user?.id || 'system';

        if (!startDate || !endDate || !staffIds || !Array.isArray(staffIds)) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const result = await payrollService.closePeriod({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            staffIds,
            closedByUserId
        });

        return res.status(201).json(result);
    } catch (error: any) {
        console.error('Error closing payroll period:', error);
        return res.status(500).json({ error: error.message });
    }
}


export const getHistory = async (req: Request, res: Response) => {
    try {
        const { staffId } = req.params;
        const history = await payrollService.getPayStatementHistory(staffId);
        return res.json(history);
    } catch (error: any) {
        console.error('Error fetching payroll history:', error);
        return res.status(500).json({ error: error.message });
    }
};
