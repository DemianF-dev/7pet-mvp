import prisma from '../lib/prisma';
import { AppointmentStatus, TransportPeriod, AppointmentCategory } from '@prisma/client';
import * as auditService from './auditService';
import hrService from './hrService';
import { randomUUID } from 'crypto';
import { logInfo, logError } from '../utils/logger';
import { validateAppointmentCreateInput } from '../domain/appointments/appointmentValidation';

export const create = async (data: {
    customerId: string;
    petId: string;
    serviceIds?: string[];
    startAt: Date;
    category?: AppointmentCategory;
    transport?: {
        origin?: string;
        destination?: string;
        requestedPeriod?: TransportPeriod;
    };
    performerId?: string;
    pickupProviderId?: string;
    dropoffProviderId?: string;
    quoteId?: string;
    overridePastDateCheck?: boolean; // Flag para operadores confirmarem agendamento no passado
}, isStaff: boolean = false) => {
    const now = new Date();

    const issues = validateAppointmentCreateInput(data, isStaff, now);
    const warning = issues.find(issue => issue.code === 'PAST_DATE_WARNING');
    if (warning) {
        const error: any = new Error(warning.message);
        error.code = warning.code;
        error.appointmentDate = warning.appointmentDate;
        throw error;
    }

    const errorIssue = issues.find(issue => issue.level === 'error');
    if (errorIssue) {
        throw new Error(errorIssue.message);
    }

    // Check if customer is blocked
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!isStaff && customer?.isBlocked) {
        throw new Error('Sua conta está bloqueada para novos agendamentos. Entre em contato com o suporte.');
    }

    // Check for concurrency/double booking
    // Only Active appointments (not cancelled, not deleted) block the slot
    // Rule: We allow multiple appointments at the same time if they are in DIFFERENT categories (e.g., one SPA and one LOGISTICA)
    // OR if it's the SAME pet/customer (dual agenda).
    // Also, if isStaff is true, we can be more lenient or bypass.
    if (!isStaff) {
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                startAt: data.startAt,
                category: data.category || 'SPA', // Check in the same category
                deletedAt: null,
                status: { notIn: [AppointmentStatus.CANCELADO] }
            }
        });

        if (existingAppointment) {
            logInfo('Appointment conflict found for non-staff', { startAt: data.startAt, category: data.category });
            throw new Error('⚠️ Este horário já possui um agendamento nesta categoria. Por favor, escolha outro horário.');
        }
    } else {
        logInfo('Appointment staff bypass for creation', { category: data.category });
    }

    const appointment = await prisma.appointment.create({
        data: {
            id: randomUUID(),
            customerId: data.customerId,
            petId: data.petId,
            startAt: data.startAt,
            updatedAt: new Date(),
            status: isStaff ? AppointmentStatus.CONFIRMADO : AppointmentStatus.PENDENTE,
            category: data.category || AppointmentCategory.SPA,
            services: data.serviceIds ? {
                connect: data.serviceIds.map(id => ({ id }))
            } : undefined,
            transportDetails: data.transport ? {
                create: {
                    id: randomUUID(),
                    origin: data.transport.origin || 'Endereço não informado',
                    destination: data.transport.destination || '7Pet',
                    requestedPeriod: data.transport.requestedPeriod || TransportPeriod.MANHA
                }
            } : undefined,
            quoteId: data.quoteId,
            performerId: data.performerId || undefined,
            pickupProviderId: data.pickupProviderId || undefined,
            dropoffProviderId: data.dropoffProviderId || undefined
        },
        include: {
            pet: true,
            services: true,
            transportDetails: true,
            performer: true,
            pickupProvider: true,
            dropoffProvider: true,
            customer: {
                include: { pets: true }
            }
        }
    });

    // Logging
    if (data.customerId) {
        await auditService.logAppointmentEvent(
            { source: 'SYSTEM', actorUserId: 'SYSTEM' },
            appointment,
            'APPOINTMENT_CREATED',
            'Agendamento criado'
        );
    }

    return appointment;
};

export const list = async (
    filters: { customerId?: string; status?: AppointmentStatus; category?: AppointmentCategory; performerId?: string },
    pagination?: { skip?: number; take?: number }
) => {
    return prisma.appointment.findMany({
        where: {
            ...filters,
            deletedAt: null // Only active appointments
        },
        include: {
            pet: {
                select: { id: true, name: true, species: true, breed: true }
            },
            services: {
                select: { id: true, name: true, basePrice: true, duration: true }
            },
            transportDetails: true,
            performer: {
                select: { id: true, name: true, color: true }
            },
            invoice: {
                select: { id: true, status: true, amount: true }
            },
            quote: {
                select: {
                    id: true,
                    status: true,
                    appointments: {
                        where: { deletedAt: null },
                        select: { id: true, category: true, transportDetails: { select: { type: true } } }
                    }
                }
            },
            customer: {
                select: { id: true, name: true, phone: true, type: true, user: { select: { email: true } } }
            },
            transportLegs: {
                include: { provider: { select: { id: true, name: true, color: true } } }
            },
            transportSnapshot: true,
            posOrder: {
                select: { id: true, status: true, finalAmount: true }
            }
        },
        orderBy: { startAt: 'desc' },
        ...(pagination?.skip !== undefined && { skip: pagination.skip }),
        ...(pagination?.take !== undefined && { take: pagination.take })
    });
};

export const count = async (filters: { customerId?: string; status?: AppointmentStatus; category?: AppointmentCategory }) => {
    return prisma.appointment.count({
        where: {
            ...filters,
            deletedAt: null
        }
    });
};

export const get = async (id: string) => {
    return prisma.appointment.findUnique({
        where: { id },
        include: {
            pet: true,
            services: true,
            transportDetails: true,
            performer: true,
            pickupProvider: true,
            dropoffProvider: true,
            invoice: {
                include: { paymentRecords: true, financialTransactions: true, customer: true }
            },
            quote: {
                include: {
                    invoice: {
                        include: { paymentRecords: true, financialTransactions: true, customer: true }
                    }
                }
            },
            customer: true,
            transportLegs: {
                include: { provider: { select: { id: true, name: true, color: true } } }
            },
            transportSnapshot: true,
            posOrder: {
                include: { payments: true }
            }
        }
    });
};

export const update = async (id: string, data: any, userId?: string) => {
    const previous = await get(id);

    logInfo('Appointment update data', {
        id,
        performerId: data.performerId,
        pickupProviderId: data.pickupProviderId,
        dropoffProviderId: data.dropoffProviderId,
        serviceIds: data.serviceIds
    });
    const updated = await prisma.appointment.update({
        where: { id },
        data: {
            petId: data.petId,
            startAt: data.startAt,
            status: data.status, // Allow status update via regular update too
            category: data.category,
            services: data.serviceIds ? {
                set: [], // Clear existing relations
                connect: data.serviceIds.map((sid: string) => ({ id: sid }))
            } : undefined,
            transportDetails: data.transport ? {
                upsert: {
                    create: {
                        id: randomUUID(),
                        origin: data.transport.origin || 'Endereço não informado',
                        destination: data.transport.destination || '7Pet',
                        requestedPeriod: data.transport.requestedPeriod || TransportPeriod.MANHA
                    },
                    update: {
                        origin: data.transport.origin,
                        destination: data.transport.destination,
                        requestedPeriod: data.transport.requestedPeriod
                    }
                }
            } : undefined,
            performerId: data.performerId !== undefined ? (data.performerId && data.performerId !== '' ? data.performerId : null) : undefined,
            pickupProviderId: data.pickupProviderId !== undefined ? (data.pickupProviderId && data.pickupProviderId !== '' ? data.pickupProviderId : null) : undefined,
            dropoffProviderId: data.dropoffProviderId !== undefined ? (data.dropoffProviderId && data.dropoffProviderId !== '' ? data.dropoffProviderId : null) : undefined
        },
        include: {
            pet: true,
            services: true,
            transportDetails: true,
            performer: true,
            pickupProvider: true,
            dropoffProvider: true,
            customer: {
                include: { pets: true }
            },
            transportLegs: {
                include: { provider: { select: { id: true, name: true, color: true } } }
            },
            transportSnapshot: true
        }
    });

    if (userId) {
        await auditService.logAppointmentEvent(
            { source: 'SYSTEM', actorUserId: userId },
            updated,
            'APPOINTMENT_STATUS_CHANGED',
            data.reason || 'Atualização de agendamento',
            { changes: auditService.calculateDiff(previous, updated) }
        );
    }

    return updated;
};

export const updateStatus = async (id: string, status: AppointmentStatus, userId?: string, reason?: string) => {
    const previous = await get(id);
    const updated = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
            customer: { include: { user: true } },
            pet: true,
            services: true,
            transportDetails: true,
            transportLegs: true,
            transportSnapshot: true
        }
    });

    if (userId) {
        await auditService.logAppointmentEvent(
            { source: 'SYSTEM', actorUserId: userId },
            updated,
            'APPOINTMENT_STATUS_CHANGED',
            reason || `Alteração de status para ${status}`,
            { oldStatus: previous?.status, newStatus: updated.status }
        );
    }

    // Sync Quote Status if linked
    if (updated.quoteId) {
        await syncQuoteStatus(updated.quoteId, userId || 'SYSTEM');
    }


    // -------------------------------------------------------------------------
    // HR INTEGRATION: Record Production when finished
    // -------------------------------------------------------------------------
    if (status === AppointmentStatus.FINALIZADO && updated.performerId) {
        try {
            const staff = await hrService.getStaffProfileByUserId(updated.performerId);

            if (staff && staff.isActive) {
                // Record SPA production if it's a SPA appointment or has services
                if (updated.category === 'SPA' || (updated.services && updated.services.length > 0)) {
                    for (const svc of (updated.services || [])) {
                        await hrService.createServiceExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            serviceId: svc.id,
                            notes: `Auto-registrado via finalização de agendamento #${updated.seqId}`
                        });
                    }

                    if (updated.services.length === 0) {
                        await hrService.createServiceExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            notes: `Serviço avulso (SPA) - Agendamento #${updated.seqId}`
                        });
                    }
                }

                // Logistics production recording is now handled exclusively in updateLogisticsStatus
                // whenever the logisticsStatus moves to EXECUTED, to ensure leg type (LEVA/TRAZ) accuracy.

            }
        } catch (hrError) {
            logError('AppointmentService error recording HR production', hrError, { appointmentId: id });
        }
    }

    return updated;
};

export const updateLogisticsStatus = async (id: string, logisticsStatus: string, userId?: string, reason?: string) => {
    const previous = await get(id);
    const updated = await prisma.appointment.update({
        where: { id },
        data: { logisticsStatus },
        include: {
            customer: { include: { user: true } },
            pet: true,
            transportDetails: true,
            performer: true
        }
    });

    if (userId) {
        await auditService.logAppointmentEvent(
            { source: 'SYSTEM', actorUserId: userId },
            updated,
            'APPOINTMENT_STATUS_CHANGED',
            reason || `Alteração de status logístico para ${logisticsStatus}`,
            { oldLogisticsStatus: previous?.logisticsStatus, newLogisticsStatus: updated.logisticsStatus }
        );
    }

    // HR INTEGRATION for Logistics status
    if (updated.logisticsStatus === 'EXECUTED') {
        try {
            const transportType = updated.transportDetails?.type;
            const performerId = updated.performerId;

            if (performerId) {
                const staff = await hrService.getStaffProfileByUserId(performerId);
                if (staff && staff.isActive) {
                    const existing = await hrService.getTransportLegExecutions({ staffId: staff.id });

                    // Se for busca (LEVA) ou não especificado, registra pickup
                    if (transportType === 'LEVA' || !transportType) {
                        if (!existing.some(l => l.appointmentId === updated.id && l.legType === 'pickup')) {
                            await hrService.createTransportLegExecution({
                                appointmentId: updated.id,
                                staffId: staff.id,
                                legType: 'pickup',
                                notes: `Logística Executada (Busca/Leva) - Agendamento #${updated.seqId}`
                            });
                        }
                    }

                    // Se for retorno (TRAZ) ou não especificado, registra dropoff
                    if (transportType === 'TRAZ' || !transportType) {
                        if (!existing.some(l => l.appointmentId === updated.id && l.legType === 'dropoff')) {
                            await hrService.createTransportLegExecution({
                                appointmentId: updated.id,
                                staffId: staff.id,
                                legType: 'dropoff',
                                notes: `Logística Executada (Entrega/Traz) - Agendamento #${updated.seqId}`
                            });
                        }
                    }
                }
            }


            if (updated.category === 'LOGISTICA') {
                await prisma.appointment.update({
                    where: { id: updated.id },
                    data: { status: 'FINALIZADO' }
                });
            }
        } catch (hrError) {
            logError('AppointmentService error recording HR logistics production (EXECUTED)', hrError, { appointmentId: id });
        }
    } else if (updated.logisticsStatus === 'CANCELED_WITH_TRAVEL') {
        try {
            const largadaUserId = updated.pickupProviderId || updated.performerId;
            if (largadaUserId) {
                const staff = await hrService.getStaffProfileByUserId(largadaUserId);
                if (staff && staff.isActive) {
                    const existing = await hrService.getTransportLegExecutions({ staffId: staff.id });
                    if (!existing.some(l => l.appointmentId === updated.id && l.legType === 'pickup')) {
                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            legType: 'pickup',
                            notes: `Cancelado com Viagem (Taxa de Largada) - Agendamento #${updated.seqId}`
                        });
                    }
                }
            }
            await prisma.appointment.update({
                where: { id: updated.id },
                data: { status: 'CANCELADO' }
            });
        } catch (hrError) {
            logError('AppointmentService error recording HR logistics production (CANCELED_WITH_TRAVEL)', hrError, { appointmentId: id });
        }
    } else if (updated.logisticsStatus === 'CANCELED_WITHOUT_TRAVEL') {
        await prisma.appointment.update({
            where: { id: updated.id },
            data: { status: 'CANCELADO' }
        });
    } else if (updated.logisticsStatus === 'RESCHEDULE') {
        await prisma.appointment.update({
            where: { id: updated.id },
            data: { status: 'PENDENTE' }
        });
    }

    // Sync Quote Status if linked
    if (updated.quoteId) {
        await syncQuoteStatus(updated.quoteId, userId || 'SYSTEM');
    }

    return updated;
};

// Soft Delete
export const remove = async (id: string) => {
    return prisma.appointment.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
};

// Restore from Trash
export const restore = async (id: string) => {
    return prisma.appointment.update({
        where: { id },
        data: { deletedAt: null }
    });
};

// List Trash (Deleted in last 15 days)
export const listTrash = async () => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    return prisma.appointment.findMany({
        where: {
            deletedAt: {
                not: null,
                gte: fifteenDaysAgo
            }
        },
        include: {
            pet: true,
            services: true,
            transportDetails: true,
            performer: true,
            customer: {
                include: { pets: true }
            }
        },
        orderBy: { deletedAt: 'desc' }
    });
};

// Hard Delete
export const permanentRemove = async (id: string) => {
    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction([
        prisma.statusHistory.deleteMany({ where: { appointmentId: id } }),
        prisma.transportDetails.deleteMany({ where: { appointmentId: id } }),
        // Note: Invoice might be linked to others, but if it was created FOR this appt, 
        // we might want to handle it. For now, let's at least unlink or delete if unique.
        // If there's an invoice, we just delete it if it's only linked to this appointment.
        prisma.invoice.deleteMany({ where: { appointmentId: id } }),
        prisma.appointment.delete({
            where: { id }
        })
    ]);
};

export const bulkPermanentRemove = async (ids: string[]) => {
    return prisma.$transaction([
        prisma.statusHistory.deleteMany({ where: { appointmentId: { in: ids } } }),
        prisma.transportDetails.deleteMany({ where: { appointmentId: { in: ids } } }),
        prisma.invoice.deleteMany({ where: { appointmentId: { in: ids } } }),
        prisma.appointment.deleteMany({ where: { id: { in: ids } } })
    ]);
};

// Business Rule: Process No-Shows
export const processNoShows = async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const staleAppointments = await prisma.appointment.findMany({
        where: {
            status: { in: [AppointmentStatus.PENDENTE, AppointmentStatus.CONFIRMADO] },
            startAt: { lt: twoHoursAgo },
            deletedAt: null
        },
        include: { customer: true }
    });

    for (const appt of staleAppointments) {
        // Update appointment status
        await prisma.appointment.update({
            where: { id: appt.id },
            data: { status: AppointmentStatus.NO_SHOW }
        });

        // Increment customer no-show count and block if necessary
        const newNoShowCount = (appt.customer.noShowCount || 0) + 1;
        await prisma.customer.update({
            where: { id: appt.customerId },
            data: {
                noShowCount: newNoShowCount,
                isBlocked: newNoShowCount >= 2,
                requiresPrepayment: newNoShowCount >= 2
            }
        });
    }

    return staleAppointments.length;
};

/**
 * Synchronizes Quote status with its appointments.
 * - Moves to AGENDADO if appointments are created.
 * - Moves to ENCERRADO if all appointments are terminal.
 */
export const syncQuoteStatus = async (quoteId: string, performerId: string = 'SYSTEM') => {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { appointments: { where: { deletedAt: null } } }
    });

    if (!quote || quote.status === 'ENCERRADO') return;

    const hasAppointments = quote.appointments.length > 0;
    const terminalStatuses: AppointmentStatus[] = [AppointmentStatus.FINALIZADO, AppointmentStatus.CANCELADO, AppointmentStatus.NO_SHOW];
    const allTerminal = hasAppointments && quote.appointments.every(a =>
        terminalStatuses.includes(a.status)
    );

    let newStatus: string = quote.status;
    let reason = '';

    if (allTerminal) {
        newStatus = 'ENCERRADO';
        reason = 'Encerramento automático: todos os agendamentos vinculados foram concluídos ou cancelados.';
    } else if (hasAppointments && quote.status !== 'AGENDADO' && (quote.status as string) !== 'ENCERRADO') {
        newStatus = 'AGENDADO';
        reason = 'Status atualizado para Agendado devido à existência de agendamentos ativos.';
    }

    if (newStatus !== quote.status) {
        await prisma.quote.update({
            where: { id: quoteId },
            data: {
                status: newStatus as any,
                statusHistory: {
                    create: {
                        id: randomUUID(),
                        oldStatus: quote.status,
                        newStatus: newStatus as any,
                        changedBy: performerId,
                        reason
                    }
                }
            }
        });
        logInfo(`[AppointmentService] Quote ${quoteId} status synced to ${newStatus}.`);
    }
};


export const bulkDelete = async (ids: string[]) => {
    // Soft delete - move to trash
    return prisma.appointment.updateMany({
        where: {
            id: { in: ids },
            deletedAt: null // Only delete active appointments
        },
        data: { deletedAt: new Date() }
    });
};

export const bulkRestore = async (ids: string[]) => {
    // Restore from trash
    return prisma.appointment.updateMany({
        where: {
            id: { in: ids },
            deletedAt: { not: null } // Only restore deleted appointments
        },
        data: { deletedAt: null }
    });
};

export const duplicate = async (id: string, performedBy: string) => {
    const original = await prisma.appointment.findUnique({
        where: { id },
        include: {
            services: true,
            transportDetails: true
        }
    });

    if (!original) throw new Error('Agendamento original não encontrado');

    // Create a new appointment based on the original
    // We reset status to PENDENTE and set a new future date (default to 1 week after original or now + 1 day)
    const originalDate = new Date(original.startAt!);
    const nextWeek = new Date(originalDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startAt = nextWeek > new Date() ? nextWeek : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const duplicateData = {
        customerId: original.customerId,
        petId: original.petId,
        serviceIds: original.services.map((s: any) => s.id),
        startAt,
        category: original.category,
        transport: original.transportDetails ? {
            origin: original.transportDetails.origin,
            destination: original.transportDetails.destination,
            requestedPeriod: original.transportDetails.requestedPeriod
        } : undefined,
        performerId: original.performerId || undefined,
    };

    const duplicated = await create(duplicateData, true); // true as isStaff to allow creating with performer

    await auditService.logAppointmentEvent(
        { source: 'SYSTEM', actorUserId: performedBy },
        duplicated,
        'APPOINTMENT_CREATED',
        `Duplicado a partir do agendamento #${original.seqId || original.id}`
    );

    return duplicated;
};


// -------------------------------------------------------------------------
// Pricing & Service Management Helpers
// -------------------------------------------------------------------------

/**
 * Calcula o valor total de um agendamento baseado em:
 * - SPA: metadata.servicePricing (preços do orçamento)
 * - LOGISTICA: metadata.transportSnapshot.totalAmount
 */
export const calculateAppointmentTotal = (appointment: any): number => {
    if (!appointment) return 0;

    // Agendamentos de Logística usam transportSnapshot
    if (appointment.category === 'LOGISTICA') {
        // Suporte para snapshot direto ou via metadata (compatibilidade)
        const snapshot = appointment.transportSnapshot || appointment.metadata?.transportSnapshot;
        return snapshot?.totalAmount || 0;
    }

    // Agendamentos SPA usam servicePricing de metadata
    if (appointment.category === 'SPA') {
        const servicePricing = appointment.metadata?.servicePricing || [];
        return servicePricing.reduce((sum: number, sp: any) =>
            sum + (parseFloat(sp.price) - parseFloat(sp.discount || 0)), 0
        );
    }

    return 0;
};

/**
 * Adiciona um serviço a um agendamento existente
 * @param appointmentId ID do agendamento
 * @param serviceId ID do serviço a adicionar
 * @param price Preço do serviço (do orçamento ou basePrice)
 * @param discount Desconto aplicado
 * @returns Agendamento atualizado
 */
export const addServiceToAppointment = async (
    appointmentId: string,
    serviceId: string,
    price: number,
    discount: number = 0
) => {
    logInfo(`[AppointmentService] Adding service ${serviceId} to appointment ${appointmentId}`, {});

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            services: true,
            quote: { include: { items: true } }
        }
    });

    if (!appointment) {
        throw new Error('Agendamento não encontrado');
    }

    if (appointment.category !== 'SPA') {
        throw new Error('Apenas agendamentos SPA podem ter serviços adicionados');
    }

    // Validar que serviço existe no orçamento original (se houver orçamento)
    if (appointment.quote) {
        const quoteItem = appointment.quote.items.find((i: any) => i.serviceId === serviceId);
        if (!quoteItem) {
            logInfo(`[AppointmentService] Service ${serviceId} not in original quote, but allowing addition`, {});
        }
    }

    // Verificar se serviço já está vinculado
    const alreadyConnected = appointment.services.some((s: any) => s.id === serviceId);
    if (alreadyConnected) {
        throw new Error('Serviço já está vinculado a este agendamento');
    }

    // Atualizar metadata com novo pricing
    const metadata = (appointment.metadata as any) || {};
    const servicePricing = metadata.servicePricing || [];

    servicePricing.push({
        serviceId,
        price: parseFloat(price.toString()),
        discount: parseFloat(discount.toString()),
        sourceQuoteItemId: appointment.quote?.items.find((i: any) => i.serviceId === serviceId)?.id || null,
        addedAt: new Date().toISOString(),
        addedManually: true
    });

    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            services: { connect: { id: serviceId } },
            metadata: { ...metadata, servicePricing },
            updatedAt: new Date()
        },
        include: { services: true }
    });

    logInfo(`[AppointmentService] Service ${serviceId} added successfully. New total: ${calculateAppointmentTotal(updated)}`, {});

    return updated;
};

/**
 * Remove um serviço de um agendamento
 * @param appointmentId ID do agendamento
 * @param serviceId ID do serviço a remover
 * @returns Agendamento atualizado
 */
export const removeServiceFromAppointment = async (
    appointmentId: string,
    serviceId: string
) => {
    logInfo(`[AppointmentService] Removing service ${serviceId} from appointment ${appointmentId}`, {});

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { services: true }
    });

    if (!appointment) {
        throw new Error('Agendamento não encontrado');
    }

    if (appointment.category !== 'SPA') {
        throw new Error('Apenas agendamentos SPA podem ter serviços removidos');
    }

    // Verificar se serviço está vinculado
    const isConnected = appointment.services.some((s: any) => s.id === serviceId);
    if (!isConnected) {
        throw new Error('Serviço não está vinculado a este agendamento');
    }

    // Remover do metadata.servicePricing
    const metadata = (appointment.metadata as any) || {};
    const servicePricing = (metadata.servicePricing || []).filter(
        (sp: any) => sp.serviceId !== serviceId
    );

    const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
            services: { disconnect: { id: serviceId } },
            metadata: { ...metadata, servicePricing },
            updatedAt: new Date()
        },
        include: { services: true }
    });

    logInfo(`[AppointmentService] Service ${serviceId} removed successfully. New total: ${calculateAppointmentTotal(updated)}`, {});

    return updated;
};

/**
 * Cria o metadata.servicePricing para um agendamento com base nos QuoteItems
 * @param quoteItems Lista de QuoteItems do orçamento
 * @param serviceIds IDs dos serviços que devem ser incluídos neste agendamento
 * @returns Array de servicePricing para metadata
 */
export const buildServicePricingFromQuoteItems = (
    quoteItems: any[],
    serviceIds: string[]
): any[] => {
    return quoteItems
        .filter((item: any) => serviceIds.includes(item.serviceId))
        .map((item: any) => ({
            serviceId: item.serviceId!,
            price: parseFloat(item.price.toString()),
            discount: parseFloat((item.discount || 0).toString()),
            sourceQuoteItemId: item.id
        }));
};

// -------------------------------------------------------------------------
// Agenda & Calendar Methods
// -------------------------------------------------------------------------

export const getDay = async (date: string, filters: any = {}) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: {
                gte: start,
                lte: end
            },
            deletedAt: null,
            ...(filters.module && filters.module !== 'ALL' ? {
                category: filters.module === 'LOG' ? 'LOGISTICA' : 'SPA'
            } : {})
        },
        include: {
            pet: true,
            services: true,
            performer: true,
            transportDetails: true,
            customer: {
                include: { user: { select: { email: true } } }
            },
            transportLegs: {
                include: { provider: { select: { id: true, name: true, color: true } } }
            }
        },
        orderBy: { startAt: 'asc' }
    });

    const summary = {
        total: appointments.length,
        byStatus: appointments.reduce((acc: any, curr: any) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {}),
        byCategory: appointments.reduce((acc: any, curr: any) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {}),
        revenue: appointments.reduce((acc: number, curr: any) => {
            const servicesTotal = curr.services?.reduce((sAcc: number, s: any) => sAcc + Number(s.basePrice || 0), 0) || 0;
            return acc + servicesTotal;
        }, 0)
    };

    return {
        appointments,
        summary,
        conflicts: []
    };
};

export const getWeek = async (startDate: string, endDate: string, options?: { module?: string }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure 00:00:00 to 23:59:59
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: {
                gte: start,
                lte: end
            },
            deletedAt: null,
            ...(options?.module && options.module !== 'ALL' ? {
                category: options.module === 'LOG' ? 'LOGISTICA' : 'SPA'
            } : {})
        },
        include: {
            pet: true,
            services: true,
            performer: true,
            transportDetails: true,
            customer: true,
            /* transportLegs: {
                include: { provider: { select: { id: true, name: true, color: true } } }
            } */
        },
        orderBy: { startAt: 'asc' }
    });

    // Group by day
    const days = [];
    const current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayAppointments = appointments.filter((appt: any) =>
            appt.startAt.toISOString().split('T')[0] === dateStr
        );

        days.push({
            date: dateStr,
            appointments: dayAppointments,
            availableSlots: [9, 10, 11, 13, 14, 15, 16], // Mock slots for now
            conflicts: []
        });

        current.setDate(current.getDate() + 1);
    }

    return {
        days,
        summary: {
            totalAppointments: appointments.length,
            totalRevenue: appointments.reduce((acc: number, curr: any) => {
                const servicesTotal = curr.services?.reduce((sAcc: number, s: any) => sAcc + Number(s.basePrice || 0), 0) || 0;
                return acc + servicesTotal;
            }, 0),
            totalSlots: days.length * 7
        }
    };
};

export const getConflicts = async (startDate: string, endDate: string, options?: { excludeId?: string }) => {
    // For now, return empty conflicts behavior until business logic is strictly defined
    // This blocks the UI from crashing
    return {
        conflicts: [],
        hasConflicts: false
    };
};

export const search = async (options: { query: string }) => {
    const { query } = options;
    if (!query || query.length < 2) return { appointments: [], total: 0 };

    const appointments = await prisma.appointment.findMany({
        where: {
            deletedAt: null,
            OR: [
                { customer: { name: { contains: query, mode: 'insensitive' } } },
                { pet: { name: { contains: query, mode: 'insensitive' } } }
                // { id: { equals: query } } // UUID search might crash if query strictly not UUID
            ]
        },
        include: {
            pet: true,
            services: true,
            customer: true,
            performer: true
        },
        take: 20,
        orderBy: { startAt: 'desc' }
    });

    return {
        appointments,
        total: appointments.length
    };
};



