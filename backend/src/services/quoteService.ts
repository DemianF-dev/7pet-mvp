import prisma from '../lib/prisma';
import { QuoteDependencies, CascadeDeleteOptions } from '../types/QuoteDependencies';
import { messagingService } from './messagingService';

/**
 * Verifica dependências de um orçamento (appointments e invoices)
 */
export const checkDependencies = async (id: string): Promise<QuoteDependencies> => {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            appointments: {
                include: {
                    services: { select: { name: true } },
                    transport: true
                }
            },
            invoice: true
        }
    });

    if (!quote) {
        throw new Error('Orçamento não encontrado');
    }

    // Separar appointments por categoria
    const spaAppointments = quote.appointments.filter(a => a.category === 'SPA' && !a.deletedAt);
    const transportAppointments = quote.appointments.filter(a => a.category === 'LOGISTICA' && !a.deletedAt);

    const warnings: string[] = [];

    // Avisos baseados no status da invoice
    if (quote.invoice && !quote.invoice.deletedAt) {
        if (quote.invoice.status === 'PAGO') {
            warnings.push('⚠️ Fatura já foi paga. Deletar pode impactar o financeiro.');
        } else if (quote.invoice.status === 'PENDENTE') {
            warnings.push('💰 Há uma fatura pendente vinculada a este orçamento.');
        }
    }

    // Avisos baseados no status dos appointments
    const confirmedSpa = spaAppointments.filter(a => a.status === 'CONFIRMADO');
    if (confirmedSpa.length > 0) {
        warnings.push(`🔔 ${confirmedSpa.length} agendamento(s) SPA confirmado(s). Cliente pode ter sido notificado.`);
    }

    const confirmedTransport = transportAppointments.filter(a => a.status === 'CONFIRMADO');
    if (confirmedTransport.length > 0) {
        warnings.push(`🚗 ${confirmedTransport.length} agendamento(s) de transporte confirmado(s).`);
    }

    return {
        quote: {
            id: quote.id,
            seqId: quote.seqId,
            totalAmount: quote.totalAmount,
            status: quote.status
        },
        appointments: {
            spa: spaAppointments.map(a => ({
                id: a.id,
                startAt: a.startAt.toISOString(),
                status: a.status,
                services: a.services.map(s => s.name)
            })),
            transport: transportAppointments.map(a => ({
                id: a.id,
                startAt: a.startAt.toISOString(),
                status: a.status,
                origin: a.transport?.origin,
                destination: a.transport?.destination
            }))
        },
        invoice: quote.invoice && !quote.invoice.deletedAt ? {
            id: quote.invoice.id,
            amount: quote.invoice.amount,
            status: quote.invoice.status,
            dueDate: quote.invoice.dueDate.toISOString()
        } : undefined,
        canDelete: true,
        warnings
    };
};

/**
 * Delete em cascata com opções selecionáveis
 */
export const cascadeDelete = async (
    id: string,
    options: CascadeDeleteOptions,
    performedBy?: string
) => {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: { appointments: true, invoice: true }
    });

    if (!quote) {
        throw new Error('Orçamento não encontrado');
    }

    if (quote.deletedAt) {
        throw new Error('Este orçamento já está na lixeira');
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
        let deletedSpaCount = 0;
        let deletedTransportCount = 0;
        let deletedInvoice = false;

        // 1. Deletar agendamentos SPA se solicitado
        if (options.deleteSpaAppointments) {
            const spaIds = quote.appointments
                .filter(a => a.category === 'SPA' && !a.deletedAt)
                .map(a => a.id);

            if (spaIds.length > 0) {
                const result = await tx.appointment.updateMany({
                    where: { id: { in: spaIds } },
                    data: { deletedAt: now }
                });
                deletedSpaCount = result.count;
            }
        }

        // 2. Deletar agendamentos de transporte se solicitado
        if (options.deleteTransportAppointments) {
            const transportIds = quote.appointments
                .filter(a => a.category === 'LOGISTICA' && !a.deletedAt)
                .map(a => a.id);

            if (transportIds.length > 0) {
                const result = await tx.appointment.updateMany({
                    where: { id: { in: transportIds } },
                    data: { deletedAt: now }
                });
                deletedTransportCount = result.count;
            }
        }

        // 3. Unlink invoice if requested (better than deleting to maintain history, or use soft-delete if preferred)
        if (options.deleteInvoice && quote.invoice && !quote.invoice.deletedAt) {
            await tx.invoice.update({
                where: { id: quote.invoice.id },
                data: {
                    deletedAt: now,
                    quoteId: null, // Unlink it from the quote
                    appointmentId: null // Unlink from appt too just in case
                }
            });
            deletedInvoice = true;
        }

        // 4. Sempre deletar o quote (soft delete)
        await tx.quote.update({
            where: { id },
            data: { deletedAt: now }
        });

        // 5. Log de auditoria (se necessário)
        // Pode ser implementado através do auditLogger se disponível
        console.log(`[CASCADE DELETE] Quote ${quote.seqId} deleted by ${performedBy || 'system'}`, {
            deletedSpaAppointments: deletedSpaCount,
            deletedTransportAppointments: deletedTransportCount,
            deletedInvoice,
            timestamp: now
        });
    });

    return {
        success: true,
        message: 'Orçamento e itens selecionados movidos para a lixeira'
    };
};

/**
 * One-Click Approval & Scheduling
 */
export const approveAndSchedule = async (id: string, performerId?: string, authUser?: any) => {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            items: true,
            customer: { include: { user: true } },
            pet: true
        }
    });

    if (!quote) throw new Error('Orçamento não encontrado');
    if (quote.status === 'AGENDADO' || quote.status === 'ENCERRADO') {
        throw new Error('Este orçamento já está em um status finalizado (já agendado ou encerrado).');
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Approve Quote
        await tx.quote.update({
            where: { id },
            data: {
                status: 'APROVADO',
                statusHistory: {
                    create: {
                        oldStatus: quote.status,
                        newStatus: 'APROVADO',
                        changedBy: authUser?.id || 'SYSTEM',
                        reason: 'Aprovação e Agendamento Automático (One-Click)'
                    }
                }
            }
        });

        // 2. Create Invoice
        const existingInvoice = await tx.invoice.findUnique({ where: { quoteId: id } });
        if (!existingInvoice) {
            await tx.invoice.create({
                data: {
                    customerId: quote.customerId,
                    quoteId: id,
                    amount: quote.totalAmount,
                    status: 'PENDENTE',
                    dueDate: quote.desiredAt || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                }
            });
        }

        const appointments = [];

        // 3. Create SPA Appointment if applicable
        if (quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE') {
            const appt = await tx.appointment.create({
                data: {
                    customerId: quote.customerId,
                    petId: quote.petId!,
                    startAt: quote.scheduledAt || quote.desiredAt || new Date(),
                    status: 'CONFIRMADO',
                    category: 'SPA',
                    quoteId: id,
                    performerId: performerId || undefined,
                    services: {
                        connect: quote.items.filter(i => i.serviceId).map(i => ({ id: i.serviceId! }))
                    }
                }
            });
            appointments.push(appt);
        }

        // 4. Create Logistics Appointment if applicable
        if (quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') {
            const appt = await tx.appointment.create({
                data: {
                    customerId: quote.customerId,
                    petId: quote.petId!,
                    startAt: quote.transportAt || quote.desiredAt || new Date(),
                    status: 'CONFIRMADO',
                    category: 'LOGISTICA',
                    quoteId: id,
                    transport: {
                        create: {
                            origin: quote.transportOrigin || 'Endereço do Cliente',
                            destination: quote.transportDestination || '7Pet',
                            requestedPeriod: quote.transportPeriod || 'MANHA'
                        }
                    }
                }
            });
            appointments.push(appt);
        }

        // 5. Final Status Update
        await tx.quote.update({
            where: { id },
            data: { status: 'AGENDADO' }
        });

        return appointments;
    });

    // 6. Notifications
    if (quote.customer.user) {
        await messagingService.notifyUser(
            quote.customer.user.id,
            'Orçamento Aprovado e Agendado!',
            `Olá ${quote.customer.name}! Seu orçamento para o pet ${quote.pet?.name} foi aprovado e acabamos de confirmar os agendamentos no sistema. Você pode conferir os detalhes no seu painel.`,
            'APPOINTMENT_CONFIRMED'
        );
    }

    return result;
};
