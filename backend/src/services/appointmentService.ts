import prisma from '../lib/prisma';
import { AppointmentStatus, TransportPeriod, AppointmentCategory } from '../generated';
import * as auditService from './auditService';
import hrService from './hrService';
import { randomUUID } from 'crypto';
import { logInfo, logError } from '../utils/secureLogger';

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

    // ⚠️ VALIDATION: Logistics Providers (Required for Staff)
    // Se for LOGISTICA ou tiver transporte, exige os responsáveis
    const isLogistics = data.category === 'LOGISTICA' || (data.category === 'SPA' && !!data.transport);
    if (isStaff && isLogistics) {
        if (!data.pickupProviderId) throw new Error('Obrigatório selecionar o motorista LEVA (Coleta).');
        if (!data.dropoffProviderId) throw new Error('Obrigatório selecionar o motorista TRAZ (Entrega).');
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
            customer: true
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
            }
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
            transportDetails: true
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
                if (updated.category === 'LOGISTICA' || updated.transportDetails) {
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
            // Determine providers for each leg
            const pickupUserId = updated.pickupProviderId || updated.performerId;
            const dropoffUserId = updated.dropoffProviderId || updated.performerId;

            if (pickupUserId) {
                const pickupStaff = await hrService.getStaffProfileByUserId(pickupUserId);
                if (pickupStaff && pickupStaff.isActive) {
                    const existing = await hrService.getTransportLegExecutions({ staffId: pickupStaff.id });
                    if (!existing.some(l => l.appointmentId === updated.id && l.legType === 'pickup')) {
                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: pickupStaff.id,
                            legType: 'pickup',
                            notes: `Logística Executada (Leva) - Agendamento #${updated.seqId}`
                        });
                    }
                }
            }

            if (dropoffUserId) {
                const dropoffStaff = await hrService.getStaffProfileByUserId(dropoffUserId);
                if (dropoffStaff && dropoffStaff.isActive) {
                    const existing = await hrService.getTransportLegExecutions({ staffId: dropoffStaff.id });
                    if (!existing.some(l => l.appointmentId === updated.id && l.legType === 'dropoff')) {
                        await hrService.createTransportLegExecution({
                            appointmentId: updated.id,
                            staffId: dropoffStaff.id,
                            legType: 'dropoff',
                            notes: `Logística Executada (Traz) - Agendamento #${updated.seqId}`
                        });
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
                    id: randomUUID(),
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

export const duplicate = async (id: string, performedBy: string) => {
    const original = await (prisma.appointment as any).findUnique({
        where: { id },
        include: {
            services: true,
            transportDetails: true
        }
    });

    if (!original) throw new Error('Agendamento original não encontrado');

    // Create a new appointment based on the original
    // We reset status to PENDENTE and set a new future date (default to 1 week after original or now + 1 day)
    const originalDate = new Date(original.startAt);
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
        performerId: original.performerId,
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
// Agenda & Calendar Methods
// -------------------------------------------------------------------------

export const getWeek = async (startDate: string, endDate: string, options?: { module?: string }) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure 00:00:00 to 23:59:59
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const appointments = await (prisma.appointment as any).findMany({
        relationLoadStrategy: 'join',
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
            customer: true
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

    const appointments = await (prisma.appointment as any).findMany({
        relationLoadStrategy: 'join',
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
