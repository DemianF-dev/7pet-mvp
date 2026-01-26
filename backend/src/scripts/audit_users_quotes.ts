
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                customer: {
                    include: {
                        _count: {
                            select: { quotes: true }
                        }
                    }
                }
            }
        });

        console.log('--- USER DATA REPORT ---');
        users.forEach(u => {
            console.log(`User: ${u.email} | Role: ${u.role}`);
            if (u.customer) {
                console.log(`  - Customer: ${u.customer.name} (ID: ${u.customer.id})`);
                console.log(`  - Quotes Count: ${u.customer._count.quotes}`);
            } else {
                console.log(`  - No Customer Profile linked.`);
            }
            console.log('------------------------------------------------');
        });

    } catch (error: any) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
