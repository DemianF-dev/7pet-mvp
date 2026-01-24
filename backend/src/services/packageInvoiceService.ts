import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { RecurrenceType, PackageInvoiceStatus, InvoiceSourceType } from '../generated';
import { startOfMonth, endOfMonth, addMonths, getYear, getMonth } from 'date-fns';

export interface CreateInvoiceInput {
    customerId: string;
    contractId?: string;
    type: RecurrenceType;
    periodYear: number;
    periodMonth: number;
    appointmentIds: string[];
    notes?: string;
    dueDate?: Date;
    createdBy: string;
}

/**
 * List appointments eligible to be included in a package
 * Filters: customer, type, specific month/year, NOT already linked, NOT cancelled
 */
export const listEligibleAppointments = async (params: {
    customerId: string;
    type: RecurrenceType;
    periodYear: number;
    periodMonth: number;
}) => {
    const { customerId, type, periodYear, periodMonth } = params;

    // Create date range for the month
    // periodMonth is 1-indexed (1=Jan)
    const startDate = new Date(periodYear, periodMonth - 1, 1);
    const endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59);

    return prisma.appointment.findMany({
        where: {
            customerId,
            category: type === 'SPA' ? 'SPA' : 'LOGISTICA',
            startAt: {
                gte: startDate,
                lte: endDate
            },
            status: {
                not: 'CANCELADO'
            },
            appointmentInvoiceLink: null, // Only those not yet linked
            deletedAt: null
        },
        include: {
            pet: true,
            services: true,
            transportDetails: true
        },
        orderBy: { startAt: 'asc' }
    });
};

/**
 * Create a new Package Invoice (Draft) grouping selected appointments
 */
export const createPackageInvoice = async (input: CreateInvoiceInput) => {
    const { customerId, contractId, type, periodYear, periodMonth, appointmentIds, notes, dueDate, createdBy } = input;

    return await prisma.$transaction(async (tx) => {
        // 1. Fetch appointments to verify ownership and calculate totals
        const appointments = await tx.appointment.findMany({
            where: {
                id: { in: appointmentIds },
                customerId,
                appointmentInvoiceLink: null,
                deletedAt: null
            },
            include: {
                services: true,
                pet: true
            }
        });

        if (appointments.length === 0 && appointmentIds.length > 0) {
            throw new Error('Nenhum agendamento elegível encontrado para os IDs fornecidos.');
        }

        // 2. Calculate subtotal (simplified: summing service prices if available, otherwise 0 or placeholder)
        // Note: Real system might have specific price logic we should reuse from POS/Quotes.
        let subtotal = 0;
        const linesData = appointments.map(appt => {
            const price = appt.services.reduce((sum, s) => sum + s.basePrice, 0); // Placeholder logic
            subtotal += price;
            return {
                sourceType: 'AGENDAMENTO' as InvoiceSourceType,
                sourceId: appt.id,
                description: `Serviço para ${appt.pet.name}: ${appt.services.map(s => s.name).join(', ') || appt.category}`,
                qty: 1,
                unitPrice: price,
                total: price
            };
        });

        // 3. Create the invoice
        const invoice = await tx.packageInvoice.create({
            data: {
                customerId,
                contractId,
                type,
                periodYear,
                periodMonth,
                status: 'RASCUNHO',
                dueDate: dueDate || new Date(periodYear, periodMonth - 1, 15), // Default to 15th
                subtotal,
                total: subtotal, // For now no discounts applied here, should come from contract
                notes,
                createdBy,
                lines: {
                    create: linesData
                },
                links: {
                    create: appointments.map(appt => ({
                        appointmentId: appt.id,
                        linkedBy: createdBy
                    }))
                }
            },
            include: {
                customer: true,
                lines: true,
                links: true
            }
        });

        await createAuditLog({
            entityType: 'PACKAGE_INVOICE' as any,
            entityId: invoice.id,
            action: 'CREATE' as any,
            performedBy: createdBy,
            reason: `Fatura de pacote criada para ${invoice.customer.name} (Ciclo ${periodMonth}/${periodYear}) com ${appointments.length} agendamentos.`
        }, tx);

        return invoice;
    });
};

/**
 * Copy an invoice structure to the next month
 */
export const copyInvoiceToNextMonth = async (sourceInvoiceId: string, createdBy: string) => {
    const source = await prisma.packageInvoice.findUnique({
        where: { id: sourceInvoiceId },
        include: { lines: true }
    });

    if (!source) throw new Error('Fatura de origem não encontrada.');

    // Calculate next period
    let nextMonth = source.periodMonth + 1;
    let nextYear = source.periodYear;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
    }

    return await prisma.$transaction(async (tx) => {
        // Create new draft invoice
        const newInvoice = await tx.packageInvoice.create({
            data: {
                customerId: source.customerId,
                contractId: source.contractId,
                type: source.type,
                periodYear: nextYear,
                periodMonth: nextMonth,
                status: 'RASCUNHO',
                dueDate: addMonths(source.dueDate, 1),
                subtotal: source.subtotal,
                discountTotal: source.discountTotal,
                total: source.total,
                notes: source.notes,
                createdBy,
                lines: {
                    create: source.lines
                        .filter(l => l.sourceType === 'AJUSTE_MANUAL') // Only copy manual adjustments? 
                        .map(l => ({
                            sourceType: l.sourceType,
                            description: l.description,
                            qty: l.qty,
                            unitPrice: l.unitPrice,
                            total: l.total
                        }))
                }
            }
        });

        await createAuditLog({
            entityType: 'PACKAGE_INVOICE' as any,
            entityId: newInvoice.id,
            action: 'CREATE' as any,
            performedBy: createdBy,
            reason: `Fatura copiada de ${source.periodMonth}/${source.periodYear} para ${nextMonth}/${nextYear}`
        }, tx);

        return newInvoice;
    });
};

/**
 * Finalize/Emit Invoice
 */
export const emitInvoice = async (id: string, emittedBy: string) => {
    return await prisma.$transaction(async (tx) => {
        const invoice = await tx.packageInvoice.update({
            where: { id },
            data: { status: 'EMITIDA' }
        });

        await createAuditLog({
            entityType: 'PACKAGE_INVOICE' as any,
            entityId: id,
            action: 'UPDATE' as any,
            performedBy: emittedBy,
            reason: 'Fatura emitida/fechada para cobrança.'
        }, tx);

        return invoice;
    });
};

export const getInvoiceById = async (id: string) => {
    return prisma.packageInvoice.findUnique({
        where: { id },
        include: {
            customer: true,
            contract: true,
            lines: {
                orderBy: { sourceType: 'asc' }
            },
            links: {
                include: {
                    appointment: {
                        include: {
                            services: true,
                            pet: true
                        }
                    }
                }
            }
        }
    });
};

export default {
    listEligibleAppointments,
    getInvoiceById,
    createPackageInvoice,
    copyInvoiceToNextMonth,
    emitInvoice
};
