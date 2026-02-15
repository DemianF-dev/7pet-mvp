import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const quoteCount = await prisma.quote.count({ where: { deletedAt: null } });
    const trashedQuoteCount = await prisma.quote.count({ where: { NOT: { deletedAt: null } } });
    const invoiceCount = await prisma.invoice.count({ where: { deletedAt: null } });
    const totalRevenue = await prisma.invoice.aggregate({ _sum: { amount: true }, where: { deletedAt: null } });

    console.log('--- DB Check ---');
    console.log('Active Quotes:', quoteCount);
    console.log('Trashed Quotes:', trashedQuoteCount);
    console.log('Active Invoices:', invoiceCount);
    console.log('Total Active Revenue:', totalRevenue._sum.amount || 0);

    const statusCounts = await prisma.quote.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true
    });
    console.log('Status Counts:', statusCounts);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
