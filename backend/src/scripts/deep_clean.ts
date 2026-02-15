import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log('🚀 Iniciando limpeza sequencial de registros (não-transacional para evitar timeout)...');

    const tables = [
        // 1. Logística e Agendas
        { name: 'TransportLegExecution', op: () => prisma.transportLegExecution.deleteMany({}) },
        { name: 'TransportLeg', op: () => prisma.transportLeg.deleteMany({}) },
        { name: 'TransportDetails', op: () => prisma.transportDetails.deleteMany({}) },
        { name: 'TransportPricingSnapshot', op: () => prisma.transportPricingSnapshot.deleteMany({}) },
        { name: 'ServiceExecution', op: () => prisma.serviceExecution.deleteMany({}) },
        { name: 'StatusHistory', op: () => prisma.statusHistory.deleteMany({}) },
        { name: 'AppointmentInvoiceLink', op: () => prisma.appointmentInvoiceLink.deleteMany({}) },
        { name: 'Appointment', op: () => prisma.appointment.deleteMany({}) },
        { name: 'SchedulePlan', op: () => prisma.schedulePlan.deleteMany({}) },

        // 2. Financeiro
        { name: 'PaymentRecord', op: () => prisma.paymentRecord.deleteMany({}) },
        { name: 'LedgerEntry', op: () => prisma.ledgerEntry.deleteMany({}) },
        { name: 'FinancialTransaction', op: () => prisma.financialTransaction.deleteMany({}) },
        { name: 'DebitCreditNote', op: () => prisma.debitCreditNote.deleteMany({}) },
        { name: 'InvoiceLine', op: () => prisma.invoiceLine.deleteMany({}) },
        { name: 'Unlink Quotes', op: () => prisma.quote.updateMany({ data: { invoiceId: null } }) },
        { name: 'Invoice', op: () => prisma.invoice.deleteMany({}) },

        // 3. Orçamentos
        { name: 'QuoteItem', op: () => prisma.quoteItem.deleteMany({}) },
        { name: 'Quote', op: () => prisma.quote.deleteMany({}) },

        // 4. PDV & Caixa
        { name: 'FiscalDocument', op: () => prisma.fiscalDocument.deleteMany({}) },
        { name: 'InventoryMovement', op: () => prisma.inventoryMovement.deleteMany({}) },
        { name: 'OrderItem', op: () => prisma.orderItem.deleteMany({}) },
        { name: 'OrderPayment', op: () => prisma.orderPayment.deleteMany({}) },
        { name: 'Order', op: () => prisma.order.deleteMany({}) },
        { name: 'CashSession', op: () => prisma.cashSession.deleteMany({}) },

        // 5. Comunicação
        { name: 'Notification', op: () => prisma.notification.deleteMany({}) },
        { name: 'Message', op: () => prisma.message.deleteMany({}) },
        { name: 'Participant', op: () => prisma.participant.deleteMany({}) },
        { name: 'Conversation', op: () => prisma.conversation.deleteMany({}) },

        // 6. Auditoria
        { name: 'AuditEvent', op: () => prisma.auditEvent.deleteMany({}) },
        { name: 'AuditLog', op: () => prisma.auditLog.deleteMany({}) },
        { name: 'HrAuditLog', op: () => prisma.hrAuditLog.deleteMany({}) },

        // 7. Gamificação
        { name: 'PauseSession', op: () => prisma.pauseSession.deleteMany({}) },

        // 8. Contratos
        { name: 'PackageInvoiceLine', op: () => prisma.packageInvoiceLine.deleteMany({}) },
        { name: 'PackageInvoice', op: () => prisma.packageInvoice.deleteMany({}) },
        { name: 'PackageItem', op: () => prisma.packageItem.deleteMany({}) },
        { name: 'RecurrenceContract', op: () => prisma.recurrenceContract.deleteMany({}) },
        { name: 'RecurringPackage', op: () => prisma.recurringPackage.deleteMany({}) },

        // 9. Feed
        { name: 'Reaction', op: () => prisma.reaction.deleteMany({}) },
        { name: 'Comment', op: () => prisma.comment.deleteMany({}) },
        { name: 'Post', op: () => prisma.post.deleteMany({}) },
        { name: 'Appreciation', op: () => prisma.appreciation.deleteMany({}) }
    ];

    for (const table of tables) {
        try {
            console.log(`Cleaning: ${table.name}...`);
            await table.op();
        } catch (err) {
            console.warn(`⚠️ Erro ao limpar ${table.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    console.log('✅ Limpeza sequencial concluída!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
