import prisma from '../lib/prisma';
import { AppointmentStatus, TransportPeriod, AppointmentCategory } from '@prisma/client';
import { auditService } from './auditService';
import hrService from './hrService';

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
    quoteId?: string;
    overridePastDateCheck?: boolean; // Flag para operadores confirmarem agendamento no passado
}, isStaff: boolean = false) => {
    const now = new Date();

    // ⚠️ VALIDAÇÃO: Data no passado
    if (data.startAt < now) {
        if (!isStaff) {
            // CLIENTES: Bloqueio total
            throw new Error('❌ Não é possível agendar para uma data/horário que já passou. Por favor, escolha uma data futura.');
        } else if (!data.overridePastDateCheck) {
            // STAFF: Avisar e pedir confirmação
            const error: any = new Error(
                `⚠️ ATENÇÃO: Você está tentando agendar para ${data.startAt.toLocaleString('pt-BR')} que já passou. Confirme se isso está correto.`
            );
            error.code = 'PAST_DATE_WARNING';
            error.appointmentDate = data.startAt.toISOString();
            throw error;
        }
        // Se overridePastDateCheck === true, permite continuar (staff confirmou)
    }

    // Business Rule: Appointments must be at least 12h in advance
    const minLeadTime = 12 * 60 * 60 * 1000; // 12h in ms
    if (!isStaff && data.startAt.getTime() - Date.now() < minLeadTime) {
        throw new Error('Agendamentos devem ser feitos com no mínimo 12h de antecedência.');
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
            console.log('[AppointmentService] Conflict found for non-staff:', { startAt: data.startAt, category: data.category });
            throw new Error('⚠️ Este horário já possui um agendamento nesta categoria. Por favor, escolha outro horário.');
        }
    } else {
        console.log('[AppointmentService] Staff bypass for appointment creation:', { category: data.category });
    }

    const appointment = await prisma.appointment.create({
        data: {
            customerId: data.customerId,
            petId: data.petId,
            startAt: data.startAt,
            status: isStaff ? AppointmentStatus.CONFIRMADO : AppointmentStatus.PENDENTE,
            category: data.category || AppointmentCategory.SPA,
            services: data.serviceIds ? {
                connect: data.serviceIds.map(id => ({ id }))
            } : undefined,
            transport: data.transport ? {
                create: {
                    origin: data.transport.origin || 'Endereço não informado',
                    destination: data.transport.destination || '7Pet',
                    requestedPeriod: data.transport.requestedPeriod || TransportPeriod.MANHA
                }
            } : undefined,
            quoteId: data.quoteId,
            performerId: data.performerId || undefined
        },
        include: {
            pet: true,
            services: true,
            transport: true,
            performer: true,
            customer: {
                include: { pets: true }
            }
        }
    });

    // Logging
    if (data.customerId) {
        await auditService.log({
            entityType: 'Appointment',
            entityId: appointment.id,
            action: 'CREATE',
            performedBy: 'SYSTEM', // Default, should be passed from controller
            newData: appointment,
            reason: 'Agendamento criado'
        });
    }

    return appointment;
};

export const list = async (
    filters: { customerId?: string; status?: AppointmentStatus; category?: AppointmentCategory; performerId?: string },
    pagination?: { skip?: number; take?: number }
) => {
    return (prisma.appointment as any).findMany({
        relationLoadStrategy: 'join',
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
            transport: true,
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
                        select: { id: true, category: true, transport: { select: { type: true } } }
                    }
                }
            },
            customer: {
                select: { id: true, name: true, phone: true, type: true, user: { select: { email: true } } }
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
    return (prisma.appointment as any).findUnique({
        relationLoadStrategy: 'join',
        where: { id },
        include: {
            pet: true,
            services: true,
            transport: true,
            performer: true,
            invoice: {
                include: { payments: true, customer: true }
            },
            quote: {
                include: {
                    invoice: {
                        include: { payments: true, customer: true }
                    }
                }
            },
            customer: true
        }
    });
};

export const update = async (id: string, data: any, userId?: string) => {
    const previous = await get(id);
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
            transport: data.transport ? {
                upsert: {
                    create: {
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
            performerId: data.performerId !== undefined ? (data.performerId || null) : undefined
        },
        include: {
            pet: true,
            services: true,
            transport: true,
            performer: true,
            customer: {
                include: { pets: true }
            }
        }
    });

    if (userId) {
        await auditService.log({
            entityType: 'Appointment',
            entityId: id,
            action: 'UPDATE',
            performedBy: userId,
            previousData: previous,
            newData: updated,
            reason: data.reason || 'Atualização de agendamento'
        });
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
            transport: true
        }
    });

    if (userId) {
        await auditService.log({
            entityType: 'Appointment',
            entityId: id,
            action: 'UPDATE',
            performedBy: userId,
            previousData: { status: previous?.status },
            newData: { status: updated.status },
            reason: reason || `Alteração de status para ${status}`
        });
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

                // Record Transport production if it's LOGISTICA
                if (updated.category === 'LOGISTICA' || updated.transport) {
                    const existingLegs = await hrService.getTransportLegExecutions({ staffId: staff.id });
                    const apptLegs = existingLegs.filter(l => l.appointmentId === updated.id);

                    if (apptLegs.length === 0) {
                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            legType: 'pickup',
                            notes: `Auto-registrado (Saída) - Agendamento #${updated.seqId}`
                        });

                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            legType: 'dropoff',
                            notes: `Auto-registrado (Retorno) - Agendamento #${updated.seqId}`
                        });
                    }
                }
            }
        } catch (hrError) {
            console.error('[AppointmentService] Error recording HR production:', hrError);
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
            transport: true,
            performer: true
        }
    });

    if (userId) {
        await auditService.log({
            entityType: 'Appointment',
            entityId: id,
            action: 'UPDATE_LOGISTICS',
            performedBy: userId,
            previousData: { logisticsStatus: previous?.logisticsStatus },
            newData: { logisticsStatus: updated.logisticsStatus },
            reason: reason || `Alteração de status logístico para ${logisticsStatus}`
        });
    }

    // HR INTEGRATION for Logistics status
    if (updated.performerId) {
        try {
            const staff = await hrService.getStaffProfileByUserId(updated.performerId);
            if (staff && staff.isActive) {
                if (logisticsStatus === 'EXECUTED') {
                    // Record full commission (Leva + Traz)
                    const existingLegs = await hrService.getTransportLegExecutions({ staffId: staff.id });
                    const apptLegs = existingLegs.filter(l => l.appointmentId === updated.id);

                    if (apptLegs.length === 0) {
                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            legType: 'pickup',
                            notes: `Logística Executada - Agendamento #${updated.seqId}`
                        });
                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: staff.id,
                            legType: 'dropoff',
                            notes: `Logística Executada - Agendamento #${updated.seqId}`
                        });
                    }

                    if (updated.category === 'LOGISTICA') {
                        await prisma.appointment.update({
                            where: { id: updated.id },
                            data: { status: 'FINALIZADO' }
                        });
                    }
                } else if (logisticsStatus === 'CANCELED_WITH_TRAVEL') {
                    // Record only 'LARGADA' fee
                    // We'll mark it as 'pickup' for simplicity, or we should ensure hrService knows it's a fixed fee
                    await hrService.createTransportLegExecution({
                        appointmentId: updated.id,
                        staffId: staff.id,
                        legType: 'pickup',
                        notes: `Cancelado com Viagem (Taxa de Largada) - Agendamento #${updated.seqId}`
                    });

                    await prisma.appointment.update({
                        where: { id: updated.id },
                        data: { status: 'CANCELADO' }
                    });
                } else if (logisticsStatus === 'CANCELED_WITHOUT_TRAVEL') {
                    await prisma.appointment.update({
                        where: { id: updated.id },
                        data: { status: 'CANCELADO' }
                    });
                } else if (logisticsStatus === 'RESCHEDULE') {
                    // Reset standard status to PENDENTE to allow rescheduling
                    await prisma.appointment.update({
                        where: { id: updated.id },
                        data: { status: 'PENDENTE' }
                    });
                }
            }
        } catch (hrError) {
            console.error('[AppointmentService] Error recording HR logistics production:', hrError);
        }
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
            transport: true,
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

// Update Quote Status when appointment is created
export const updateQuoteStatus = async (quoteId: string, appointmentId?: string) => {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        select: { status: true }
    });

    if (!quote || quote.status === 'AGENDADO') return;

    await prisma.quote.update({
        where: { id: quoteId },
        data: {
            status: 'AGENDADO',
            statusHistory: {
                create: {
                    oldStatus: quote.status,
                    newStatus: 'AGENDADO',
                    changedBy: 'SYSTEM',
                    reason: 'Agendamento criado automaticamente'
                }
            }
        }
    });
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

