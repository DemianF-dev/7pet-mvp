import prisma from '../lib/prisma';
import { RecurrenceType, PackageStatus, AppointmentStatus, PackageInvoiceStatus } from '@prisma/client';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

/**
 * Service to handle the new "Period Closing" logic.
 * It consolidates contracts and quotes into a single view per customer per period.
 */

interface PeriodFilter {
    periodYear: number;
    periodMonth: number;
}

/**
 * Calculate appointment total with proper discount handling
 * Priority: posOrder > metadata.servicePricing > transportSnapshot/services
 * All values are rounded to 2 decimal places (standard currency format)
 */
const calculateAppointmentTotal = (app: any): number => {
    // 1. POS Order takes priority (already has final prices)
    if (app.posOrder?.items) {
        const total = app.posOrder.items.reduce((sum: number, item: any) =>
            sum + (parseFloat(item.totalPrice) || 0), 0);
        return Math.round(total * 100) / 100;
    }

    // 2. Use metadata.servicePricing (values with discount already applied)
    const servicePricing = (app.metadata as any)?.servicePricing;
    if (servicePricing && Array.isArray(servicePricing) && servicePricing.length > 0) {
        const total = servicePricing.reduce((sum: number, sp: any) => {
            const price = parseFloat(sp.price) || 0;
            const discount = parseFloat(sp.discount) || 0;
            return sum + (price - discount);
        }, 0);
        return Math.round(total * 100) / 100;
    }

    // 3. Fallback for LOGISTICA: check various snapshot sources
    if (app.category === 'LOGISTICA') {
        // Check metadata.transportSnapshot first
        const metaSnapshot = (app.metadata as any)?.transportSnapshot;
        if (metaSnapshot?.totalAmount) {
            return Math.round((parseFloat(metaSnapshot.totalAmount) || 0) * 100) / 100;
        }
        // Then check the relation
        if (app.transportSnapshot?.totalAmount) {
            return Math.round((parseFloat(app.transportSnapshot.totalAmount) || 0) * 100) / 100;
        }
        // Finally check transportLegs
        if (app.transportLegs?.length > 0) {
            const total = app.transportLegs.reduce((sum: number, leg: any) =>
                sum + (parseFloat(leg.price) || 0), 0);
            return Math.round(total * 100) / 100;
        }
        return 0;
    }

    // 4. Fallback for SPA: services basePrice
    if (app.services && app.services.length > 0) {
        const total = app.services.reduce((sum: number, s: any) =>
            sum + (parseFloat(s.basePrice) || 0), 0);
        return Math.round(total * 100) / 100;
    }

    return 0;
};


export const listPeriodSummary = async ({ periodYear, periodMonth }: PeriodFilter) => {
    // 1. Get all customers who have:
    //    - Active RecurrenceContract
    //    - OR Active Recurring Quotes (proxy for package)
    //    - OR Any appointment in the period linked to a package/quote

    // For MVP efficiency, we'll start by listing all RecurrenceConstraints + Active Quotes
    // and merging them by customer.

    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    const periodEnd = endOfMonth(periodStart);

    // A. Customers with Formal Contracts
    const activeContracts = await prisma.recurrenceContract.findMany({
        where: {
            status: { in: ['ATIVO', 'PAUSADO'] }
        },
        include: { customer: true }
    });

    // B. Customers with Recurring Quotes (Heuristic: > 1 appointment in period or future)
    // This is heavier, so we might optimize later. For now, we rely on the `quoteService.listRecurringQuotes` logic
    // but adapted for bulk fetching or just fetching all customers with recent activity.
    // simpler approach for MVP: List customers with appointments in the period that are part of a sequence.

    const customersWithActivity = await prisma.customer.findMany({
        where: {
            OR: [
                { recurrenceContracts: { some: {} } }, // Has contracts
                {
                    quotes: {
                        some: {
                            status: { in: ['AGENDADO', 'APROVADO', 'FATURAR'] },
                            appointments: { some: { startAt: { gte: periodStart, lte: periodEnd } } }
                        }
                    }
                }
            ],
            isActive: true
        },
        select: {
            id: true,
            name: true,
            recurrenceContracts: {
                where: { status: 'ATIVO' }
            },
            appointments: {
                where: {
                    startAt: { gte: periodStart, lte: periodEnd },
                    status: { not: 'CANCELADO' }
                },
                include: {
                    services: true,
                    transportLegs: true,
                    transportSnapshot: true,
                    posOrder: {
                        include: { items: true }
                    }
                }
            },
            packageInvoices: {
                where: {
                    periodYear,
                    periodMonth
                }
            }
        }
    });


    // Map to summary View
    return customersWithActivity.map(c => {
        const invoice = c.packageInvoices[0]; // Assuming 1 per period per customer (or we take the latest)
        const hasContract = c.recurrenceContracts.length > 0;

        let status = 'PENDENTE';
        if (invoice) {
            status = invoice.status;
        }

        // Calculate appointment totals for the period using helper
        const appointmentTotal = (c as any).appointments.reduce((sum: number, app: any) => {
            return sum + calculateAppointmentTotal(app);
        }, 0);

        // Round final total to 2 decimal places
        const total = Math.round((appointmentTotal + (invoice?.subtotal || 0)) * 100) / 100;

        return {
            customerId: c.id,
            customerName: c.name,
            hasFormalContract: hasContract,
            status,
            invoiceId: invoice?.id,
            total
        };
    });
};

export const getStatement = async (customerId: string, { periodYear, periodMonth }: PeriodFilter) => {
    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    const periodEnd = endOfMonth(periodStart);

    // 1. Fetch "Estimated" (X) Sources
    const contracts = await prisma.recurrenceContract.findMany({
        where: { customerId, status: 'ATIVO' }
    });

    // 2. Fetch "Real" (Y) Executions (Appointments)
    const appointments = await prisma.appointment.findMany({
        where: {
            customerId,
            startAt: { gte: periodStart, lte: periodEnd },
            status: { not: 'CANCELADO' } // Or include cancelled for audit?
        },
        include: {
            services: true,
            transportLegs: true,
            transportSnapshot: true,
            pet: true,
            customer: true,
            posOrder: {
                include: {
                    items: true
                }
            }
        },
        orderBy: { startAt: 'asc' }
    });

    // 3. Fetch Existing Invoice (if any)
    let invoice = await prisma.packageInvoice.findFirst({
        where: {
            customerId,
            periodYear,
            periodMonth
        },
        include: {
            lines: true
        }
    });

    // Calculation Logic
    // X (Estimate) = Sum of Contract Values (if fixed)
    // For now, MVP assumes contract has a base value? Or we calculate from frequency?
    // Start simple: Estimate is 0 if no fixed value field on contract yet.
    // If we have Recurring Quotes, we sum their totals.

    const estimateTotal = 0; // TODO: refine based on contract metadata

    // Calculate Real Total based on executions using global helper
    const enrichedAppointments = appointments.map(app => {
        const calculatedTotal = calculateAppointmentTotal(app);
        return { ...app, calculatedTotal };
    });

    // Sum all appointment totals + invoice adjustments, round to 2 decimal places
    const realTotal = Math.round(
        (enrichedAppointments.reduce((acc, app) => acc + app.calculatedTotal, 0) +
            (invoice?.subtotal || 0)) * 100
    ) / 100;

    return {
        period: { year: periodYear, month: periodMonth },
        status: invoice?.status || 'ABERTO',
        estimateTotal,
        realTotal,
        balance: 0, // Calculate credits later
        appointments: enrichedAppointments,
        invoice,
        contracts
    };
};

export const updateStatement = async (customerId: string, { periodYear, periodMonth }: PeriodFilter, action: any, userId: string) => {
    // Handle adding extra items, adjustments to the Invoice
    // ensure invoice exists, then add line item

    let invoice = await prisma.packageInvoice.findFirst({
        where: { customerId, periodYear, periodMonth }
    });

    if (!invoice) {
        // Create Invoice Draft if not exists
        invoice = await prisma.packageInvoice.create({
            data: {
                customerId,
                periodYear,
                periodMonth,
                status: 'ABERTA' as PackageInvoiceStatus, // Cast if enum issue persists
                dueDate: endOfMonth(new Date(periodYear, periodMonth - 1, 1)), // Default due date
                subtotal: 0,
                total: 0,
                type: 'SPA' // Default, maybe infer?
            }
        });
    }

    if (action.type === 'ADD_ADJUSTMENT') {
        const amount = Math.round(Number(action.amount || 0) * 100) / 100;
        await prisma.packageInvoiceLine.create({
            data: {
                invoiceId: invoice.id,
                description: action.description,
                unitPrice: amount,
                total: amount,
                qty: 1,
                sourceType: 'AJUSTE_MANUAL'
            }
        });
    }

    // Recalculate totals
    const lines = await prisma.packageInvoiceLine.findMany({ where: { invoiceId: invoice.id } });
    const newTotal = lines.reduce((acc, l) => acc + l.total, 0);

    return await prisma.packageInvoice.update({
        where: { id: invoice.id },
        data: {
            subtotal: newTotal,
            total: newTotal // Apply discounts if needed
        },
        include: { lines: true }
    });
};

export const closePeriod = async (customerId: string, { periodYear, periodMonth }: PeriodFilter, userId: string) => {
    // 1. Double check / ensure invoice exists
    let invoice = await prisma.packageInvoice.findFirst({
        where: { customerId, periodYear, periodMonth }
    });

    if (!invoice) {
        // Create the invoice on the fly if user clicks close and it hasn't been "drafted" yet
        // We need to calculate totals for the creation
        const statement = await getStatement(customerId, { periodYear, periodMonth });

        invoice = await prisma.packageInvoice.create({
            data: {
                customerId,
                periodYear,
                periodMonth,
                status: 'ABERTA',
                dueDate: endOfMonth(new Date(periodYear, periodMonth - 1, 1)),
                subtotal: statement.realTotal, // Initial subtotal from current executions
                total: statement.realTotal,
                type: 'SPA' // Default type
            }
        });
    }

    // 2. Mark as closed
    return await prisma.packageInvoice.update({
        where: { id: invoice.id },
        data: {
            status: 'FECHADA' as PackageInvoiceStatus
        }
    });
};

export default {
    listPeriodSummary,
    getStatement,
    updateStatement,
    closePeriod
};
