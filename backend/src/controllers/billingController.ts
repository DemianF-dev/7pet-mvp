import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import * as auditService from '../services/auditService';
import { AuditContext } from '../services/auditService';
import { AuditAction } from '@prisma/client';

const createDraftSchema = z.object({
    customerId: z.string().uuid(),
    appointmentIds: z.array(z.string().uuid()).optional(),
    periodStart: z.string().datetime().optional(),
    periodEnd: z.string().datetime().optional(),
    discountPct: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
});

const creditNoteSchema = z.object({
    amount: z.number().positive(),
    reason: z.string().min(5),
});

export const createDraftInvoice = async (req: Request, res: Response) => {
    try {
        const body = createDraftSchema.parse(req.body);
        const { customerId, appointmentIds, periodStart, periodEnd, discountPct, notes } = body;
        const userId = (req as any).user?.id || 'system';

        let appointments: any[] = [];
        if (appointmentIds && appointmentIds.length > 0) {
            appointments = await prisma.appointment.findMany({
                where: {
                    id: { in: appointmentIds },
                    customerId,
                    billingStatus: 'UNBILLED'
                },
                include: { services: true }
            });

            if (appointments.length !== appointmentIds.length) {
                return res.status(409).json({ error: 'Some appointments are invalid, already billed, or belong to another customer.' });
            }
        }

        let subtotal = 0;
        const linesToCreate: any[] = [];

        for (const app of appointments) {
            const appTotal = app.services.reduce((sum: number, s: any) => sum + s.basePrice, 0);
            subtotal += appTotal;

            linesToCreate.push({
                description: `Agendamento ${app.startAt ? new Date(app.startAt).toLocaleDateString('pt-BR') : 'Sem data'}`,
                quantity: 1,
                unitPrice: appTotal,
                lineTotal: appTotal,
                kind: 'APPOINTMENT',
                appointmentId: app.id
            });
        }

        let discountTotal = 0;
        if (discountPct && discountPct > 0) {
            discountTotal = subtotal * (discountPct / 100);
        }
        const total = Math.max(0, subtotal - discountTotal);

        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    id: randomUUID(),
                    customerId,
                    status: 'DRAFT',
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    subtotal,
                    discountTotal,
                    amount: total,
                    periodStart: periodStart ? new Date(periodStart) : undefined,
                    periodEnd: periodEnd ? new Date(periodEnd) : undefined,
                    currency: 'BRL',
                    notes,
                    createdByUserId: userId,
                    lines: {
                        create: linesToCreate
                    }
                },
                include: { lines: true }
            });

            if (appointmentIds && appointmentIds.length > 0) {
                await tx.appointment.updateMany({
                    where: { id: { in: appointmentIds } },
                    data: { billingStatus: 'INVOICED' }
                });
            }

            return invoice;
        });

        res.status(201).json(result);

    } catch (error) {
        console.error('Error creating draft invoice:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Failed to create draft invoice' });
    }
};

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const { customerId, status } = req.query;
        const where: any = { deletedAt: null };

        if (customerId) where.customerId = String(customerId);
        if (status) where.status = String(status);

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                customer: { select: { name: true } },
                lines: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                lines: {
                    include: {
                        appointment: {
                            include: {
                                pet: true,
                                posOrder: {
                                    select: {
                                        id: true,
                                        seqId: true,
                                        status: true,
                                        finalAmount: true
                                    }
                                }
                            }
                        }
                    }
                },
                ledgerEntries: true,
                paymentRecords: true
            }
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
};

export const issueInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUniqueOrThrow({ where: { id } });

            if (invoice.status !== 'DRAFT') {
                throw new Error('Only DRAFT invoices can be issued');
            }

            const updated = await tx.invoice.update({
                where: { id },
                data: { status: 'ISSUED' }
            });

            await tx.ledgerEntry.create({
                data: {
                    id: randomUUID(),
                    customerId: invoice.customerId,
                    type: 'INVOICE_DEBIT',
                    amount: invoice.amount,
                    direction: 'DEBIT',
                    invoiceId: invoice.id,
                    reference: `Fatura #${invoice.id.substring(0, 8)}`,
                    createdByUserId: userId
                }
            });

            await auditService.logInvoiceEvent((req as any).audit as AuditContext, updated, AuditAction.INVOICE_ISSUED,
                `Fatura de R$ ${invoice.amount.toFixed(2)} emitida para o cliente.`
            );

            return updated;
        });

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message || 'Failed to issue invoice' });
    }
};

export const voidInvoice = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id },
                include: { lines: true }
            });

            if (!invoice) throw new Error('Invoice not found');
            if (invoice.status === 'PAID') throw new Error('Cannot void PAID invoice');
            if (invoice.status === 'VOID') throw new Error('Already VOID');

            const updated = await tx.invoice.update({
                where: { id },
                data: { status: 'VOID' }
            });

            const appointmentIds = invoice.lines
                .map(l => l.appointmentId)
                .filter((id): id is string => !!id);

            if (appointmentIds.length > 0) {
                await tx.appointment.updateMany({
                    where: { id: { in: appointmentIds } },
                    data: { billingStatus: 'UNBILLED' }
                });
            }

            if (invoice.status === 'ISSUED') {
                await tx.ledgerEntry.create({
                    data: {
                        id: randomUUID(),
                        customerId: invoice.customerId,
                        type: 'ADJUSTMENT',
                        amount: invoice.amount,
                        direction: 'CREDIT',
                        invoiceId: invoice.id,
                        reference: `Estorno Fatura #${invoice.id.substring(0, 8)}`,
                        createdByUserId: userId
                    }
                });
            }

            await auditService.logInvoiceEvent((req as any).audit as AuditContext, updated, AuditAction.INVOICE_VOIDED,
                `Fatura #${invoice.id.substring(0, 8)} cancelada.`
            );

            return updated;
        });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const paymentInputSchema = z.object({
    customerId: z.string().uuid(),
    amount: z.number().positive(),
    method: z.string().optional(),
    reference: z.string().optional(),
});

export const createPayment = async (req: Request, res: Response) => {
    try {
        const { customerId, amount, method, reference } = paymentInputSchema.parse(req.body);
        const userId = (req as any).user?.id;

        const entry = await prisma.ledgerEntry.create({
            data: {
                id: randomUUID(),
                customerId,
                type: 'PAYMENT_CREDIT',
                amount,
                direction: 'CREDIT',
                reference: reference || `Pagamento via ${method || 'Manual'}`,
                createdByUserId: userId
            }
        });

        await auditService.logLedgerEvent((req as any).audit as AuditContext, entry, AuditAction.PAYMENT_CREATED,
            `Pagamento de R$ ${amount.toFixed(2)} registrado via ${method || 'Manual'}`
        );

        res.status(201).json(entry);
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: 'Failed to record payment' });
    }
};

export const getLedger = async (req: Request, res: Response) => {
    // ... existing implementation
    try {
        const { customerId } = req.query;
        if (!customerId) return res.status(400).json({ error: 'customerId required' });

        const entries = await prisma.ledgerEntry.findMany({
            where: { customerId: String(customerId) },
            orderBy: { createdAt: 'desc' }
        });

        let balance = 0;
        entries.forEach(e => {
            if (e.direction === 'DEBIT') balance += e.amount;
            else if (e.direction === 'CREDIT') balance -= e.amount;
        });

        res.json({ balance, entries });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ledger' });
    }
};

export const createCreditNote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    try {
        const { amount, reason } = creditNoteSchema.parse(req.body);

        const result = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUniqueOrThrow({
                where: { id },
                include: { customer: true }
            });

            if (invoice.status === 'VOID' || invoice.status === 'DRAFT') {
                throw new Error('Credit notes can only be created for ISSUED or PAID invoices');
            }

            // Create negative line
            const line = await tx.invoiceLine.create({
                data: {
                    id: randomUUID(),
                    invoiceId: invoice.id,
                    description: `Credit Note: ${reason}`,
                    quantity: 1,
                    unitPrice: -amount,
                    lineTotal: -amount,
                    kind: 'ADJUSTMENT'
                }
            });

            // Create ledger credit
            const entry = await tx.ledgerEntry.create({
                data: {
                    id: randomUUID(),
                    customerId: invoice.customerId,
                    type: 'ADJUSTMENT',
                    amount: amount,
                    direction: 'CREDIT',
                    invoiceId: invoice.id,
                    reference: `Nota de Crédito via Fatura #${invoice.id.substring(0, 8)}: ${reason}`,
                    createdByUserId: userId
                }
            });

            // Update invoice total amount? Usually credit notes reduce the balance, 
            // but the invoice amount reflects the subtotal - discounts.
            // We'll keep the invoice amount as is and let the ledger handle the balance.

            await auditService.logEvent((req as any).audit as AuditContext, {
                targetType: 'INVOICE',
                targetId: invoice.id,
                action: AuditAction.BILLING_CREDIT_NOTE,
                summary: `Nota de crédito de R$ ${amount.toFixed(2)} gerada: ${reason}`,
                meta: { amount, reason, lineId: line.id, entryId: entry.id }
            }, tx);

            return { line, entry };
        });

        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
