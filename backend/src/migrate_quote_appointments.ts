
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Iniciando migração de relacionamentos Quote -> Appointment...');

    const quotes = await prisma.quote.findMany({
        where: {
            status: 'AGENDADO',
            appointments: {
                none: {}
            }
        },
        include: {
            customer: true,
            pet: true
        }
    });

    console.log(`🔎 Encontrados ${quotes.length} orçamentos AGENDADO sem agendamentos vinculados.`);

    for (const quote of quotes) {
        console.log(`\nProcessando Orçamento ${quote.id} (${quote.customer.name}, Pet: ${quote.pet?.name || 'N/A'})...`);

        // Find potential matching appointments
        // Created AFTER quote creation (or same day)
        const minDate = new Date(quote.createdAt);
        minDate.setHours(0, 0, 0, 0);

        const appointments = await prisma.appointment.findMany({
            where: {
                customerId: quote.customerId,
                petId: quote.petId || undefined,
                createdAt: { gte: minDate },
                quoteId: null // Only link if not already linked
            },
            orderBy: { createdAt: 'asc' }
        });

        if (appointments.length === 0) {
            console.log('   ❌ Nenhum agendamento potencial encontrado.');
            continue;
        }

        console.log(`   ✅ Encontrados ${appointments.length} agendamentos potenciais.`);

        // Strategy:
        // If Logic: SPA_TRANSPORTE -> Try to find SPA + LOGISTICA
        // IF SPA -> Try to find SPA
        // IF TRANSPORTE -> Try to find LOGISTICA

        let linkedCount = 0;

        for (const appt of appointments) {
            // Check category match heuristically
            let match = false;

            if (quote.type === 'SPA' && appt.category === 'SPA') match = true;
            else if (quote.type === 'TRANSPORTE' && appt.category === 'LOGISTICA') match = true;
            else if (quote.type === 'SPA_TRANSPORTE') {
                if (appt.category === 'SPA' || appt.category === 'LOGISTICA') match = true;
            }

            // Also check status, assume PENDENTE or CONFIRMADO or AGENDADO related

            if (match) {
                console.log(`      🔗 Vinculando Agendamento ${appt.id} (${appt.category}) ao Orçamento ${quote.id}`);
                await prisma.appointment.update({
                    where: { id: appt.id },
                    data: { quoteId: quote.id }
                });
                linkedCount++;
            }
        }

        if (linkedCount > 0) {
            console.log(`      ✨ Orçamento ${quote.id} atualizado com ${linkedCount} agendamentos.`);
        } else {
            console.log(`      ⚠️ Nenhuma correspondência de categoria encontrada.`);
        }
    }

    console.log('\n🏁 Migração concluída.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
