import prisma from '../lib/prisma';
import {
    OrderStatus,
    CashSessionStatus,
    OrderPaymentMethod,
    InventoryMovementType
} from '@prisma/client';
import { randomUUID } from 'crypto';
import * as financialService from './financialService';
import { logInfo, logError } from '../utils/logger';

/**
 * CASH SESSION MANAGEMENT
 */

export const openCashSession = async (data: {
    openedById: string;
    openingBalance: number;
    notes?: string;
}) => {
    // Ensure no other session is open for this user (or generally, depending on business rule)
    const activeSession = await prisma.cashSession.findFirst({
        where: { status: CashSessionStatus.OPEN }
    });

    if (activeSession) {
        throw new Error('Já existe um caixa aberto. Feche-o antes de abrir um novo.');
    }

    return prisma.cashSession.create({
        data: {
            id: randomUUID(),
            openedById: data.openedById,
            openingBalance: data.openingBalance,
            notes: data.notes,
            status: CashSessionStatus.OPEN
        }
    });
};

export const getActiveCashSession = async () => {
    return prisma.cashSession.findFirst({
        where: { status: CashSessionStatus.OPEN },
        include: {
            openedBy: { select: { name: true } }
        }
    });
};

export const closeCashSession = async (id: string, data: {
    closedById: string;
    closingBalance: number;
    notes?: string;
}) => {
    const session = await prisma.cashSession.findUnique({
        where: { id }
    });

    if (!session) throw new Error('Caixa não encontrado');
    if (session.status === CashSessionStatus.CLOSED) throw new Error('Caixa já está fechado');

    // For now, use a simple calculation
    // In production, you'd want to properly calculate from payments
    const expectedClosingBalance = session.openingBalance;

    return prisma.cashSession.update({
        where: { id },
        data: {
            closedAt: new Date(),
            closedById: data.closedById,
            closingBalance: data.closingBalance,
            expectedClosingBalance,
            status: CashSessionStatus.CLOSED,
            notes: data.notes
        }
    });
};

/**
 * ORDER MANAGEMENT
 */

export const createOrder = async (data: {
    customerId?: string;
    cashSessionId: string;
    sellerId?: string;
    paymentCondition?: string;
    items: Array<{
        productId?: string;
        serviceId?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
    }>;
    appointmentId?: string;
    globalDiscount?: number;
}) => {
    const itemsTotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const itemsDiscount = data.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const globalDiscount = data.globalDiscount || 0;

    const totalAmount = itemsTotal;
    const discountAmount = itemsDiscount + globalDiscount;
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    return prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
            data: {
                id: randomUUID(),
                customerId: data.customerId,
                cashSessionId: data.cashSessionId,
                sellerId: data.sellerId,
                paymentCondition: data.paymentCondition || 'À Vista',
                status: OrderStatus.OPEN,
                totalAmount,
                discountAmount,
                finalAmount,
                items: {
                    create: data.items.map(item => ({
                        id: randomUUID(),
                        productId: item.productId || null,
                        serviceId: item.serviceId || null,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount || 0,
                        totalPrice: (item.unitPrice * item.quantity) - (item.discount || 0)
                    }))
                }
            }
        });

        // Link to appointment if provided
        if (data.appointmentId) {
            await tx.appointment.update({
                where: { id: data.appointmentId },
                data: { posOrderId: order.id }
            });
        }

        // Create Financial Transaction (DEBIT) for the sale immediately if customer is present
        if (data.customerId) {
            await financialService.createTransaction({
                customerId: data.customerId,
                type: 'DEBIT',
                amount: finalAmount,
                description: `Venda PDV #${order.seqId}`,
                category: 'PDV',
                relatedOrderId: order.id,
                createdBy: data.sellerId || 'SYSTEM',
            }, tx);
        }

        return order;
    });
};

export const addPayment = async (orderId: string, payments: Array<{
    method: OrderPaymentMethod;
    amount: number;
    installments?: number;
    notes?: string;
}>) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            payments: true,
            appointment: {
                include: {
                    invoice: true,
                    quote: true,
                    invoiceLines: true
                }
            }
        }
    });

    if (!order) throw new Error('Pedido não encontrado');
    if (order.status === OrderStatus.CANCELLED) throw new Error('Pedido cancelado');

    const totalPaidSoFar = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    return prisma.$transaction(async (tx) => {
        // Create payments
        for (const p of payments) {
            const paymentId = randomUUID();

            if (p.method === 'PAYROLL_DEDUCTION') {
                if (!order.customerId) throw new Error('Pagamento em folha requer um cliente identificado.');

                const customer = await tx.customer.findUnique({
                    where: { id: order.customerId },
                    include: { user: { include: { staffProfile: true } } }
                });

                if (!customer?.user?.staffProfile) {
                    throw new Error('Cliente não é colaborador. Pagamento em folha indisponível.');
                }

                await tx.staffPayAdjustment.create({
                    data: {
                        id: randomUUID(),
                        staffId: customer.user.staffProfile.id,
                        staffPayPeriodId: null,
                        type: 'POS_PURCHASE',
                        amount: p.amount,
                        direction: 'DEBIT',
                        reason: `Compra PDV #${order.seqId}`,
                        orderId: order.id,
                        createdById: 'SYSTEM'
                    }
                });
            }

            await tx.orderPayment.create({
                data: {
                    id: paymentId,
                    orderId,
                    method: p.method,
                    amount: p.amount,
                    installments: p.installments || 1,
                    notes: p.notes,
                    paidAt: new Date()
                }
            });

            // Registrar Crédito Individual no Financeiro
            if (order.customerId) {
                await financialService.createTransaction({
                    customerId: order.customerId,
                    type: 'CREDIT',
                    amount: p.amount,
                    description: `Pagamento Cupom #${order.seqId} (${p.method})`,
                    category: 'PDV',
                    relatedOrderId: order.id,
                    createdBy: 'SYSTEM',
                }, tx);
            }

            // Sync with Invoice (if exists, directly or via quote, or via invoice lines)
            const invoiceId = order.appointment?.invoice?.id ||
                order.appointment?.quote?.invoiceId ||
                order.appointment?.invoiceLines?.[0]?.invoiceId;
            if (invoiceId) {
                await tx.paymentRecord.create({
                    data: {
                        invoiceId,
                        amount: p.amount,
                        method: p.method as string,
                        paidAt: new Date()
                    }
                });
            }
        }

        // Check if fully paid
        if (totalPaidSoFar + newPaymentsTotal >= order.finalAmount) {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.PAID },
                include: { items: true, payments: true, cashSession: true, appointment: true }
            });

            // Handle Appointment Billing Status Sync
            if (updatedOrder.appointment) {
                await tx.appointment.update({
                    where: { id: updatedOrder.appointment.id },
                    data: { billingStatus: 'PAID' }
                });

                // Sync Invoice Status if found (directly, via quote, or via invoice lines)
                const invoiceId = order.appointment?.invoice?.id ||
                    order.appointment?.quote?.invoiceId ||
                    order.appointment?.invoiceLines?.[0]?.invoiceId;
                if (invoiceId) {
                    // Verificamos se a fatura já atingiu o valor total com este pagamento final
                    const invoice = await tx.invoice.findUnique({
                        where: { id: invoiceId },
                        include: { paymentRecords: true }
                    });

                    if (invoice) {
                        const totalInvoicePaid = invoice.paymentRecords.reduce((s, pr) => s + pr.amount, 0);
                        if (totalInvoicePaid >= invoice.amount) {
                            await tx.invoice.update({
                                where: { id: invoiceId },
                                data: { status: 'PAGO' }
                            });
                        }
                    }
                }
            }

            // Handle Inventory Low (Baixa de Estoque)
            for (const item of updatedOrder.items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });

                    await tx.inventoryMovement.create({
                        data: {
                            id: randomUUID(),
                            productId: item.productId,
                            type: InventoryMovementType.SALE,
                            quantity: -item.quantity,
                            orderId: orderId,
                            reason: `Venda PDV #${updatedOrder.seqId}`
                        }
                    });
                }
            }

            // O Débito da venda agora é registrado imediatamente no createOrder para permitir conciliação parcial
            // Os Créditos são registrados individualmente acima para cada pagamento realizado

            return updatedOrder;
        }

        return tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    }, {
        timeout: 20000 // Increase timeout to 20s for complex POS finalization
    });
};

export const cancelOrder = async (orderId: string, reason: string, actorId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true }
    });

    if (!order) throw new Error('Pedido não encontrado');
    if (order.status === OrderStatus.CANCELLED) throw new Error('Pedido já cancelado');

    return prisma.$transaction(async (tx) => {
        // 1. Update order status
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CANCELLED,
                returnReason: reason
            }
        });

        // 2. Revert stock if PAID
        if (order.status === 'PAID') {
            for (const item of order.items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    });

                    await tx.inventoryMovement.create({
                        data: {
                            id: randomUUID(),
                            productId: item.productId,
                            type: InventoryMovementType.RETURN,
                            quantity: item.quantity,
                            orderId: orderId,
                            reason: `Cancelamento PDV #${order.seqId}: ${reason}`
                        }
                    });
                }
            }

            // 3. Revert Financial Transactions (Debit becomes Credit, Credit becomes Debit)
            if (order.customerId) {
                // Revert Sale (DEBIT -> CREDIT)
                await financialService.createTransaction({
                    customerId: order.customerId,
                    type: 'CREDIT',
                    amount: order.finalAmount,
                    description: `ESTORNO: Compra PDV #${order.seqId}`,
                    category: 'PDV',
                    createdBy: actorId,
                    notes: reason
                }, tx);

                // Revert Payments (CREDIT -> DEBIT)
                for (const p of order.payments) {
                    await financialService.createTransaction({
                        customerId: order.customerId,
                        type: 'DEBIT',
                        amount: p.amount,
                        description: `ESTORNO: Pagamento PDV #${order.seqId} (${p.method})`,
                        category: 'PDV',
                        createdBy: actorId,
                        notes: reason
                    }, tx);
                }
            }
        }

        return updatedOrder;
    });
};

export const getOrderDetails = async (orderId: string) => {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
            payments: true,
            customer: true,
            cashSession: {
                include: { openedBy: { select: { name: true } } }
            }
        }
    });
};

/**
 * UTILS
 */

export const searchPOSItems = async (query: string) => {
    try {
        const startTime = Date.now();

        // Build product where clause
        const whereProducts: any = { deletedAt: null };
        if (query && query.trim().length > 0) {
            whereProducts.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } }
            ];
        }

        // Build service where clause
        const whereServices: any = { deletedAt: null };
        if (query && query.trim().length > 0) {
            whereServices.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ];
        }

        // Parallel queries for speed
        const [products, services] = await Promise.all([
            prisma.product.findMany({
                where: whereProducts,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    stock: true,
                    sku: true,
                    category: true
                },
                take: 50
            }).catch(err => {
                logError('POS Service product search failed', err, { query });
                return [];
            }),

            prisma.service.findMany({
                where: whereServices,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    basePrice: true,
                    duration: true,
                    category: true
                },
                take: 50
            }).catch(err => {
                logError('POS Service service search failed', err, { query });
                return [];
            })
        ]);

        const duration = Date.now() - startTime;
        logInfo('POS Service search completed', {
            duration: `${duration}ms`,
            productsCount: products.length,
            servicesCount: services.length,
            query
        });

        return { products, services };
    } catch (error: any) {
        logError('POS Service critical error', error, { query });
        return { products: [], services: [] };
    }
};

export const getCheckoutDataFromAppointment = async (appointmentId: string) => {
    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            services: true,
            customer: {
                include: {
                    user: {
                        include: { staffProfile: true }
                    }
                }
            },
            pet: true,
            quote: { include: { items: true } }
        }
    });

    if (!appointment) throw new Error('Agendamento não encontrado');

    // Aggregate items from appointment and linked quote
    const items = [];

    // Add services explicitly linked to appointment
    for (const svc of appointment.services) {
        items.push({
            serviceId: svc.id,
            description: `Serviço: ${svc.name} (${appointment.pet.name})`,
            quantity: 1,
            unitPrice: svc.basePrice,
            discount: 0
        });
    }

    // Add other items from quote (e.g. transport, products)
    if (appointment.quote) {
        for (const item of appointment.quote.items) {
            // Avoid duplicating services already added
            if (item.serviceId && appointment.services.some(s => s.id === item.serviceId)) continue;

            items.push({
                productId: item.productId || undefined,
                serviceId: item.serviceId || undefined,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.price,
                discount: item.discount
            });
        }
    }

    return {
        customerId: appointment.customerId,
        customerName: appointment.customer.name,
        isStaff: !!appointment.customer?.user?.staffProfile,
        petName: appointment.pet.name,
        appointmentId: appointment.id,
        items
    };
};

export const listRecentOrders = async (limit: number = 20) => {
    return prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            customer: { select: { name: true, phone: true } },
            items: true,
            payments: true,
            cashSession: {
                include: { openedBy: { select: { name: true } } }
            }
        }
    });
};

