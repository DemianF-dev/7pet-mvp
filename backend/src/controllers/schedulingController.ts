
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';
import { calculateRecurrenceCount } from '../domain/recurrence/recurrenceUtils';

export const schedulingController = {
    createPlanFromQuote: async (req: Request, res: Response) => {
        const { quoteId } = req.params;
        const userId = (req as any).user?.id;

        try {
            const quote = await prisma.quote.findUnique({
                where: { id: quoteId },
                include: {
                    items: { include: { service: true } },
                    schedulePlan: true,
                    transportLegs: true
                }
            });

            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            if (quote.schedulePlan) {
                return res.status(400).json({
                    error: 'Este orçamento já possui um plano de agendamento.',
                    planId: quote.schedulePlan.id
                });
            }

            // Create the plan
            const plan = await prisma.schedulePlan.create({
                data: {
                    id: randomUUID(),
                    quoteId: quote.id,
                    customerId: quote.customerId,
                    status: 'DRAFT',
                    createdByUserId: userId || 'system',
                }
            });

            // Generate Appointment Drafts
            const appointmentsToCreate = [];
            const recurrenceCount = calculateRecurrenceCount(Boolean(quote.isRecurring));

            for (const item of quote.items) {
                if (!item.serviceId) continue;

                const isTransport = item.description.toLowerCase().includes('transporte') ||
                    item.description.toLowerCase().includes('leva') ||
                    item.description.toLowerCase().includes('traz') ||
                    item.service?.category === 'LOGISTICA';

                for (let i = 0; i < recurrenceCount; i++) {
                    await prisma.appointment.create({
                        data: {
                            id: randomUUID(),
                            customerId: quote.customerId,
                            petId: quote.petId || '',
                            status: 'PLANNED' as any,
                            planId: plan.id,
                            sourceQuoteId: quote.id,
                            recurrenceGroupKey: item.id,
                            billingStatus: 'UNBILLED' as any,
                            category: isTransport ? 'LOGISTICA' : 'SPA',
                            transportMode: isTransport ? (quote.transportType === 'ROUND_TRIP' ? 'LEVA_E_TRAZ' : quote.transportType === 'PICK_UP' ? 'SOLO_LEVA' : 'SOLO_TRAZ') : null,
                            services: {
                                connect: { id: item.serviceId }
                            },
                            transportLegs: isTransport ? {
                                create: quote.transportLegs.map(leg => ({
                                    legType: leg.legType,
                                    originAddress: leg.originAddress,
                                    destinationAddress: leg.destinationAddress,
                                    kms: leg.kms,
                                    minutes: leg.minutes,
                                    price: leg.price,
                                }))
                            } : undefined
                        }
                    });
                }
            }

            res.status(201).json(plan);
        } catch (error) {
            console.error('Error creating plan from quote:', error);
            res.status(500).json({ error: 'Erro interno ao criar plano' });
        }
    },

    getPlanDetails: async (req: Request, res: Response) => {
        const { planId } = req.params;
        try {
            const plan = await prisma.schedulePlan.findUnique({
                where: { id: planId },
                include: {
                    appointments: {
                        include: {
                            services: true,
                            performer: true,
                            transportLegs: true
                        },
                        orderBy: { createdAt: 'asc' }
                    },
                    customer: true,
                    quote: true
                }
            });

            if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });
            res.json(plan);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar detalhes do plano' });
        }
    },

    bulkUpdateAppointments: async (req: Request, res: Response) => {
        const { planId } = req.params;
        const { updates } = req.body; // Array of { id, startAt, performerId, duration? }

        try {
            const results = await Promise.all(
                updates.map(async (up: any) => {
                    const appt = await prisma.appointment.update({
                        where: { id: up.id, planId },
                        data: {
                            startAt: up.startAt ? new Date(up.startAt) : undefined,
                            performerId: up.performerId,
                            status: up.startAt ? 'CONFIRMADO' : 'PLANNED',
                            transportMode: up.transportMode
                        }
                    });

                    if (up.providerLevaId) {
                        await prisma.transportLeg.updateMany({
                            where: { appointmentId: up.id, legType: 'LEVA' },
                            data: { providerId: up.providerLevaId }
                        });
                    }
                    if (up.providerTrazId) {
                        await prisma.transportLeg.updateMany({
                            where: { appointmentId: up.id, legType: 'TRAZ' },
                            data: { providerId: up.providerTrazId }
                        });
                    }
                    return appt;
                })
            );

            res.json({ success: true, count: results.length });
        } catch (error) {
            console.error('Error in bulk update:', error);
            res.status(500).json({ error: 'Erro ao atualizar agendamentos' });
        }
    },

    confirmPlan: async (req: Request, res: Response) => {
        const { planId } = req.params;

        try {
            const appointments = await prisma.appointment.findMany({
                where: { planId }
            });

            const missingDates = appointments.filter(a => !a.startAt);
            if (missingDates.length > 0) {
                return res.status(400).json({
                    error: 'Todos os agendamentos devem ter data e hora definidas antes de confirmar o plano.'
                });
            }

            const plan = await prisma.schedulePlan.update({
                where: { id: planId },
                data: { status: 'CONFIRMADO' }
            });

            res.json(plan);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao confirmar plano' });
        }
    }
};
