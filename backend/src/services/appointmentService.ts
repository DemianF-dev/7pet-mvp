import prisma from '../lib/prisma';
import { AppointmentStatus, TransportPeriod } from '@prisma/client';

export const create = async (data: {
    customerId: string;
    petId: string;
    serviceIds: string[];
    startAt: Date;
    transport?: {
        origin: string;
        destination: string;
        requestedPeriod: TransportPeriod;
    };
}, isStaff: boolean = false) => {
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
    const existingAppointment = await prisma.appointment.findFirst({
        where: {
            startAt: data.startAt,
            deletedAt: null,
            status: { notIn: [AppointmentStatus.CANCELADO] }
        }
    });

    if (existingAppointment) {
        throw new Error('⚠️ Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.');
    }

    return prisma.appointment.create({
        data: {
            customerId: data.customerId,
            petId: data.petId,
            startAt: data.startAt,
            status: isStaff ? AppointmentStatus.CONFIRMADO : AppointmentStatus.PENDENTE,
            services: {
                connect: data.serviceIds.map(id => ({ id }))
            },
            transport: data.transport ? {
                create: data.transport
            } : undefined
        },
        include: {
            pet: true,
            services: true,
            transport: true,
            customer: {
                include: { pets: true }
            }
        }
    });
};

export const list = async (filters: { customerId?: string; status?: AppointmentStatus }) => {
    return prisma.appointment.findMany({
        where: {
            ...filters,
            deletedAt: null // Only active appointments
        },
        include: {
            pet: true,
            services: true,
            transport: true,
            customer: {
                include: { pets: true }
            }
        },
        orderBy: { startAt: 'desc' }
    });
};

export const get = async (id: string) => {
    return prisma.appointment.findUnique({
        where: { id },
        include: {
            pet: true,
            services: true,
            transport: true,
            customer: {
                include: { pets: true }
            }
        }
    });
};

export const update = async (id: string, data: any) => {
    return prisma.appointment.update({
        where: { id },
        data: {
            petId: data.petId,
            startAt: data.startAt,
            services: data.serviceIds ? {
                set: [], // Clear existing relations
                connect: data.serviceIds.map((sid: string) => ({ id: sid }))
            } : undefined,
            transport: data.transport ? {
                upsert: {
                    create: data.transport,
                    update: data.transport
                }
            } : undefined
        },
        include: {
            pet: true,
            services: true,
            transport: true,
            customer: {
                include: { pets: true }
            }
        }
    });
};

export const updateStatus = async (id: string, status: AppointmentStatus) => {
    return prisma.appointment.update({
        where: { id },
        data: { status }
    });
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
            customer: {
                include: { pets: true }
            }
        },
        orderBy: { deletedAt: 'desc' }
    });
};

// Hard Delete
export const permanentRemove = async (id: string) => {
    return prisma.appointment.delete({
        where: { id }
    });
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
                isBlocked: newNoShowCount >= 3,
                requiresPrepayment: newNoShowCount >= 3
            }
        });
    }

    return staleAppointments.length;
};

// Update Quote Status when appointment is created
export const updateQuoteStatus = async (quoteId: string) => {
    await prisma.quote.update({
        where: { id: quoteId },
        data: {
            status: 'AGENDAR',
            statusHistory: {
                create: {
                    oldStatus: 'APROVADO',
                    newStatus: 'AGENDAR',
                    changedBy: 'SYSTEM',
                    reason: 'Agendamento criado automaticamente'
                }
            }
        }
    });
};
