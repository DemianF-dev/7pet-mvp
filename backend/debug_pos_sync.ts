import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: 'Silvana', mode: 'insensitive' } },
                { name: { contains: 'Chloe', mode: 'insensitive' } },
            ]
        },
        include: {
            appointments: {
                include: {
                    invoice: true,
                    invoiceLines: { include: { invoice: true } },
                    quote: { include: { invoice: true } },
                    posOrder: true
                }
            },
            pets: true
        }
    });

    console.log(JSON.stringify(customers, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
