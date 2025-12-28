import { Response } from 'express';
import * as appointmentService from '../services/appointmentService';
import { z } from 'zod';
import { AppointmentStatus, TransportPeriod } from '@prisma/client';

const appointmentSchema = z.object({
    petId: z.string().uuid(),
    serviceIds: z.array(z.string().uuid()).min(1, 'Selecione pelo menos um serviço'),
    startAt: z.string(),
    transport: z.object({
        origin: z.string(),
        destination: z.string(),
        requestedPeriod: z.nativeEnum(TransportPeriod)
    }).optional(),
    customerId: z.string().uuid().optional(),
    quoteId: z.string().uuid().optional()
});

export const create = async (req: any, res: Response) => {
    try {
        const validatedData = appointmentSchema.parse(req.body);
        const isStaff = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA'].includes(req.user.role);

        const customerId = (isStaff && validatedData.customerId) ? validatedData.customerId : req.user.customer.id;

        const data = {
            ...validatedData,
            customerId,
            startAt: new Date(validatedData.startAt)
        };

        const appointment = await appointmentService.create(data, isStaff);

        // If appointment was created from a quote, update quote status to AGENDAR
        if (validatedData.quoteId) {
            await appointmentService.updateQuoteStatus(validatedData.quoteId);
        }

        res.status(201).json(appointment);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: any, res: Response) => {
    try {
        let filters: any = {};

        if (req.user.role === 'CLIENTE') {
            filters.customerId = req.user.customer.id;
        }

        if (req.query.status) {
            filters.status = req.query.status as AppointmentStatus;
        }

        const appointments = await appointmentService.list(filters);
        res.json(appointments);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const get = async (req: any, res: Response) => {
    try {
        const appointment = await appointmentService.get(req.params.id);
        if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });

        if (req.user.role === 'CLIENTE' && appointment.customerId !== req.user.customer.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json(appointment);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const update = async (req: any, res: Response) => {
    try {
        const validatedData = appointmentSchema.parse(req.body);
        const { id } = req.params;

        const data = {
            ...validatedData,
            startAt: new Date(validatedData.startAt)
        };

        const updated = await appointmentService.update(id, data);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: any, res: Response) => {
    try {
        await appointmentService.remove(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateStatus = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!Object.values(AppointmentStatus).includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const appointment = await appointmentService.get(id);
        if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });

        if (req.user.role === 'CLIENTE') {
            if (appointment.customerId !== req.user.customer.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if (status !== 'CANCELADO') {
                return res.status(400).json({ error: 'Clientes só podem cancelar agendamentos' });
            }
            if (appointment.status !== 'PENDENTE') {
                return res.status(400).json({ error: 'Apenas agendamentos pendentes podem ser cancelados pelo cliente' });
            }
        }

        const updated = await appointmentService.updateStatus(id, status as AppointmentStatus);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const listTrash = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

        const trash = await appointmentService.listTrash();
        res.json(trash);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const restore = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

        await appointmentService.restore(req.params.id);
        res.status(200).json({ message: 'Agendamento restaurado' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const permanentRemove = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

        await appointmentService.permanentRemove(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
