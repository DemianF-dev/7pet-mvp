import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

/**
 * Financial Service - Manages customer financial transactions and balance
 */

interface CreateTransactionParams {
    customerId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string;
    category?: 'QUOTE' | 'PAYMENT' | 'ADJUSTMENT' | 'DISCOUNT' | 'PENALTY' | 'PDV';
    relatedQuoteId?: string;
    relatedInvoiceId?: string;
    createdBy: string;
    notes?: string;
}

/**
 * Create a financial transaction and update customer balance
 */
export const createTransaction = async (params: CreateTransactionParams, tx?: any) => {
    const { customerId, type, amount, createdBy, ...rest } = params;
    const client = tx || prisma;

    // Create transaction
    const transaction = await client.financialTransaction.create({
        data: {
            customerId,
            type,
            amount,
            createdBy,
            ...rest
        },
        include: {
            customer: true,
            quote: true,
            invoice: true
        }
    });

    // Update customer balance
    const balanceChange = type === 'DEBIT' ? amount : -amount;
    await client.customer.update({
        where: { id: customerId },
        data: {
            balance: {
                increment: balanceChange
            }
        }
    });

    // Auto-create alert if balance crosses thresholds
    const updatedCustomer = await client.customer.findUnique({ where: { id: customerId } });
    if (updatedCustomer) {
        await createAutoAlert(customerId, updatedCustomer.balance, createdBy, tx);
    }

    return transaction;
};

/**
 * Calculate current balance from all transactions
 */
export const calculateBalance = async (customerId: string): Promise<number> => {
    const transactions = await prisma.financialTransaction.findMany({
        where: { customerId }
    });

    const balance = transactions.reduce((acc, t) => {
        return t.type === 'DEBIT' ? acc + t.amount : acc - t.amount;
    }, 0);

    return balance;
};

/**
 * Get transaction history with pagination and filters
 */
export const getTransactionHistory = async (
    customerId: string,
    filters?: {
        type?: 'DEBIT' | 'CREDIT';
        category?: string;
        skip?: number;
        take?: number;
    }
) => {
    const { type, category, skip = 0, take = 50 } = filters || {};

    const where: any = { customerId };
    if (type) where.type = type;
    if (category) where.category = category;

    const [transactions, total] = await Promise.all([
        prisma.financialTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            include: {
                quote: {
                    select: { id: true, seqId: true, status: true }
                },
                invoice: {
                    select: { id: true, amount: true, status: true }
                }
            }
        }),
        prisma.financialTransaction.count({ where })
    ]);

    return { transactions, total, hasMore: skip + take < total };
};

/**
 * Auto-create alerts based on balance thresholds
 */
export const createAutoAlert = async (customerId: string, balance: number, createdBy: string, tx?: any) => {
    const client = tx || prisma;
    // Check if similar alert already exists
    const existingAlerts = await client.customerAlert.findMany({
        where: {
            customerId,
            isActive: true,
            type: { in: ['WARNING', 'CRITICAL'] as any }
        }
    });

    // If balance is critical (< -1000)
    if (balance < -1000 && !existingAlerts.some((a: any) => a.type === 'CRITICAL')) {
        await client.customerAlert.create({
            data: {
                id: randomUUID(),
                customerId,
                type: 'CRITICAL',
                title: '🔴 Débito Crítico',
                message: `Cliente possui débito de R$ ${Math.abs(balance).toFixed(2)}. Ação urgente necessária.`,
                createdBy
            }
        });
    }
    // If balance is warning level (< -500)
    else if (balance < -500 && !existingAlerts.some((a: any) => a.type === 'WARNING')) {
        await client.customerAlert.create({
            data: {
                id: randomUUID(),
                customerId,
                type: 'WARNING',
                title: '⚠️ Débito Elevado',
                message: `Cliente deve R$ ${Math.abs(balance).toFixed(2)}. Monitorar próximos atendimentos.`,
                createdBy
            }
        });
    }
    // Resolve alerts if balance improved
    else if (balance >= -500) {
        await client.customerAlert.updateMany({
            where: {
                customerId,
                isActive: true,
                type: { in: ['WARNING', 'CRITICAL'] as any }
            },
            data: {
                isActive: false,
                resolvedAt: new Date(),
                resolvedBy: createdBy
            }
        });
    }
};

/**
 * Sync balance - recalculate from scratch
 */
export const syncBalance = async (customerId: string) => {
    const calculatedBalance = await calculateBalance(customerId);

    await prisma.customer.update({
        where: { id: customerId },
        data: { balance: calculatedBalance }
    });

    return calculatedBalance;
};
