
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const transportServices = await prisma.service.findMany({
        where: {
            OR: [
                { name: { contains: 'Transporte', mode: 'insensitive' } },
                { name: { contains: 'Taxi', mode: 'insensitive' } },
                { name: { contains: 'Leva', mode: 'insensitive' } },
                { name: { contains: 'Traz', mode: 'insensitive' } }
            ]
        }
    });

    console.log('--- SERVIÇOS DE TRANSPORTE ENCONTRADOS ---');
    if (transportServices.length === 0) {
        console.log('Nenhum serviço de transporte encontrado.');
    } else {
        transportServices.forEach(s => {
            console.log(`[${s.id}] ${s.name} - R$ ${s.basePrice}`);
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
