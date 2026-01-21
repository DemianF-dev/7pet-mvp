import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { randomUUID } from 'crypto';
import { createTransaction } from './financialService';
import { messagingService } from './messagingService';
import { createAuditLog } from '../utils/auditLogger';

/**
 * Package Service - Manages recurring packages, scheduling, and billing
 */

// ================================
// TYPES
// ================================

export interface PackageFrequencyConfig {
    frequency: 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
    minBathsPerMonth: number;
    suggestedDiscount: number;
    billingType: 'MENSAL' | 'BIMESTRAL';
}

export const FREQUENCY_CONFIG: Record<string, PackageFrequencyConfig> = {
    SEMANAL: {
        frequency: 'SEMANAL',
        minBathsPerMonth: 4,
        suggestedDiscount: 15,
        billingType: 'MENSAL'
    },
    QUINZENAL: {
        frequency: 'QUINZENAL',
        minBathsPerMonth: 2,
        suggestedDiscount: 10,
        billingType: 'MENSAL'
    },
    MENSAL: {
        frequency: 'MENSAL',
        minBathsPerMonth: 1,
        suggestedDiscount: 5,
        billingType: 'BIMESTRAL'
    }
};

export const TRANSPORT_DISCOUNT = 20; // Fixed 20% discount for store transport

export interface CreatePackageInput {
    customerId: string;
    petId: string;
    frequency: 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
    items: {
        serviceId?: string;
        description: string;
        unitPrice: number;
        quantity: number;
    }[];
    startDate: Date;
    notes?: string;
    createdBy: string;
}

export interface SchedulePackageInput {
    packageId: string;
    appointments: {
        serviceDescription: string;
        startAt: Date;
        performerId?: string;
        isTransport?: boolean;
        transportType?: 'LEVA' | 'TRAZ';
        transportOrigin?: string;
        transportDestination?: string;
    }[];
    createdBy: string;
}

export interface AddServiceToAppointmentInput {
    appointmentId: string;
    serviceId: string;
    description: string;
    price: number;
    billingAction: 'COBRAR_AGORA' | 'PROXIMO_FATURAMENTO';
    createdBy: string;
}

// ================================
// PACKAGE CALCULATION
// ================================

/**
 * Calculate package price with discounts based on frequency
 */
export const calculatePackagePrice = async (
    petId: string,
    frequency: 'SEMANAL' | 'QUINZENAL' | 'MENSAL',
    items: { serviceId?: string; description: string; unitPrice: number; quantity: number }[]
) => {
    const config = FREQUENCY_CONFIG[frequency];
    if (!config) {
        throw new Error(`Frequência inválida: ${frequency}`);
    }

    const pet = await prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
        throw new Error('Pet não encontrado');
    }

    let subtotal = 0;
    let transportTotal = 0;
    let servicesTotal = 0;

    const breakdown = items.map(item => {
        const isTransport = item.description.toLowerCase().includes('transporte');
        const discount = isTransport ? TRANSPORT_DISCOUNT : config.suggestedDiscount;
        const lineTotal = item.unitPrice * item.quantity;
        const discountAmount = lineTotal * (discount / 100);
        const finalPrice = lineTotal - discountAmount;

        if (isTransport) {
            transportTotal += finalPrice;
        } else {
            servicesTotal += finalPrice;
        }
        subtotal += finalPrice;

        return {
            ...item,
            discount,
            discountAmount,
            finalPrice
        };
    });

    return {
        frequency,
        minBathsPerMonth: config.minBathsPerMonth,
        suggestedDiscount: config.suggestedDiscount,
        billingType: config.billingType,
        transportDiscount: TRANSPORT_DISCOUNT,
        breakdown,
        subtotal,
        transportTotal,
        servicesTotal,
        monthlyTotal: subtotal
    };
};

// ================================
// PACKAGE CRUD
// ================================

/**
 * Create a recurring package from an approved quote
 */
export const createPackage = async (input: CreatePackageInput) => {
    const { customerId, petId, frequency, items, startDate, notes, createdBy } = input;

    const config = FREQUENCY_CONFIG[frequency];
    if (!config) {
        throw new Error(`Frequência inválida: ${frequency}`);
    }

    // Calculate totals
    const calculation = await calculatePackagePrice(petId, frequency, items);

    const result = await prisma.$transaction(async (tx) => {
        // Create the package
        const pkg = await tx.recurringPackage.create({
            data: {
                customerId,
                petId,
                frequency,
                discountPercent: config.suggestedDiscount,
                transportDiscount: TRANSPORT_DISCOUNT,
                monthlyTotal: calculation.monthlyTotal,
                status: 'ATIVO',
                startDate,
                billingType: config.billingType,
                notes,
                items: {
                    create: calculation.breakdown.map(item => ({
                        id: randomUUID(),
                        serviceId: item.serviceId,
                        description: item.description,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                        discount: item.discount,
                        finalPrice: item.finalPrice
                    }))
                }
            },
            include: {
                customer: { include: { user: true } },
                pet: true,
                items: true
            }
        });

        // Audit log
        await createAuditLog({
            entityType: 'PACKAGE',
            entityId: pkg.id,
            action: 'CREATE',
            performedBy: createdBy,
            reason: `Pacote ${frequency} criado para ${pkg.pet.name}`
        }, tx);

        return pkg;
    });

    Logger.info(`[PackageService] Package created: ${result.id} for customer ${customerId}`);
    return result;
};

/**
 * Get package by ID with all relations
 */
export const getPackageById = async (packageId: string) => {
    return prisma.recurringPackage.findUnique({
        where: { id: packageId },
        include: {
            customer: { include: { user: true } },
            pet: true,
            items: { include: { service: true } },
            appointments: {
                where: { deletedAt: null },
                orderBy: { startAt: 'asc' },
                include: { transportDetails: true }
            },
            quotes: true,
            debitCredits: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });
};

/**
 * List packages for a customer
 */
export const listPackagesByCustomer = async (customerId: string, status?: string) => {
    const where: any = { customerId };
    if (status) where.status = status;

    return prisma.recurringPackage.findMany({
        where,
        include: {
            pet: true,
            items: true,
            _count: {
                select: { appointments: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Update package status
 */
export const updatePackageStatus = async (
    packageId: string,
    status: 'ATIVO' | 'PAUSADO' | 'CANCELADO' | 'ENCERRADO',
    reason: string,
    updatedBy: string
) => {
    const pkg = await prisma.recurringPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new Error('Pacote não encontrado');

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.recurringPackage.update({
            where: { id: packageId },
            data: { status }
        });

        await createAuditLog({
            entityType: 'PACKAGE',
            entityId: packageId,
            action: 'UPDATE_STATUS',
            performedBy: updatedBy,
            reason: `Status alterado de ${pkg.status} para ${status}: ${reason}`
        }, tx);

        return result;
    });

    Logger.info(`[PackageService] Package ${packageId} status updated to ${status}`);
    return updated;
};

// ================================
// PACKAGE SCHEDULING
// ================================

/**
 * Schedule all appointments for a package month
 */
export const schedulePackageMonth = async (input: SchedulePackageInput) => {
    const { packageId, appointments, createdBy } = input;

    const pkg = await prisma.recurringPackage.findUnique({
        where: { id: packageId },
        include: { customer: true, pet: true }
    });

    if (!pkg) throw new Error('Pacote não encontrado');
    if (pkg.status !== 'ATIVO') throw new Error('Pacote não está ativo');

    // Check availability for all dates
    const conflicts = await checkAvailability(appointments.map(a => a.startAt));
    if (conflicts.length > 0) {
        return {
            success: false,
            conflicts,
            message: 'Existem conflitos de horário'
        };
    }

    const result = await prisma.$transaction(async (tx) => {
        const createdAppointments = [];

        for (const appt of appointments) {
            const appointmentData: any = {
                customer: { connect: { id: pkg.customerId } },
                pet: { connect: { id: pkg.petId } },
                recurringPackage: { connect: { id: packageId } },
                startAt: appt.startAt,
                status: 'CONFIRMADO',
                category: appt.isTransport ? 'LOGISTICA' : 'SPA',
                performer: appt.performerId ? { connect: { id: appt.performerId } } : undefined
            };

            if (appt.isTransport && appt.transportType) {
                appointmentData.transportDetails = {
                    create: {
                        origin: appt.transportOrigin || (appt.transportType === 'LEVA' ? 'Endereço do Cliente' : '7Pet'),
                        destination: appt.transportDestination || (appt.transportType === 'LEVA' ? '7Pet' : 'Endereço do Cliente'),
                        requestedPeriod: 'MANHA',
                        type: appt.transportType
                    }
                };
            }

            const created = await tx.appointment.create({
                data: appointmentData,
                include: { transportDetails: true }
            });

            createdAppointments.push(created);
        }

        // Audit log
        await createAuditLog({
            entityType: 'PACKAGE',
            entityId: packageId,
            action: 'SCHEDULE_MONTH',
            performedBy: createdBy,
            reason: `${createdAppointments.length} agendamentos criados para o pacote`
        }, tx);

        return createdAppointments;
    });

    // Notify customer
    if (pkg.customer) {
        const customer = await prisma.customer.findUnique({
            where: { id: pkg.customerId },
            include: { user: true }
        });

        if (customer?.user) {
            await messagingService.notifyUser(
                customer.user.id,
                'Agendamentos do Pacote Confirmados!',
                `Olá ${customer.name}! Seus agendamentos do pacote ${pkg.frequency} para ${pkg.pet?.name || 'seu pet'} foram confirmados. Confira as datas no seu painel.`,
                'APPOINTMENT_CONFIRMED'
            );
        }
    }

    Logger.info(`[PackageService] Scheduled ${result.length} appointments for package ${packageId}`);

    return {
        success: true,
        appointments: result,
        message: `${result.length} agendamentos criados com sucesso`
    };
};

/**
 * Check availability for multiple dates
 */
export const checkAvailability = async (dates: Date[]): Promise<{ date: Date; reason: string }[]> => {
    // For now, just return empty (no conflicts)
    // In production, this would check against existing appointments, performer schedules, etc.
    return [];
};

// ================================
// DEBIT/CREDIT NOTES
// ================================

/**
 * Add a service to an existing appointment with billing options
 */
export const addServiceToAppointment = async (input: AddServiceToAppointmentInput) => {
    const { appointmentId, serviceId, description, price, billingAction, createdBy } = input;

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            customer: { include: { user: true } },
            recurringPackage: true
        }
    });

    if (!appointment) throw new Error('Agendamento não encontrado');

    const result = await prisma.$transaction(async (tx) => {
        // 1. Add service to appointment
        if (serviceId) {
            await tx.appointment.update({
                where: { id: appointmentId },
                data: {
                    services: {
                        connect: { id: serviceId }
                    }
                }
            });
        }

        // 2. Create debit/credit note based on billing action
        const note = await tx.debitCreditNote.create({
            data: {
                customerId: appointment.customerId,
                appointmentId,
                packageId: appointment.recurringPackageId,
                type: 'DEBITO',
                amount: price,
                description: `Serviço adicional: ${description}`,
                status: billingAction === 'COBRAR_AGORA' ? 'QUITADO' : 'PENDENTE',
                billingAction
            }
        });

        // 3. If charge now, create a financial transaction as paid
        if (billingAction === 'COBRAR_AGORA') {
            await createTransaction({
                customerId: appointment.customerId,
                type: 'DEBIT',
                amount: price,
                description: `Serviço adicional: ${description} (Pago)`,
                category: 'QUOTE',
                createdBy,
                notes: `Agendamento: ${appointmentId}`
            });

            // Immediately credit as payment
            await createTransaction({
                customerId: appointment.customerId,
                type: 'CREDIT',
                amount: price,
                description: `Pagamento: ${description}`,
                category: 'PAYMENT',
                createdBy,
                notes: `Agendamento: ${appointmentId}`
            });
        } else {
            // Add to customer debit for next billing
            await createTransaction({
                customerId: appointment.customerId,
                type: 'DEBIT',
                amount: price,
                description: `Serviço adicional (próximo faturamento): ${description}`,
                category: 'QUOTE',
                createdBy,
                notes: `Agendamento: ${appointmentId}, Nota: ${note.id}`
            });
        }

        // Audit log
        await createAuditLog({
            entityType: 'APPOINTMENT',
            entityId: appointmentId,
            action: 'ADD_SERVICE',
            performedBy: createdBy,
            reason: `Serviço adicional: ${description} - R$ ${price.toFixed(2)} - ${billingAction}`
        }, tx);

        return note;
    });

    Logger.info(`[PackageService] Service added to appointment ${appointmentId}: ${description}`);

    return result;
};

/**
 * Get pending debit/credit notes for a customer
 */
export const getPendingNotes = async (customerId: string) => {
    return prisma.debitCreditNote.findMany({
        where: {
            customerId,
            status: 'PENDENTE'
        },
        include: {
            appointment: {
                select: { id: true, startAt: true, category: true }
            },
            package: {
                select: { id: true, frequency: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Settle a pending note (apply to next billing or mark as paid)
 */
export const settleNote = async (
    noteId: string,
    action: 'QUITADO' | 'ABATIDO',
    settledBy: string
) => {
    const note = await prisma.debitCreditNote.findUnique({ where: { id: noteId } });
    if (!note) throw new Error('Nota não encontrada');
    if (note.status !== 'PENDENTE') throw new Error('Nota já foi processada');

    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.debitCreditNote.update({
            where: { id: noteId },
            data: { status: action }
        });

        if (action === 'QUITADO') {
            // Record payment
            await createTransaction({
                customerId: note.customerId,
                type: 'CREDIT',
                amount: note.amount,
                description: `Pagamento nota: ${note.description}`,
                category: 'PAYMENT',
                createdBy: settledBy,
                notes: `Nota: ${noteId}`
            });
        }

        return result;
    });

    Logger.info(`[PackageService] Note ${noteId} settled as ${action}`);
    return updated;
};

// ================================
// QUOTE INTEGRATION
// ================================

/**
 * Create a recurring quote with package calculation
 */
export const createRecurringQuote = async (
    customerId: string,
    petId: string,
    frequency: 'SEMANAL' | 'QUINZENAL' | 'MENSAL',
    items: { serviceId?: string; description: string; unitPrice: number; quantity: number }[],
    options: {
        cardFeePercent?: number;
        taxPercent?: number;
        notes?: string;
        createdBy: string;
    }
) => {
    const calculation = await calculatePackagePrice(petId, frequency, items);
    const config = FREQUENCY_CONFIG[frequency];

    // Apply card fee and tax if provided
    let finalTotal = calculation.subtotal;
    let cardFeeAmount = 0;
    let taxAmount = 0;

    if (options.cardFeePercent && options.cardFeePercent > 0) {
        cardFeeAmount = finalTotal * (options.cardFeePercent / 100);
        finalTotal += cardFeeAmount;
    }

    if (options.taxPercent && options.taxPercent > 0) {
        taxAmount = finalTotal * (options.taxPercent / 100);
        finalTotal += taxAmount;
    }

    const quote = await prisma.quote.create({
        data: {
            customerId,
            petId,
            isRecurring: true,
            frequency,
            packageDiscount: config.suggestedDiscount,
            cardFeePercent: options.cardFeePercent,
            taxPercent: options.taxPercent,
            totalAmount: finalTotal,
            status: 'CALCULADO',
            type: 'SPA',
            notes: options.notes,
            items: {
                create: calculation.breakdown.map(item => ({
                    id: randomUUID(),
                    description: item.description,
                    quantity: item.quantity,
                    price: item.finalPrice,
                    serviceId: item.serviceId,
                    discount: item.discount
                }))
            }
        },
        include: {
            customer: true,
            pet: true,
            items: true
        }
    });

    Logger.info(`[PackageService] Recurring quote created: ${quote.id}`);

    return {
        quote,
        calculation: {
            ...calculation,
            cardFeeAmount,
            taxAmount,
            finalTotal
        }
    };
};

export default {
    calculatePackagePrice,
    createPackage,
    getPackageById,
    listPackagesByCustomer,
    updatePackageStatus,
    schedulePackageMonth,
    checkAvailability,
    addServiceToAppointment,
    getPendingNotes,
    settleNote,
    createRecurringQuote,
    FREQUENCY_CONFIG,
    TRANSPORT_DISCOUNT
};
