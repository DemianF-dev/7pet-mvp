import { Response } from 'express';
import * as appointmentService from '../services/appointmentService';
import { notificationService } from '../services/notificationService';
import { z } from 'zod';
import { AppointmentStatus, TransportPeriod, AppointmentCategory, AuditAction } from '@prisma/client';
import Logger from '../lib/logger';
import * as auditService from '../services/auditService';
import { AuditContext } from '../services/auditService';
import { logInfo, logError } from '../utils/logger';

const appointmentSchema = z.object({
    petId: z.string().uuid(),
    serviceIds: z.array(z.string().uuid()).optional(),
    startAt: z.string(),
    category: z.nativeEnum(AppointmentCategory).optional(), // Default to SPA
    transport: z.object({
        origin: z.string().optional(),
        destination: z.string().optional(),
        requestedPeriod: z.nativeEnum(TransportPeriod).optional()
    }).optional(),
    customerId: z.string().uuid().optional(),
    quoteId: z.string().uuid().optional(),
    performerId: z.string().uuid().nullable().optional(),
    pickupProviderId: z.string().uuid().nullable().optional(),
    dropoffProviderId: z.string().uuid().nullable().optional()
});

export const create = async (req: any, res: Response) => {
    try {
        const validatedData = appointmentSchema.parse(req.body);
        const isStaff = ['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER'].includes(req.user.role);
        Logger.info(`[AppointmentController] Role check: role=${req.user.role}, isStaff=${isStaff}`);
        const customerId = validatedData.customerId || req.user.customer?.id;

        if (!customerId) {
            return res.status(400).json({ error: 'ID do Cliente não fornecido ou usuário logado não possui perfil de cliente.' });
        }

        const data = {
            ...validatedData,
            customerId,
            startAt: new Date(validatedData.startAt),
            performerId: validatedData.performerId || undefined,
            pickupProviderId: validatedData.pickupProviderId || undefined,
            dropoffProviderId: validatedData.dropoffProviderId || undefined,
            overridePastDateCheck: req.body.overridePastDateCheck || false // **NOVO**
        };

        const appointment = await appointmentService.create(data, isStaff);

        // If appointment was created from a quote, update quote status (sync)
        if (validatedData.quoteId) {
            await appointmentService.syncQuoteStatus(validatedData.quoteId, req.user.id);
        }


        res.status(201).json(appointment);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
        }

        // ⚠️ TRATAMENTO ESPECIAL: Data no passado (staff)
        if (error.code === 'PAST_DATE_WARNING') {
            return res.status(400).json({
                error: error.message,
                code: 'PAST_DATE_WARNING',
                appointmentDate: error.appointmentDate,
                requiresConfirmation: true
            });
        }

        res.status(400).json({ error: error.message });
    }
};

export const list = async (req: any, res: Response) => {
    try {
        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const skip = (page - 1) * limit;

        let filters: any = {};

        // Security / Privacy Logic
        const userDivision = req.user.division || req.user.role || '';
        const isManagement = ['ADMIN', 'MASTER', 'GESTAO', 'COMERCIAL', 'DIRETORIA', 'ATENDIMENTO'].includes(userDivision.toUpperCase());

        if (req.user.role === 'CLIENTE') {
            filters.customerId = req.user.customer?.id;
        } else if (!isManagement) {
            // Staff members (SPA, LOGISTICA, etc.) only see their assigned appointments
            filters.performerId = req.user.id;
        }

        if (req.query.category) {
            filters.category = req.query.category as AppointmentCategory;
        }

        if (req.query.status) {
            filters.status = req.query.status as AppointmentStatus;
        }
        if (req.query.billingStatus) {
            filters.billingStatus = req.query.billingStatus;
        }

        const appointments = await appointmentService.list(filters, { skip, take: limit });
        const total = await appointmentService.count(filters);

        res.json({
            data: appointments,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
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

// Schema for updates (all fields optional)
const appointmentUpdateSchema = appointmentSchema.partial();

export const update = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const appointmentBefore = await appointmentService.get(id);
        if (!appointmentBefore) return res.status(404).json({ error: 'Agendamento não encontrado' });

        // --- LOCK LOGIC ---
        const isBilled = ['INVOICED', 'PAID'].includes(appointmentBefore.billingStatus);
        const isAdmin = ['ADMIN', 'MASTER'].includes(req.user.role);

        if (isBilled && !isAdmin) {
            return res.status(403).json({
                error: 'Este agendamento já foi faturado ou pago e não pode ser editado. Entre em contato com um administrador.',
                code: 'BILLING_LOCKED'
            });
        }

        if (isBilled && isAdmin && !req.body.adminOverrideReason) {
            return res.status(400).json({
                error: 'Alterações em agendamentos faturados exigem uma justificativa.',
                code: 'OVERRIDE_REASON_REQUIRED'
            });
        }
        // ------------------

        const updated = await appointmentService.update(id, data, req.user.id);

        // Log Reschedule if date changed
        if (data.startAt && appointmentBefore.startAt && new Date(data.startAt).getTime() !== appointmentBefore.startAt.getTime()) {
            await auditService.logAppointmentEvent((req as any).audit as AuditContext, updated as any, AuditAction.APPOINTMENT_RESCHEDULED,
                `Agendamento de ${(updated as any).pet.name} reagendado para ${updated.startAt ? updated.startAt.toLocaleString('pt-BR') : 'Sem data'}`,
                { from: appointmentBefore?.startAt, to: updated.startAt, reason: req.body.adminOverrideReason }
            );
        } else if (isBilled && isAdmin) {
            await auditService.logAppointmentEvent((req as any).audit as AuditContext, updated as any, AuditAction.APPOINTMENT_UPDATED,
                `Agendamento faturado de ${(updated as any).pet.name} editado pelo admin: ${req.body.adminOverrideReason}`,
                { before: appointmentBefore, after: updated, reason: req.body.adminOverrideReason }
            );
        }

        res.json(updated);

    } catch (error: any) {
        logError('Appointment update error', error, {
            code: error.code,
            meta: error.meta
        });
        res.status(400).json({
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                code: error.code,
                meta: error.meta
            } : undefined
        });
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

        const { reason } = req.body;

        // --- LOCK LOGIC ---
        const isBilled = ['INVOICED', 'PAID'].includes(appointment.billingStatus);
        const isAdmin = ['ADMIN', 'MASTER'].includes(req.user.role);

        if (isBilled && !isAdmin && status === 'CANCELADO') {
            return res.status(403).json({
                error: 'Este agendamento já foi faturado ou pago e não pode ser cancelado diretamente.',
                code: 'BILLING_LOCKED'
            });
        }
        // ------------------

        const updated = await appointmentService.updateStatus(id, status as AppointmentStatus, req.user.id, reason);

        // Audit Log
        let action: any = 'APPOINTMENT_STATUS_CHANGED';
        if (status === 'CANCELADO') action = 'APPOINTMENT_CANCELLED';
        if (status === 'NO_SHOW') action = 'APPOINTMENT_NO_SHOW';

        await auditService.logAppointmentEvent((req as any).audit as AuditContext, updated, action,
            `Status do agendamento de ${updated.pet.name} alterado para ${status}`,
            { oldStatus: appointment.status, newStatus: status, reason }
        );

        // Notificar Cliente
        if (updated.customer.user) {

            let type: 'UPDATE' | 'CANCEL' | 'CONFIRM' = 'UPDATE';
            let message = '';

            if (status === 'CONFIRMADO') {
                type = 'CONFIRM';
                message = `Oba! Seu agendamento para ${updated.pet.name} foi confirmado. Te esperamos lá! 🐾`;
            } else if (status === 'CANCELADO') {
                type = 'CANCEL';
                message = `O agendamento de ${updated.pet.name} foi cancelado. Se precisar, solicite um novo a qualquer momento.`;
            } else {
                message = `O status do agendamento de ${updated.pet.name} mudou para: ${status}.`;
            }

            await notificationService.notifyAppointmentChange(
                updated.id,
                updated.customer.user.id,
                type,
                message
            );
        }

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

export const bulkDelete = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });
        const { ids } = req.body;
        await appointmentService.bulkDelete(ids);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const bulkRestore = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });
        const { ids } = req.body;
        await appointmentService.bulkRestore(ids);
        res.status(200).json({ message: 'Agendamentos restaurados com sucesso' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const bulkPermanentRemove = async (req: any, res: Response) => {
    try {
        if (req.user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });
        const { ids } = req.body;
        await appointmentService.bulkPermanentRemove(ids);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const duplicate = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const duplicated = await appointmentService.duplicate(id, req.user.id);
        res.status(201).json(duplicated);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};


// -------------------------------------------------------------------------
// Agenda & Calendar Controllers
// -------------------------------------------------------------------------

export const getDay = async (req: any, res: Response) => {
    try {
        const { date, ...filters } = req.query;
        if (!date) return res.status(400).json({ error: 'Data não informada' });

        const result = await appointmentService.getDay(date as string, filters);
        res.json(result);
    } catch (err: any) {
        logError('Error in getDay controller', err);
        res.status(500).json({ error: err.message });
    }
};

export const getWeek = async (req: any, res: Response) => {
    try {
        const { startDate, endDate, module } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const data = await appointmentService.getWeek(startDate as string, endDate as string, { module: module as string });
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getConflicts = async (req: any, res: Response) => {
    try {
        const { startDate, endDate, excludeId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const data = await appointmentService.getConflicts(startDate as string, endDate as string, { excludeId: excludeId as string });
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const search = async (req: any, res: Response) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'query is required' });
        }

        const data = await appointmentService.search({ query: query as string });
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Adiciona um serviço a um agendamento existente
 * PATCH /appointments/:id/services/add
 */
export const addService = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { serviceId, price, discount } = req.body;

        if (!serviceId || price === undefined) {
            return res.status(400).json({ error: 'serviceId e price são obrigatórios' });
        }

        const updated = await appointmentService.addServiceToAppointment(
            id,
            serviceId,
            parseFloat(price),
            parseFloat(discount || 0)
        );

        // Audit log
        await auditService.logAppointmentEvent(
            { source: 'SYSTEM', actorUserId: req.user?.id || 'SYSTEM' },
            updated,
            'APPOINTMENT_STATUS_CHANGED',
            `Serviço adicionado: ${serviceId}`
        );

        res.json(updated);
    } catch (error: any) {
        logError('AppointmentController error adding service', error, { appointmentId: req.params.id });
        res.status(500).json({ error: error.message || 'Erro ao adicionar serviço' });
    }
};

/**
 * Remove um serviço de um agendamento
 * PATCH /appointments/:id/services/remove
 */
export const removeService = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { serviceId } = req.body;

        if (!serviceId) {
            return res.status(400).json({ error: 'serviceId é obrigatório' });
        }

        const updated = await appointmentService.removeServiceFromAppointment(id, serviceId);

        // Audit log
        await auditService.logAppointmentEvent(
            { source: 'SYSTEM', actorUserId: req.user?.id || 'SYSTEM' },
            updated,
            'APPOINTMENT_STATUS_CHANGED',
            `Serviço removido: ${serviceId}`
        );

        res.json(updated);
    } catch (error: any) {
        logError('AppointmentController error removing service', error, { appointmentId: req.params.id });
        res.status(500).json({ error: error.message || 'Erro ao remover serviço' });
    }
};
