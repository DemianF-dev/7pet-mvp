import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pets = await prisma.pet.findMany({
        where: { name: { contains: 'Chloe', mode: 'insensitive' } },
        include: {
            customer: true,
            appointments: {
                include: {
                    invoice: true,
                    invoiceLines: { include: { invoice: true } },
                    quote: { include: { invoice: true } },
                    posOrder: { include: { payments: true } }
                }
            }
        }
    });

    console.log(JSON.stringify(pets, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
