import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
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
        where = { customerId: user.customer.id };
    }

    const invoices = await prisma.invoice.findMany({
        where,
        include: {
            customer: {
                include: { user: true }
            },
            payments: true,
            quote: {
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
    const { customerId, amount, dueDate, quoteId, appointmentId } = req.body;
    const invoice = await prisma.invoice.create({
        data: {
            customerId,
            amount,
            dueDate: new Date(dueDate),
            quoteId,
            appointmentId
        }
    });
    res.status(201).json(invoice);
});

router.post('/:id/payments', staffOnly, async (req, res) => {
    const { amount, method, bank, settle, useBalance } = req.body; // 'settle' force closes, 'useBalance' uses customer credit
    const paymentAmount = Number(amount);

    // 1. Process the "Real Money" payment if provided
    if (paymentAmount > 0) {
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
            include: { payments: true, customer: true }
        });

        if (invoiceForBalance && invoiceForBalance.customer.balance > 0) {
            const currentPaid = invoiceForBalance.payments.reduce((acc, p) => acc + p.amount, 0);
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
        include: { payments: true, customer: { include: { user: true } } }
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
            // Sync Quote
            if (invoice.quoteId) {
                await prisma.quote.update({ where: { id: invoice.quoteId }, data: { status: 'ENCERRADO' as any } });
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
            // Sync Quote
            if (invoice.quoteId) {
                await prisma.quote.update({ where: { id: invoice.quoteId }, data: { status: 'ENCERRADO' as any } });
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

            // Sync Quote
            if (invoice.quoteId) {
                await prisma.quote.update({ where: { id: invoice.quoteId }, data: { status: 'ENCERRADO' as any } });
            }
        }
    }

    res.status(201).json({ success: true });
});

router.patch('/:id/status', staffOnly, async (req: Request, res: Response) => {
    const { status } = req.body;
    try {
        const updated = await prisma.invoice.update({
            where: { id: req.params.id },
            data: { status }
        });

        // Sync Quote if Encerrado
        if ((status === 'PAGO' || status === 'ENCERRADO') && updated.quoteId) {
            await prisma.quote.update({ where: { id: updated.quoteId }, data: { status: 'ENCERRADO' as any } });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

router.post('/sync', staffOnly, async (req: Request, res: Response) => {
    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                quoteId: { not: null },
                status: { notIn: ['PAGO', 'ENCERRADO', 'NEGOCIADO'] }
            },
            include: { quote: true }
        });

        let updatedCount = 0;

        for (const invoice of invoices) {
            if (invoice.quote && invoice.amount !== invoice.quote.totalAmount) {
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { amount: invoice.quote.totalAmount }
                });
                updatedCount++;
            }
        }

        res.json({ message: 'Sync completed', updatedCount });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync' });
    }
});

export default router;
