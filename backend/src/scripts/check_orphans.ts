import 'dotenv/config';
import prisma from '../lib/prisma';


async function main() {
    const activeQuotes = await prisma.quote.count({ where: { deletedAt: null } });
    const deletedQuotes = await prisma.quote.count({ where: { NOT: { deletedAt: null } } });

    const activeAppointments = await prisma.appointment.count({ where: { deletedAt: null } });
    const activeAppointmentsLinkedToDeletedQuotes = await prisma.appointment.count({
        where: {
            deletedAt: null,
            quote: { NOT: { deletedAt: null } }
        }
    });

    console.log('--- Operation Check ---');
    console.log('Active Quotes:', activeQuotes);
    console.log('Deleted Quotes:', deletedQuotes);
    console.log('Active Appointments:', activeAppointments);
    console.log('Active Appts linked to Deleted Quotes:', activeAppointmentsLinkedToDeletedQuotes);

    const activeInvoices = await prisma.invoice.count({ where: { deletedAt: null } });
    const activeInvoicesLinkedToDeletedQuotes = await prisma.invoice.count({
        where: {
            deletedAt: null,
            quotes: { some: { NOT: { deletedAt: null } } }
        }
    });
    console.log('Active Invoices:', activeInvoices);
    console.log('Active Invoices linked to Deleted Quotes:', activeInvoicesLinkedToDeletedQuotes);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
