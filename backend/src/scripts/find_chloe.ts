import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log('Searching for Chloe or Silvana...');
    const pets = await prisma.pet.findMany({
        where: {
            OR: [
                { name: { contains: 'Chloe', mode: 'insensitive' } },
                { customer: { name: { contains: 'Silvana', mode: 'insensitive' } } }
            ]
        },
        include: {
            customer: true,
            appointments: {
                include: {
                    invoice: true,
                    invoiceLines: {
                        include: {
                            invoice: true
                        }
                    },
                    quote: {
                        include: {
                            invoice: true
                        }
                    },
                    posOrder: {
                        include: {
                            payments: true
                        }
                    }
                },
                orderBy: { startAt: 'desc' },
                take: 5
            }
        }
    });

    if (pets.length === 0) {
        console.log('No pets found for Chloe/Silvana');
        return;
    }

    pets.forEach(pet => {
        console.log(`Pet: ${pet.name} (ID: ${pet.id})`);
        console.log(`Customer: ${pet.customer.name} (ID: ${pet.customerId})`);
        pet.appointments.forEach(app => {
            console.log(`  Appointment ID: ${app.id} (${app.startAt})`);
            console.log(`    Status: ${app.status}, Billing Status: ${app.billingStatus}`);
            console.log(`    Direct Invoice: ${app.invoice?.id || 'None'}`);
            console.log(`    Quote Invoice: ${app.quote?.invoice?.id || 'None'}`);
            console.log(`    Invoice Lines: ${app.invoiceLines.map(l => l.invoiceId).join(', ') || 'None'}`);
            console.log(`    POS Order: ${app.posOrder?.id || 'None'} (Status: ${app.posOrder?.status}, Total: ${app.posOrder?.finalAmount})`);
            if (app.posOrder) {
                console.log(`      Payments: ${app.posOrder.payments.map(p => `${p.method}: ${p.amount}`).join(', ')}`);
            }
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
