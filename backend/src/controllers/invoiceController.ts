
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';

export default class InvoiceController {
    /**
     * Create a new Invoice (Batch or Single)
     */
    async create(req: Request, res: Response) {
        try {
            const schema = z.object({
                customerId: z.string(),
                appointmentIds: z.array(z.string()).min(1),
                dueDate: z.string().optional(),
                notes: z.string().optional()
            });

            const data = schema.parse(req.body);

            // TODO: Implement logic to:
            // 1. Validate appointments belong to customer and are UNBILLED
            // 2. Calculate totals
            // 3. Create Invoice
            // 4. Update Appointments billingStatus

            return res.status(501).json({ message: 'Not implemented yet' });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    /**
     * Get Unbilled Appointments for a Customer
     */
    async getUnbilled(req: Request, res: Response) {
        try {
            const { customerId } = req.params;

            const appointments = await prisma.appointment.findMany({
                where: {
                    customerId,
                    billingStatus: 'UNBILLED',
                    status: 'CONFIRMADO' // or FINALIZADO?
                },
                include: {
                    services: true,
                    transportDetails: true
                }
            });

            return res.json(appointments);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }
}
