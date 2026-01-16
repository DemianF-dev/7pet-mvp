import prisma from '../lib/prisma';

/**
 * Financial Service - Manages customer financial transactions and balance
 */

interface CreateTransactionParams {
    customerId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string;
    category?: 'QUOTE' | 'PAYMENT' | 'ADJUSTMENT' | 'DISCOUNT' | 'PENALTY';
    relatedQuoteId?: string;
    relatedInvoiceId?: string;
    createdBy: string;
    notes?: string;
}

/**
 * Create a financial transaction and update customer balance
 */
export const createTransaction = async (params: CreateTransactionParams) => {
    const { customerId, type, amount, createdBy, ...rest } = params;

    // Create transaction
    const transaction = await prisma.financialTransaction.create({
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
    await prisma.customer.update({
        where: { id: customerId },
        data: {
            balance: {
                increment: balanceChange
            }
        }
    });

    // Auto-create alert if balance crosses thresholds
    const updatedCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (updatedCustomer) {
        await createAutoAlert(customerId, updatedCustomer.balance, createdBy);
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
export const createAutoAlert = async (customerId: string, balance: number, createdBy: string) => {
    // Check if similar alert already exists
    const existingAlerts = await prisma.customerAlert.findMany({
        where: {
            customerId,
            isActive: true,
            type: { in: ['WARNING', 'CRITICAL'] }
        }
    });

    // If balance is critical (< -1000)
    if (balance < -1000 && !existingAlerts.some(a => a.type === 'CRITICAL')) {
        await prisma.customerAlert.create({
            data: {
                id: crypto.randomUUID(),
                customerId,
                type: 'CRITICAL',
                title: '🔴 Débito Crítico',
                message: `Cliente possui débito de R$ ${Math.abs(balance).toFixed(2)}. Ação urgente necessária.`,
                createdBy
            }
        });
    }
    // If balance is warning level (< -500)
    else if (balance < -500 && !existingAlerts.some(a => a.type === 'WARNING')) {
        await prisma.customerAlert.create({
            data: {
                id: crypto.randomUUID(),
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
        await prisma.customerAlert.updateMany({
            where: {
                customerId,
                isActive: true,
                type: { in: ['WARNING', 'CRITICAL'] }
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
