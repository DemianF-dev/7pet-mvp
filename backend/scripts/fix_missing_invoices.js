const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingInvoices() {
    console.log('Checking for Approved Quotes without Invoices...');

    const approvedQuotes = await prisma.quote.findMany({
        where: {
            status: 'APROVADO',
            deletedAt: null
        }
    });

    let fixedCount = 0;

    for (const quote of approvedQuotes) {
        const invoice = await prisma.invoice.findUnique({
            where: { quoteId: quote.id }
        });

        if (!invoice) {
            console.log(`Fixing missing invoice for Quote ID: ${quote.id} (Customer: ${quote.customerId})`);

            await prisma.invoice.create({
                data: {
                    customerId: quote.customerId,
                    quoteId: quote.id,
                    amount: quote.totalAmount,
                    status: 'PENDENTE',
                    // Default due date to now + 7 days, or desiredAt if future
                    dueDate: quote.desiredAt && quote.desiredAt > new Date() ? quote.desiredAt : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });
            fixedCount++;
        }
    }

    console.log(`\nOperation completed. Fixed ${fixedCount} missing invoices.`);
    await prisma.$disconnect();
}

fixMissingInvoices();
