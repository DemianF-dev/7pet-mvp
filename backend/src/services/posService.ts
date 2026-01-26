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
                status: OrderStatus.OPEN,
                totalAmount,
                discountAmount,
                finalAmount,
                items: {
                    create: data.items.map(item => ({
                        id: randomUUID(),
                        productId: item.productId,
                        serviceId: item.serviceId,
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
        include: { payments: true }
    });

    if (!order) throw new Error('Pedido não encontrado');
    if (order.status === OrderStatus.CANCELLED) throw new Error('Pedido cancelado');

    const totalPaidSoFar = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const newPaymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    return prisma.$transaction(async (tx) => {
        // Create payments
        for (const p of payments) {
            await tx.orderPayment.create({
                data: {
                    id: randomUUID(),
                    orderId,
                    method: p.method,
                    amount: p.amount,
                    installments: p.installments || 1,
                    notes: p.notes,
                    paidAt: new Date()
                }
            });
        }

        // Check if fully paid
        if (totalPaidSoFar + newPaymentsTotal >= order.finalAmount) {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.PAID },
                include: { items: true, payments: true, cashSession: true }
            });

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

            // Handle Financial Transactions (Credit/Debit based on Payment Method)
            if (updatedOrder.customerId) {
                // 1. Log the SALE aspect (The customer "spent" this money)
                // We use type DEBIT because it increases the customer's debt/usage in the financial ledger
                await financialService.createTransaction({
                    customerId: updatedOrder.customerId,
                    type: 'DEBIT',
                    amount: updatedOrder.finalAmount,
                    description: `Compra PDV #${updatedOrder.seqId}`,
                    category: 'PDV', // Changed from PAYMENT to PDV for filtering
                    createdBy: updatedOrder.cashSession.openedById,
                }, tx);

                for (const p of updatedOrder.payments) {
                    // 2. Log the PAYMENT aspect (The customer "paid" this money)
                    // We use type CREDIT because it reduces the customer's debt
                    await financialService.createTransaction({
                        customerId: updatedOrder.customerId,
                        type: 'CREDIT',
                        amount: p.amount,
                        description: `Pagamento PDV #${updatedOrder.seqId} (${p.method})`,
                        category: 'PDV', // Changed from PAYMENT to PDV for filtering
                        createdBy: updatedOrder.cashSession.openedById,
                    }, tx);
                }
            }

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

        if (!query || query.length < 2) {
            return { products: [], services: [] };
        }

        // Use simple case-insensitive contains for better performance
        const searchPattern = `%${query}%`;

        // Parallel queries for speed
        const [products, services] = await Promise.all([
            prisma.product.findMany({
                where: {
                    AND: [
                        { deletedAt: null },
                        {
                            OR: [
                                { name: { contains: query, mode: 'insensitive' } },
                                { description: { contains: query, mode: 'insensitive' } },
                                { sku: { contains: query, mode: 'insensitive' } }
                            ]
                        }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    stock: true,
                    sku: true,
                    category: true
                },
                take: 15
            }).catch(err => {
                logError('POS Service product search failed', err, { query });
                return [];
            }),

            prisma.service.findMany({
                where: {
                    AND: [
                        { deletedAt: null },
                        {
                            OR: [
                                { name: { contains: query, mode: 'insensitive' } },
                                { description: { contains: query, mode: 'insensitive' } }
                            ]
                        }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    basePrice: true,
                    duration: true,
                    category: true
                },
                take: 15
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
            customer: true,
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
        petName: appointment.pet.name,
        appointmentId: appointment.id,
        items
    };
};

