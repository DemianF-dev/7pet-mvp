import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
    const user = (req as any).user;
    let where = {};

    if (user.role === 'CLIENTE') {
        if (!user.customer?.id) {
            return res.status(400).json({ error: 'Perfil de cliente não encontrado' });
        }
        where = { customerId: user.customer.id, deletedAt: null };
    } else {
        where = { deletedAt: null };
    }

    const invoices = await prisma.invoice.findMany({
        where,
        include: {
            customer: {
                include: { user: true }
            },
            paymentRecords: true,
            quotes: {
                include: { items: true }
            },
            appointment: {
                include: { pet: true, services: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
});

// Middleware to restrict other routes to staff
const staffOnly = authorize(['OPERACIONAL', 'GESTAO', 'ADMIN']);

router.post('/', staffOnly, async (req, res) => {
    const { customerId, amount, dueDate, quoteIds, appointmentId, notes, billingPeriod } = req.body;
    const invoice = await prisma.invoice.create({
        data: {
            id: randomUUID(),
            customerId,
            amount,
            updatedAt: new Date(),
            dueDate: new Date(dueDate),
            notes,
            billingPeriod,
            quotes: quoteIds ? {
                connect: quoteIds.map((id: string) => ({ id }))
            } : undefined,
            appointmentId
        }
    });
    res.status(201).json(invoice);
});

router.post('/:id/payments', staffOnly, async (req, res) => {
    const { amount, method, bank, settle, useBalance } = req.body; // 'settle' force closes, 'useBalance' uses customer credit
    const paymentAmount = Number(amount);

    // 1. Process the "Real Money" payment if provided
    if (paymentAmount !== 0) {
        await prisma.paymentRecord.create({
            data: {
                invoiceId: req.params.id,
                amount: paymentAmount,
                method,
            }
        });
    }

    // 2. Process Balance Usage (Credit) if requested
    if (useBalance) {
        const invoiceForBalance = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { paymentRecords: true, customer: true }
        });

        if (invoiceForBalance && invoiceForBalance.customer.balance > 0) {
            const currentPaid = invoiceForBalance.paymentRecords.reduce((acc, p) => acc + p.amount, 0);
            const remaining = invoiceForBalance.amount - currentPaid;

            if (remaining > 0) {
                const deduction = Math.min(remaining, invoiceForBalance.customer.balance);

                // Create Payment for deduction
                await prisma.paymentRecord.create({
                    data: {
                        invoiceId: req.params.id,
                        amount: deduction,
                        method: 'SALDO_CREDITO'
                    }
                });

                // Deduct from Balance
                await prisma.customer.update({
                    where: { id: invoiceForBalance.customerId },
                    data: { balance: { decrement: deduction } }
                });

                console.log(`[FINANCE] Used ${deduction} from BALANCE for Invoice ${invoiceForBalance.id}`);
            }
        }
    }

    // Check totals
    const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
        include: { paymentRecords: true, quotes: true, customer: { include: { user: true } } }
    });

    if (invoice) {
        // Re-fetch payments to be 100% sure of current state
        const allPayments = await prisma.paymentRecord.findMany({ where: { invoiceId: invoice.id } });
        const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);

        // Notify Client about payment
        if (invoice.customer.user && paymentAmount > 0) {
            await prisma.notification.create({
                data: {
                    userId: invoice.customer.user.id,
                    title: 'Pagamento Recebido',
                    message: `Recebemos um pagamento de R$ ${paymentAmount.toFixed(2)} referente à sua fatura. Obrigado!`,
                    type: 'SYSTEM'
                }
            });
        }

        if (totalPaid > invoice.amount) {
            // CREDITO: Paid more than needed
            const credit = totalPaid - invoice.amount;
            await prisma.invoice.update({
                where: { id: req.params.id },
                data: { status: 'PAGO' }
            });
            await prisma.customer.update({
                where: { id: invoice.customerId },
                data: { balance: { increment: credit } }
            });
            // Notify Credit
            if (invoice.customer.user) {
                await prisma.notification.create({
                    data: {
                        userId: invoice.customer.user.id,
                        title: 'Crédito Gerado!',
                        message: `Você tem um novo crédito de R$ ${credit.toFixed(2)} em sua conta!`,
                        type: 'PROMO'
                    }
                });
            }

            console.log(`[FINANCE] Generated CREDIT of ${credit} for Customer ${invoice.customerId}`);
            // Sync Quotes
            if (invoice.quotes && invoice.quotes.length > 0) {
                await prisma.quote.updateMany({
                    where: { id: { in: invoice.quotes.map(q => q.id) } },
                    data: { status: 'ENCERRADO' as any }
                });
            }

        } else if (totalPaid < invoice.amount && settle) {
            // DEBITO: Force closing with less money (Debt)
            const debit = invoice.amount - totalPaid;
            await prisma.invoice.update({
                where: { id: req.params.id },
                data: { status: 'PAGO' } // Invoice is technically "Done"
            });
            await prisma.customer.update({
                where: { id: invoice.customerId },
                data: { balance: { decrement: debit } }
            });
            console.log(`[FINANCE] Generated DEBT of ${debit} for Customer ${invoice.customerId}`);
            // Sync Quotes
            if (invoice.quotes && invoice.quotes.length > 0) {
                await prisma.quote.updateMany({
                    where: { id: { in: invoice.quotes.map(q => q.id) } },
                    data: { status: 'ENCERRADO' as any }
                });
            }

        } else if (totalPaid >= invoice.amount) {
            // Exact match
            await prisma.invoice.update({
                where: { id: req.params.id },
                data: { status: 'PAGO' }
            });

            if (invoice.customer.user) {
                await prisma.notification.create({
                    data: {
                        userId: invoice.customer.user.id,
                        title: 'Fatura Paga',
                        message: `Sua fatura de R$ ${invoice.amount.toFixed(2)} foi totalmente paga.`,
                        type: 'SYSTEM'
                    }
                });
            }

            // Sync Quotes
            if (invoice.quotes && invoice.quotes.length > 0) {
                await prisma.quote.updateMany({
                    where: { id: { in: invoice.quotes.map(q => q.id) } },
                    data: { status: 'ENCERRADO' as any }
                });
            }
        }
    }

    res.status(201).json({ success: true });
});

router.delete('/:id/payments/:paymentId', staffOnly, async (req, res) => {
    try {
        const { id, paymentId } = req.params;

        const payment = await prisma.paymentRecord.findUnique({
            where: { id: paymentId },
            include: { invoice: true }
        });

        if (!payment || payment.invoiceId !== id) {
            return res.status(404).json({ error: 'Pagamento não encontrado nesta fatura' });
        }

        // If it was a credit usage, restore the balance
        if (payment.method === 'SALDO_CREDITO') {
            await prisma.customer.update({
                where: { id: payment.invoice.customerId },
                data: { balance: { increment: payment.amount } }
            });
        }

        // Delete the payment record
        await prisma.paymentRecord.delete({
            where: { id: paymentId }
        });

        // Re-evaluate invoice status
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { paymentRecords: true, quotes: true }
        });

        if (invoice) {
            const totalPaid = invoice.paymentRecords.reduce((acc, p) => acc + p.amount, 0);
            if (totalPaid < invoice.amount && invoice.status === 'PAGO') {
                await prisma.invoice.update({
                    where: { id },
                    data: { status: 'PENDENTE' }
                });

                // Also reopen quote if it was closed
                if (invoice.quotes && invoice.quotes.length > 0) {
                    await prisma.quote.updateMany({
                        where: { id: { in: invoice.quotes.map(q => q.id) } },
                        data: { status: 'APROVADO' }
                    });
                }
            }
        }

        res.json({ success: true, message: 'Pagamento cancelado com sucesso' });
    } catch (error: any) {
        console.error('Error cancelling payment:', error);
        res.status(500).json({ error: 'Erro ao cancelar pagamento', details: error.message });
    }
});



// Bulk payment endpoint
router.post('/bulk-payments', staffOnly, async (req, res) => {
    const { ids, amount, method, bank, settle, useBalance } = req.body;

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'IDs das faturas não fornecidos' });
    }

    try {
        const results = [];
        for (const id of ids) {
            // Re-use logic for each invoice
            // Note: If 'amount' is provided, we might want to split it or apply to each.
            // Usually in bulk, we either pay 'total balance' or mark fixed amount for each.
            // For now, let's assume we pay the FULL amount of each invoice if amount is not specified per-invoice.


            try {
                const invoice = await prisma.invoice.findUnique({ where: { id, deletedAt: null } });
                if (!invoice) {
                    results.push({ id, status: 'skipped', reason: 'Invoice not found or deleted' });
                    continue;
                }

                const paymentData = {
                    amount: amount || invoice.amount, // If no amount provided, pay the full amount
                    method,
                    bank,
                    settle,
                    useBalance
                };

                // Call internal logic or just repeat the logic here
                // Improved logic to ensure Quote is closed
                await processPayment(id, paymentData, (req as any).user);
                results.push({ id, status: 'processed' });
            } catch (error: any) {
                console.error(`Error processing payment for invoice ${id}:`, error);
                results.push({ id, status: 'failed', error: error.message });
            }
        }
        res.json({ success: true, processed: results.filter(r => r.status === 'processed').length, details: results });
    } catch (error: any) {
        console.error('Bulk payment error:', error);
        res.status(500).json({ error: 'Failed to process bulk payments', details: error.message });
    }
});

// Delete invoice (soft delete)
router.delete('/:id', staffOnly, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if invoice has payments
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { paymentRecords: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Fatura não encontrada' });
        }

        if (invoice.paymentRecords.length > 0) {
            return res.status(400).json({
                error: 'Não é possível excluir uma fatura que já possui pagamentos registrados.'
            });
        }

        // Soft delete
        await prisma.invoice.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Erro ao excluir fatura', details: error.message });
    }
});

// Duplicate invoice
router.post('/:id/duplicate', staffOnly, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { dueDate } = req.body;

        const original = await prisma.invoice.findUnique({
            where: { id },
            include: { quotes: true }
        });

        if (!original) {
            return res.status(404).json({ error: 'Fatura não encontrada' });
        }

        // Create duplicate with new due date (default +30 days if not provided)
        const newDueDate = dueDate
            ? new Date(dueDate)
            : new Date(new Date(original.dueDate).getTime() + 30 * 24 * 60 * 60 * 1000);

        const duplicate = await prisma.invoice.create({
            data: {
                id: randomUUID(),
                customerId: original.customerId,
                amount: original.amount,
                updatedAt: new Date(),
                dueDate: newDueDate,
                quotes: original.quotes ? {
                    connect: original.quotes.map((q: any) => ({ id: q.id }))
                } : undefined,
                appointmentId: original.appointmentId,
                status: 'PENDENTE'
            },
            include: {
                customer: true,
                quotes: true,
                paymentRecords: true
            }
        });

        res.status(201).json(duplicate);
    } catch (error: any) {
        console.error('Error duplicating invoice:', error);
        res.status(500).json({ error: 'Erro ao duplicar fatura', details: error.message });
    }
});

async function processPayment(invoiceId: string, data: any, user: any) {
    const { amount, method, bank, settle, useBalance } = data;
    const paymentAmount = Number(amount);

    // 1. Process the payment / adjustment
    if (paymentAmount !== 0) {
        await prisma.paymentRecord.create({
            data: {
                invoiceId: invoiceId,
                amount: paymentAmount,
                method,
            }
        });
    }


    if (useBalance) {
        const invoiceForBalance = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { paymentRecords: true, customer: true }
        });

        if (invoiceForBalance && invoiceForBalance.customer.balance > 0) {
            const currentPaid = invoiceForBalance.paymentRecords.reduce((acc, p) => acc + p.amount, 0);
            const remaining = invoiceForBalance.amount - currentPaid;

            if (remaining > 0) {
                const deduction = Math.min(remaining, invoiceForBalance.customer.balance);
                await prisma.paymentRecord.create({
                    data: {
                        invoiceId: invoiceId,
                        amount: deduction,
                        method: 'SALDO_CREDITO'
                    }
                });
                await prisma.customer.update({
                    where: { id: invoiceForBalance.customerId },
                    data: { balance: { decrement: deduction } }
                });
            }
        }
    }

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { paymentRecords: true, quotes: true, customer: { include: { user: true } } }
    });

    if (invoice) {
        const totalPaid = invoice.paymentRecords.reduce((acc, p) => acc + p.amount, 0);

        if (totalPaid >= invoice.amount || settle) {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAGO' }
            });

            if (invoice.quotes && invoice.quotes.length > 0) {
                await prisma.quote.updateMany({
                    where: { id: { in: invoice.quotes.map(q => q.id) } },
                    data: { status: 'ENCERRADO' as any }
                });
            }

            if (totalPaid > invoice.amount) {
                const credit = totalPaid - invoice.amount;
                await prisma.customer.update({
                    where: { id: invoice.customerId },
                    data: { balance: { increment: credit } }
                });
            } else if (totalPaid < invoice.amount && settle) {
                const debit = invoice.amount - totalPaid;
                await prisma.customer.update({
                    where: { id: invoice.customerId },
                    data: { balance: { decrement: debit } }
                });
            }
        }
    }
}

router.patch('/:id', staffOnly, async (req: Request, res: Response) => {
    const { notes, billingPeriod, dueDate, amount } = req.body;
    try {
        const updated = await prisma.invoice.update({
            where: { id: req.params.id },
            data: {
                notes,
                billingPeriod,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                amount: amount !== undefined ? Number(amount) : undefined,
                updatedAt: new Date()
            }
        });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao atualizar fatura', details: error.message });
    }
});

router.patch('/:id/status', staffOnly, async (req: Request, res: Response) => {
    const { status } = req.body;
    try {
        const updated = await prisma.invoice.update({
            where: { id: req.params.id },
            data: { status }
        });

        // Sync Quotes if Encerrado
        if ((status === 'PAGO' || status === 'ENCERRADO')) {
            const invoice = await prisma.invoice.findUnique({ where: { id: updated.id }, include: { quotes: true } });
            if (invoice && invoice.quotes.length > 0) {
                await prisma.quote.updateMany({
                    where: { id: { in: invoice.quotes.map(q => q.id) } },
                    data: { status: 'ENCERRADO' as any }
                });
            }
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

router.post('/sync', staffOnly, async (req: Request, res: Response) => {
    try {
        const sortedInvoices = await prisma.invoice.findMany({
            where: {
                quotes: { some: {} },
                deletedAt: null
            },
            include: { quotes: true, paymentRecords: true }
        });

        let updatedCount = 0;

        for (const invoice of sortedInvoices) {
            let changed = false;
            const updateData: any = {};

            // Sync Amount
            if (invoice.quotes && invoice.quotes.length > 0 && Math.abs(invoice.amount - invoice.quotes[0].totalAmount) > 0.01) {
                updateData.amount = invoice.quotes[0].totalAmount;
                changed = true;
            }

            // Sync Status based on payments
            const totalPaid = invoice.paymentRecords.reduce((acc, p) => acc + p.amount, 0);
            if (totalPaid >= (updateData.amount || invoice.amount) && invoice.status !== 'PAGO' && invoice.status !== 'ENCERRADO') {
                updateData.status = 'PAGO';
                changed = true;
            }

            if (changed) {
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: updateData
                });

                // If status became PAGO, ensure quote is closed
                if (updateData.status === 'PAGO' && invoice.quotes && invoice.quotes.length > 0) {
                    await prisma.quote.updateMany({ where: { id: { in: invoice.quotes.map(q => q.id) } }, data: { status: 'ENCERRADO' as any } });
                }

                updatedCount++;
            }
        }

        res.json({ message: 'Sync completed', updatedCount });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync' });
    }
});

// Batch Billing Route
router.post('/batch', staffOnly, async (req: Request, res: Response) => {
    try {
        const { dueDate } = req.body;
        const targetDueDate = dueDate ? new Date(dueDate) : new Date();

        // 1. Find all quotes with status FATURAR
        const quotesToBill = await prisma.quote.findMany({
            where: {
                status: 'FATURAR',
                invoiceId: null,
                deletedAt: null
            },
            include: {
                customer: true
            }
        });

        if (quotesToBill.length === 0) {
            return res.json({ message: 'Nenhum orçamento com status FATURAR encontrado.', createdCount: 0 });
        }

        // 2. Group by Customer
        const groups: Record<string, typeof quotesToBill> = {};
        quotesToBill.forEach(q => {
            if (!groups[q.customerId]) groups[q.customerId] = [];
            groups[q.customerId].push(q);
        });

        let createdCount = 0;

        // 3. Create Invoices
        for (const customerId in groups) {
            const quotes = groups[customerId];
            const totalAmount = quotes.reduce((acc, q) => acc + q.totalAmount, 0);

            // Create the consolidated invoice
            const invoice = await prisma.invoice.create({
                data: {
                    id: randomUUID(),
                    customerId,
                    amount: totalAmount,
                    updatedAt: new Date(),
                    dueDate: targetDueDate,
                    status: 'PENDENTE',
                    quotes: {
                        connect: quotes.map(q => ({ id: q.id }))
                    }
                }
            });

            // Update quotes status
            await prisma.quote.updateMany({
                where: { id: { in: quotes.map(q => q.id) } },
                data: { status: 'ENCERRADO' as any } // Mark as billed (ENCERRADO is final for financial)
            });

            createdCount++;
        }

        res.json({ message: `${createdCount} faturas geradas com sucesso.`, createdCount });
    } catch (error) {
        console.error('Batch billing error:', error);
        res.status(500).json({ error: 'Erro ao gerar faturamento em lote' });
    }
});

export default router;

